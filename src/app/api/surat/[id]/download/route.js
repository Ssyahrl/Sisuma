import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import CloudConvert from "cloudconvert";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "docx";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: surat, error } = await supabase
      .from("surat")
      .select(`id, nomor_surat, data_json, template_id`)
      .eq("id", id)
      .single();

    if (error || !surat) return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
    if (!surat.nomor_surat) return NextResponse.json({ error: "Surat belum memiliki nomor" }, { status: 400 });

    const { data: template } = await supabase
      .from("templates")
      .select("nama_template, file_url")
      .eq("id", surat.template_id)
      .single();

    if (!template?.file_url) return NextResponse.json({ error: "File template tidak ditemukan" }, { status: 404 });

    const fileRes = await fetch(template.file_url);
    if (!fileRes.ok) throw new Error("Gagal mengambil file dari storage");
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    const now = new Date();
    const dataMap = {
      nomor_surat: surat.nomor_surat || "",
      No: surat.nomor_surat || "",
      tanggal: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      tahun: String(now.getFullYear()),
      jenis_surat: template?.nama_template || "",
      ...(surat.data_json || {}),
    };

    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(dataMap);
    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    const baseName = `surat_${surat.nomor_surat.replace(/\//g, "-")}`;

    // Return DOCX
    if (format === "docx") {
      return new NextResponse(docxBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName}.docx"`,
        },
      });
    }

    // Convert ke PDF
    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

    let job = await cloudConvert.jobs.create({
      tasks: {
        "upload-docx":    { operation: "import/upload" },
        "convert-to-pdf": { operation: "convert", input: "upload-docx", input_format: "docx", output_format: "pdf" },
        "export-pdf":     { operation: "export/url", input: "convert-to-pdf" },
      },
    });

    const uploadTask = job.tasks.find(t => t.name === "upload-docx");
    await cloudConvert.tasks.upload(uploadTask, new Blob([docxBuffer]), `${baseName}.docx`);

    job = await cloudConvert.jobs.wait(job.id);

    const exportTask = job.tasks.find(t => t.name === "export-pdf");
    const pdfUrl = exportTask.result.files[0].url;

    const pdfRes = await fetch(pdfUrl);
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });

  } catch (err) {
    console.error("[download/route.js]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}