import { createClient } from "@supabase/supabase-js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) throw new Error("File tidak ada");

    // VALIDASI DASAR (ini yang kamu skip sebelumnya)
    if (!file.name.endsWith(".docx")) {
      throw new Error("File harus .docx");
    }

    if (file.size === 0) {
      throw new Error("File kosong / corrupt");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("FILE:", file.name);
    console.log("SIZE:", file.size);
    console.log("BUFFER LENGTH:", buffer.length);

    if (buffer.length === 0) {
      throw new Error("Buffer kosong");
    }

    const fileName = `${Date.now()}_${file.name}`;

    // 1. Upload ke storage
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(fileName, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("templates").getPublicUrl(fileName);

    // 2. Extract variable
    let variables = [];
    try {
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const fullText = doc.getFullText();

      variables = [
        ...new Set(
          [...fullText.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].trim())
        ),
      ];
    } catch (e) {
      console.error("DOCXTEMPLATER ERROR:", e);
    }

    // 3. Convert HTML (FIX penting di sini)
    let html_template = null;

    try {
      const htmlResult = await mammoth.convertToHtml({
        buffer,
      });

      console.log("HTML PREVIEW:", htmlResult.value?.slice(0, 200));
      console.log("MESSAGES:", htmlResult.messages);

      if (htmlResult.value && htmlResult.value.trim() !== "") {
        html_template = htmlResult.value;
      } else {
        console.warn("HTML kosong dari mammoth");
      }
    } catch (e) {
      console.error("MAMMOTH ERROR:", e);
    }

    // 4. Simpan DB
    const namaTemplate = file.name.replace(/\.[^/.]+$/, "");

    const { error: dbError } = await supabase.from("templates").insert([
      {
        nama_template: namaTemplate,
        file_url: publicUrl,
        html_template,
        variables,
        approval_flow: [],
      },
    ]);

    if (dbError) throw dbError;

    return Response.json({
      message: "Upload berhasil",
      debug: {
        bufferLength: buffer.length,
        hasHTML: !!html_template,
        variablesCount: variables.length,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}