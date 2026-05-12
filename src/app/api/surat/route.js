import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function substituteTemplate(html, data) {
  return html.replace(/\{([^}]+)\}/g, (_, key) => {
    const trimmed = key.trim();
    return data[trimmed] ?? data[key] ?? `{${trimmed}}`;
  });
}

// GET - ambil daftar draft milik user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("surat")
      .select("id, template_id, data_json, created_at, templates(nama_template, kategori)")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - simpan surat baru sebagai draft
export async function POST(req) {
  try {
    const body = await req.json();
    const { template_id, data_json, user_id, is_draft } = body;

    if (!user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: template, error: tErr } = await supabase
      .from("templates")
      .select("approval_flow, html_template")
      .eq("id", template_id)
      .single();

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

    const isi_final = template.html_template
      ? substituteTemplate(template.html_template, data_json || {})
      : "";

    const flow = template.approval_flow || [];
    let status = "draft";
    if (!is_draft) {
      status = "approved";
      if (flow.includes("SEKRETARIS")) status = "pending_sekretaris";
      else if (flow.includes("WAREK"))  status = "pending_wakil";
      else if (flow.includes("REKTOR")) status = "pending_rektor";
    }

    const { data: surat, error: sErr } = await supabase
      .from("surat")
      .insert([{ template_id, data_json, isi_final, status, user_id, nomor_surat: null }])
      .select()
      .single();

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    if (!is_draft && flow.length > 0) {
      const roleMap = { SEKRETARIS: "sekretaris", WAREK: "warek", REKTOR: "rektor" };
      const steps = flow.map((step, idx) => ({
        surat_id: surat.id,
        role: roleMap[step] || step.toLowerCase(),
        status: idx === 0 ? "pending" : "waiting",
      }));
      await supabase.from("approval_steps").insert(steps);
    }

    return NextResponse.json({ success: true, surat_id: surat.id, status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}