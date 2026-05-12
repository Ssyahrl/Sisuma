import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    console.log("HIT DOWNLOAD ROUTE, id:", id);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch surat
    const { data: surat, error } = await supabase
      .from("surat")
      .select(`id, nomor_surat, data_json, template_id`)
      .eq("id", id)
      .single();

    console.log("SURAT:", JSON.stringify(surat));
    console.log("ERROR:", error);

    if (error || !surat) return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
    if (!surat.nomor_surat) return NextResponse.json({ error: "Surat belum memiliki nomor" }, { status: 400 });

    // 2. Fetch template terpisah
    const { data: template, error: tErr } = await supabase
      .from("templates")
      .select("nama_template, file_url")
      .eq("id", surat.template_id)
      .single();

    console.log("TEMPLATE:", JSON.stringify(template));
    console.log("TEMPLATE ERR:", tErr);

    const fileUrl = template?.file_url;
    console.log("FILE URL:", fileUrl);

    if (!fileUrl) return NextResponse.json({ error: "File template tidak ditemukan" }, { status: 404 });

    // 3. Fetch file .docx dari storage
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error("Gagal mengambil file dari storage");
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    // 4. Isi variabel
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

    const outputBuffer = doc.getZip().generate({ type: "nodebuffer" });
    const fileName = `surat_${surat.nomor_surat.replace(/\//g, "-")}.docx`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (err) {
    console.error("[download/route.js]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}