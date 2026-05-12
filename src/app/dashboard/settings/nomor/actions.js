"use server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const KNOWN_FIELDS = ["nomor_format", "prefix", "reset_logic"];

// ── GLOBAL ────────────────────────────────────────────────────────────────────
export async function saveNomorSettings({ format, resetLogic, startFrom, customTokens }) {
  const results = await Promise.all([
    supabaseAdmin.from("settings").upsert({ key: "nomor_surat_format",  value: format },                       { onConflict: "key" }),
    supabaseAdmin.from("settings").upsert({ key: "nomor_reset_logic",   value: resetLogic },                   { onConflict: "key" }),
    supabaseAdmin.from("settings").upsert({ key: "nomor_awal",          value: String(startFrom) },            { onConflict: "key" }),
    supabaseAdmin.from("settings").upsert({ key: "nomor_custom_tokens", value: JSON.stringify(customTokens) }, { onConflict: "key" }),
  ]);
  const err = results.find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  return { ok: true };
}

export async function loadNomorSettings() {
  const { data: rows, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .in("key", ["nomor_surat_format", "nomor_reset_logic", "nomor_awal", "nomor_custom_tokens"]);
  if (error) throw new Error(error.message);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ── RESET COUNTER ADMIN ───────────────────────────────────────────────────────
export async function resetAdminCounter() {
  const tahun = new Date().getFullYear();
  const { error } = await supabaseAdmin
    .from("nomor_counter")
    .delete()
    .eq("jenis_surat", "GLOBAL")
    .is("template_id", null)
    .eq("tahun", tahun);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function loadAdminCounter() {
  const tahun = new Date().getFullYear();
  const { data } = await supabaseAdmin
    .from("nomor_counter")
    .select("last_number")
    .eq("jenis_surat", "GLOBAL")
    .is("template_id", null)
    .eq("tahun", tahun)
    .single();
  const next = (data?.last_number ?? 0) + 1;
  return String(next).padStart(3, "0");
}

// ── FAKULTAS ──────────────────────────────────────────────────────────────────
export async function loadFakultasSettings() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .like("key", "fakultas_%")
    .order("key");
  if (error) throw new Error(error.message);

  const grouped = {};
  for (const row of data || []) {
    const afterPrefix = row.key.replace(/^fakultas_/, "");
    let slug = "", field = "";
    for (const f of KNOWN_FIELDS) {
      if (afterPrefix.endsWith("_" + f)) {
        field = f;
        slug  = afterPrefix.slice(0, -(f.length + 1));
        break;
      }
    }
    if (!slug) continue;
    if (!grouped[slug]) grouped[slug] = { slug };
    grouped[slug][field] = row.value;
  }

  // Ambil semua user FAKULTAS
  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id, nama")
    .eq("role", "FAKULTAS");

  // Match slug → user_id berdasarkan nama
  const slugToUserId = {};
  for (const u of users || []) {
    const slugFromNama = u.nama.trim().toUpperCase().replace(/\s+/g, "_");
    slugToUserId[slugFromNama] = u.id;
  }

  const userIds = Object.values(slugToUserId);
  const counterMap = {};

  if (userIds.length > 0) {
    const currentYear = new Date().getFullYear();

    // Baca counter per user_id langsung dari nomor_counter
    const { data: counters } = await supabaseAdmin
      .from("nomor_counter")
      .select("user_id, last_number")
      .in("user_id", userIds)
      .eq("tahun", currentYear)
      .eq("jenis_surat", "FAKULTAS");

    for (const c of counters || []) {
      counterMap[c.user_id] = c.last_number;
    }
  }

  return Object.values(grouped).map(f => {
    const userId = slugToUserId[f.slug];
    const lastNum = userId ? (counterMap[userId] ?? 0) : 0;
    return {
      ...f,
      nextNumber: String(lastNum + 1).padStart(3, "0"),
    };
  });
}

// ── RESET SEMUA NOMOR URUT FAKULTAS ──────────────────────────────────────────
export async function resetAllFakultasCounters() {
  const tahun = new Date().getFullYear();

  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "FAKULTAS");

  const userIds = (users || []).map(u => u.id);
  if (!userIds.length) return { ok: true, message: "Tidak ada user fakultas." };

  const { error } = await supabaseAdmin
    .from("nomor_counter")
    .delete()
    .in("user_id", userIds)
    .eq("tahun", tahun)
    .eq("jenis_surat", "FAKULTAS");

  if (error) throw new Error(error.message);
  return { ok: true, message: "Semua nomor urut fakultas berhasil direset ke 001." };
}