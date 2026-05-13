// File: src/app/dashboard/actions/approval.js
"use server";

import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pemetaan kolom catatan berdasarkan role
const CATATAN_COL = {
  ADMIN:      "catatan_admin",
  SEKRETARIS: "catatan_sekretaris",
  WAREK:      "catatan_wakil_rektor",
  REKTOR:     "catatan_rektor",
};

// Pemetaan status pending berdasarkan role
const PENDING_STATUS = {
  ADMIN:      "pending_admin",
  SEKRETARIS: "pending_sekretaris",
  WAREK:      "pending_wakil",
  REKTOR:     "pending_rektor",
};

// Urutan alur persetujuan (approval flow) berdasarkan tujuan surat
const FULL_CHAINS = {
  SEKRETARIS: ["ADMIN", "SEKRETARIS"],
  WAREK:      ["ADMIN", "SEKRETARIS", "WAREK"],
  REKTOR:     ["ADMIN", "SEKRETARIS", "WAREK", "REKTOR"],
};

/**
 * Fungsi utama untuk memproses persetujuan (approve/reject) surat.
 */
export async function processApproval(suratId, role, action, catatan = "") {
  // 1. Ambil data surat beserta template-nya
  const { data: surat, error: suratErr } = await supabaseAdmin
    .from("surat")
    .select("id, status, tujuan, nomor_surat, template_id, user_id, templates(approval_flow, nama_template, jenis_surat)")
    .eq("id", suratId)
    .single();

  if (suratErr || !surat) throw new Error("Surat tidak ditemukan");

  // 2. Tentukan alur persetujuan
  const flow = FULL_CHAINS[surat.tujuan] || ["ADMIN"];

  // Matikan console.log untuk versi production agar terminal lebih bersih
  // console.log("tujuan:", surat.tujuan, "flow:", flow);

  if (!flow.includes(role.toUpperCase())) {
    throw new Error(`Role ${role} tidak ada dalam alur persetujuan surat ini`);
  }

  const catatanCol = CATATAN_COL[role.toUpperCase()];
  const now        = new Date().toISOString();

  // ==========================================
  // AKSI: TOLAK SURAT (REJECT)
  // ==========================================
  if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("surat")
      .update({
        status: "rejected",
        ...(catatanCol && catatan ? { [catatanCol]: catatan } : {}),
      })
      .eq("id", suratId);

    if (error) throw new Error("Gagal menolak surat: " + error.message);

    // Upsert — aman meski record belum ada
    const { error: stepErr } = await supabaseAdmin
      .from("approval_steps")
      .upsert(
        {
          surat_id:   suratId,
          role:       role.toLowerCase(),
          status:     "rejected",
          catatan:    catatan || null,
          updated_at: now,
        },
        { onConflict: "surat_id,role" }
      );

    if (stepErr) throw new Error("Gagal update approval_steps (reject): " + stepErr.message);

    return { ok: true, action: "rejected" };
  }

  // ==========================================
  // AKSI: SETUJUI SURAT (APPROVE)
  // ==========================================
  // Tandai langkah persetujuan saat ini sebagai selesai
  const { error: approveStepErr } = await supabaseAdmin
    .from("approval_steps")
    .upsert(
      {
        surat_id:   suratId,
        role:       role.toLowerCase(),
        status:     "approved",
        catatan:    catatan || null,
        updated_at: now,
      },
      { onConflict: "surat_id,role" }
    );

  if (approveStepErr) throw new Error("Gagal update approval_steps (approve): " + approveStepErr.message);

  // Cari siapa yang harus menyetujui selanjutnya
  const currentIdx = flow.indexOf(role.toUpperCase());
  const nextRole   = flow[currentIdx + 1] || null;

  // Jika masih ada tahap selanjutnya (Forward)
  if (nextRole) {
    const newStatus = PENDING_STATUS[nextRole];

    const { error } = await supabaseAdmin
      .from("surat")
      .update({
        status: newStatus,
        ...(catatanCol && catatan ? { [catatanCol]: catatan } : {}),
      })
      .eq("id", suratId);

    if (error) throw new Error("Gagal meneruskan surat: " + error.message);

    // Upsert step berikutnya jadi "pending"
    const { error: nextStepErr } = await supabaseAdmin
      .from("approval_steps")
      .upsert(
        {
          surat_id:   suratId,
          role:       nextRole.toLowerCase(),
          status:     "pending",
          updated_at: now,
        },
        { onConflict: "surat_id,role" }
      );

    if (nextStepErr) throw new Error("Gagal update approval_steps (next): " + nextStepErr.message);

    return { ok: true, action: "forwarded", nextRole };
  }

  // ==========================================
  // TAHAP TERAKHIR: Pengesahan Surat & Generate Nomor
  // ==========================================
  const nomor = await generateNomor(suratId, surat);

  const { error: finalErr } = await supabaseAdmin
    .from("surat")
    .update({
      status:      "approved",
      nomor_surat: nomor,
      ...(catatanCol && catatan ? { [catatanCol]: catatan } : {}),
    })
    .eq("id", suratId);

  if (finalErr) throw new Error("Gagal mengesahkan surat: " + finalErr.message);

  return { ok: true, action: "approved", nomor_surat: nomor };
}

