import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";

function substituteDocx(buffer, data) {
  // Mammoth convert dulu, substitusi di HTML hasil convert
  return buffer;
}

export async function GET(req, { params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Ambil data surat + template
  const { data: surat, error } = await supabase
    .from("surat")
    .select("data_json, templates(file_url, nama_template)")
    .eq("id", id)
    .single();

  if (error || !surat) {
    return new Response("Surat tidak ditemukan", { status: 404 });
  }

  const fileUrl = surat.templates?.file_url;
  if (!fileUrl) {
    return new Response("Template DOCX tidak ditemukan", { status: 404 });
  }

  // Fetch file DOCX dari Supabase Storage
  const docxRes = await fetch(fileUrl);
  if (!docxRes.ok) {
    return new Response("Gagal mengambil file template", { status: 500 });
  }

  const arrayBuffer = await docxRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Convert DOCX → HTML via mammoth
  const { value: rawHtml } = await mammoth.convertToHtml({ buffer });

  // Substitute variabel {Key} dengan data_json
  const data = surat.data_json || {};
  const html = rawHtml.replace(/\{([^}]+)\}/g, (_, key) => {
    const trimmed = key.trim();
    return data[trimmed] ?? data[key] ?? `{${trimmed}}`;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      margin: 2.5cm 3cm 2.5cm 3cm;
      color: #000;
      line-height: 1.8;
    }
    p { margin: 0 0 6px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td { vertical-align: top; padding: 2px 8px; }
    ol { margin: 0 0 8px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

  return new Response(fullHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}