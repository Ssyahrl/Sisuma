import { createClient } from "@supabase/supabase-js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) throw new Error("File tidak ada");

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name}`;

    // 1. Validasi format file (.docx saja)
    if (!file.name.endsWith(".docx")) {
      return Response.json(
        { error: "Format file tidak didukung. Hanya file .docx yang diperbolehkan." },
        { status: 400 }
      );
    }

    // 2. Extract variabel DULU sebelum upload
    let variables, fullText;
    try {
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      fullText = doc.getFullText();
      variables = [...new Set([...fullText.matchAll(/\{([^}]+)\}/g)].map(m => m[1].trim()))];
    } catch {
      return Response.json(
        { error: "File tidak dapat dibaca. Pastikan file .docx tidak rusak." },
        { status: 400 }
      );
    }

    // 3. Validasi: harus ada minimal 1 variabel {xxx}
    if (variables.length === 0) {
      return Response.json(
        { error: "Template ditolak: tidak ditemukan variabel. Pastikan dokumen memiliki minimal satu variabel dalam format {NamaVariabel}." },
        { status: 400 }
      );
    }

    // 4. Baru upload file .docx ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(fileName, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("templates")
      .getPublicUrl(fileName);

    // 5. Konversi .docx ke HTML untuk preview
    const { value: html_template } = await mammoth.convertToHtml({ buffer });

    // 6. Simpan ke DB
    const namaTemplate = file.name.replace(/\.[^/.]+$/, "");
    const { error: dbError } = await supabase.from("templates").insert([{
      nama_template: namaTemplate,
      file_url: publicUrl,
      variables,
      html_template,
      approval_flow: [],
    }]);

    if (dbError) {
      // Kalau DB gagal, hapus file yang sudah terlanjur diupload
      await supabase.storage.from("templates").remove([fileName]);
      throw dbError;
    }

    return Response.json({ message: "Upload berhasil", variables });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}