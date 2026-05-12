// app/api/surat/[id]/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch surat + template name
    const { data: surat, error } = await supabase
      .from("surat")
      .select(`
        id,
        nomor_surat,
        status,
        tujuan,
        user_id,
        data_json,
        form_data,
        catatan_admin,
        catatan_sekretaris,
        catatan_wakil_rektor,
        catatan_rektor,
        created_at,
        templates (
          id,
          nama_template
        )
      `)
      .eq("id", id)
      .single();

    if (error || !surat) {
      return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
    }

    // 2. Fetch approval steps (urut ascending supaya chain-nya runtut)
    const { data: approvalSteps, error: stepsError } = await supabase
      .from("approval_steps")
      .select(`
        id,
        role,
        status,
        catatan,
        approved_by,
        updated_at
      `)
      .eq("surat_id", id)
      .order("id", { ascending: true });

    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    const isi_final = substituteTemplate(
  surat.templates.html_template || "",
  new_data_json,
);

console.log('html_template ada?:', !!surat.templates.html_template);
console.log('isi_final hasil:', isi_final?.slice(0, 100));

    return NextResponse.json({
      surat,
      approvalSteps: approvalSteps || [],
    });
    

  } catch (err) {
    console.error("[surat/[id]/route.js]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}