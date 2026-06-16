import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const APPROVAL_CHAINS = {
  SEKRETARIS: ["SEKRETARIS"],
  WAREK:      ["SEKRETARIS", "WAREK"],
  REKTOR:     ["SEKRETARIS", "WAREK", "REKTOR"],
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getUser(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { user: null };
  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    
    // Validasi expiry
    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      return { user: null, error: new Error("Token expired") };
    }
    
    return { user: { id: payload.sub, email: payload.email }, error: null };
  } catch {
    return { user: null, error: new Error("Invalid token") };
  }
}



export async function POST(req) {
  try {
    const { user, error: authError } = await getUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { template_id, values, tujuan, catatan } = await req.json();

    if (!template_id || !values || !tujuan || !APPROVAL_CHAINS[tujuan]) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Ambil template untuk generate isi_final
    // Ambil template — tambah jenis_surat
const { data: template, error: templateError } = await supabase
  .from("templates")
  .select("html_template, jenis_surat") // ← tambah jenis_surat
  .eq("id", template_id)
  .single();

if (templateError) throw templateError;

const jenis_surat = template.jenis_surat ?? "SK";

// Generate isi_final
const isi_final = template?.html_template
  ? template.html_template.replace(/\{([^}]+)\}/g, (_, key) => {
      const trimmed = key.trim();
      return values[trimmed] ?? values[key] ?? `{${trimmed}}`;
    })
  : null;

// Insert surat — simpan jenis_surat
const { data: suratBaru, error: suratError } = await supabase
  .from("surat")
  .insert({
    template_id,
    data_json: values,
    form_data: values,
    isi_final,
    nomor_surat: null,
    status: "pending_sekretaris",
    tujuan,
    jenis_surat,              // ← tambah ini (pastikan kolom ada di tabel)
    catatan_admin: catatan || null,
    user_id: user.id,
  })
  .select()
  .single();
    if (suratError) throw suratError;

    // Insert approval_steps
    const steps = APPROVAL_CHAINS[tujuan].map((role, index) => ({
      surat_id: suratBaru.id,
      role: role.toLowerCase(),
      status: index === 0 ? "pending" : "waiting",
      
      catatan: null,
      approved_by: null,
    }));

    const { error: stepsError } = await supabase
      .from("approval_steps")
      .insert(steps);

    if (stepsError) throw stepsError;

    return NextResponse.json({ success: true, surat_id: suratBaru.id });

  } catch (err) {
    console.error("[POST /api/surat/admin]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { user, error: authError } = await getUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("surat")
      .select(`
        id, nomor_surat, status, tujuan, created_at, data_json, isi_final,
        templates (nama_template),
        approval_steps (id, role, status, catatan, approved_by, updated_at)
      `)
      .eq("user_id", user.id)
      .not("tujuan", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });

  } catch (err) {
    console.error("[GET /api/surat/admin]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}