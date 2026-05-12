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

    // 1. Upload file .docx asli ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(fileName, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("templates")
      .getPublicUrl(fileName);

    // 2. Extract variabel dari docx
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    const fullText = doc.getFullText();
    const variables = [...new Set([...fullText.matchAll(/\{([^}]+)\}/g)].map(m => m[1].trim()))];

    // 3. Konversi .docx ke HTML untuk preview
    const { value: html_template } = await mammoth.convertToHtml({ buffer });

    // 4. Simpan ke DB (termasuk html_template)
    const namaTemplate = file.name.replace(/\.[^/.]+$/, "");
    const { error: dbError } = await supabase.from("templates").insert([{
      nama_template: namaTemplate,
      file_url: publicUrl,
      variables,
      html_template,   // <-- ini yang bikin preview bisa jalan
      approval_flow: [],
    }]);
    if (dbError) throw dbError;

    return Response.json({ message: "Upload berhasil" });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}