/**
 * Fungsi bantuan untuk membuat format nomor surat secara otomatis.
 */
async function generateNomor(suratId, surat) {
  const userId = surat.user_id;
  const tahun  = new Date().getFullYear();

  // Ambil profil pembuat surat untuk mengecek role
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, nama")
    .eq("id", userId)
    .single();

  const isFakultas = profile?.role === "FAKULTAS";

  // Bersihkan nama fakultas untuk dijadikan slug (hanya jika role = FAKULTAS)
  const slug = isFakultas
    ? (profile.nama || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")
    : null;

  // Tentukan pengaturan mana yang mau diambil dari database
  const keysToFetch = isFakultas
    ? [`fakultas_${slug}_nomor_format`, `fakultas_${slug}_prefix`, `fakultas_${slug}_reset_logic`]
    : ["nomor_surat_format", "nomor_reset_logic", "nomor_custom_tokens"];

  const { data: rows } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .in("key", keysToFetch);

  // Ubah array data menjadi object (key-value pair)
  const s = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));

  let fmt, prefix;
  if (isFakultas) {
    fmt    = s[`fakultas_${slug}_nomor_format`] || "{PREFIX}/{NOMOR_URUT:3}/{BULAN_ROMAWI}/{TAHUN}";
    prefix = s[`fakultas_${slug}_prefix`]       || slug;
  } else {
    fmt    = s["nomor_surat_format"] || "{JENIS}/{NOMOR_URUT:3}/{BULAN_ROMAWI}/{TAHUN}";
    prefix = null;
  }

  const customTokens = (!isFakultas && s["nomor_custom_tokens"])
    ? JSON.parse(s["nomor_custom_tokens"])
    : [];

  // Panggil fungsi RPC dari Supabase untuk mendapatkan nomor urut selanjutnya
  const { data: nextNumber, error: counterErr } = isFakultas
    ? await supabaseAdmin.rpc("get_next_nomor_fakultas", {
        p_user_id: userId,
        p_tahun:   tahun,
      })
    : await supabaseAdmin.rpc("get_next_nomor_global", {
        p_tahun: tahun,
      });

  if (counterErr) throw new Error("Gagal generate nomor: " + counterErr.message);

  // Persiapkan variabel untuk mengganti token pada format string
  const now          = new Date();
  const BULAN_ROMAWI = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][now.getMonth()];
  const BULAN_ANGKA  = String(now.getMonth() + 1).padStart(2, "0");
  const TAHUN        = String(now.getFullYear());
  const SEMESTER     = now.getMonth() < 6 ? "GNP" : "GNJ";
  const JENIS        = surat.templates?.jenis_surat || "SK";
  const PREFIX       = prefix || JENIS;

  const systemTokens = { JENIS, TAHUN, BULAN_ROMAWI, BULAN_ANGKA, SEMESTER, PREFIX };
  const customMap    = Object.fromEntries(customTokens.map((t) => [t.name, t.value]));

  // Ganti token seperti {TAHUN} atau {NOMOR_URUT:3} menjadi nilai aslinya
  const nomor = fmt.replace(/\{([^}:]+)(?::(\d+))?\}/g, (_, name, digits) => {
    if (name === "NOMOR_URUT") {
      return String(nextNumber).padStart(parseInt(digits) || 3, "0");
    }
    return systemTokens[name] || customMap[name] || name;
  });

  return nomor;
}