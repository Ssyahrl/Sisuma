"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Konstanta untuk membaca field pengaturan fakultas
const KNOWN_FIELDS = ["nomor_format", "prefix", "reset_logic"];

// ==========================================
// 1. PENGATURAN GLOBAL (FORMAT NOMOR)
// ==========================================

/**
 * Menyimpan pengaturan format nomor surat utama (Global)
 */
export async function saveNomorSettings({ format, resetLogic, startFrom, customTokens }) {
  // Siapkan data yang mau di-upsert agar kodenya lebih bersih (tidak berulang)
  const settingsData = [
    { key: "nomor_surat_format",  value: format },
    { key: "nomor_reset_logic",   value: resetLogic },
    { key: "nomor_awal",          value: String(startFrom) },
    { key: "nomor_custom_tokens", value: JSON.stringify(customTokens) },
  ];

  // Eksekusi semua upsert secara bersamaan (parallel)
  const results = await Promise.all(
    settingsData.map((item) =>
      supabaseAdmin.from("settings").upsert(item, { onConflict: "key" })
    )
  );

  // Cek apakah ada proses yang error
  const err = results.find((r) => r.error)?.error;
  if (err) throw new Error(err.message);

  return { ok: true };
}

/**
 * Mengambil pengaturan format nomor surat utama (Global)
 */
export async function loadNomorSettings() {
  const { data: rows, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .in("key", ["nomor_surat_format", "nomor_reset_logic", "nomor_awal", "nomor_custom_tokens"]);

  if (error) throw new Error(error.message);

  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ==========================================
// 2. RESET COUNTER ADMIN
// ==========================================

export async function resetAdminCounter() {
  const tahun = new Date().getFullYear();

  const { error } = await supabaseAdmin
    .from("nomor_counter")
    .delete()
    .is("user_id", null)
    .is("template_id", null)
    .eq("tahun", tahun);

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function loadAdminCounter() {
  const tahun = new Date().getFullYear();
  const JENIS_LIST = ["SK", "KT"];

  const { data } = await supabaseAdmin
    .from("nomor_counter")
    .select("jenis_surat, last_number")
    .in("jenis_surat", JENIS_LIST)
    .is("user_id", null)
    .is("template_id", null)
    .eq("tahun", tahun);

  const result = {};
  for (const jenis of JENIS_LIST) {
    const row = (data || []).find(r => r.jenis_surat === jenis);
    result[jenis] = String((row?.last_number ?? 0) + 1).padStart(3, "0");
  }

  return result; // { SK: "001", KT: "003", ... }
}

// ==========================================
// 3. PENGATURAN FAKULTAS
// ==========================================

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

  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id, nama")
    .eq("role", "FAKULTAS");

  const slugToUserId = {};
  for (const u of users || []) {
    const slugFromNama = u.nama.trim().toUpperCase().replace(/\s+/g, "_");
    slugToUserId[slugFromNama] = u.id;
  }

  const userIds = Object.values(slugToUserId);
  const JENIS_LIST = ["SK", "KT"];
  const counterMap = {}; // { userId: { SK: 0, KT: 2 } }

  if (userIds.length > 0) {
    const currentYear = new Date().getFullYear();
    const { data: counters } = await supabaseAdmin
      .from("nomor_counter")
      .select("user_id, jenis_surat, last_number")
      .in("user_id", userIds)
      .in("jenis_surat", JENIS_LIST)
      .eq("tahun", currentYear);

    for (const c of counters || []) {
      if (!counterMap[c.user_id]) counterMap[c.user_id] = {};
      counterMap[c.user_id][c.jenis_surat] = c.last_number;
    }
  }

  return Object.values(grouped).map(f => {
    const userId = slugToUserId[f.slug];
    const perJenis = {};
    for (const jenis of JENIS_LIST) {
      const last = userId ? (counterMap[userId]?.[jenis] ?? 0) : 0;
      perJenis[jenis] = String(last + 1).padStart(3, "0");
    }
    return { ...f, nextNumbers: perJenis }; // { SK: "001", KT: "001" }
  });
}


// ==========================================
// 4. RESET COUNTER FAKULTAS
// ==========================================

/**
 * Menghapus/Mereset semua nomor urut Fakultas ke 0 untuk tahun berjalan
 */
export async function resetAllFakultasCounters() {
  const tahun = new Date().getFullYear();

  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "FAKULTAS");

  const userIds = (users || []).map(u => u.id);
  
  if (!userIds.length) {
    return { ok: true, message: "Tidak ada user fakultas." };
  }

  const { error } = await supabaseAdmin
    .from("nomor_counter")
    .delete()
    .in("user_id", userIds)
    .eq("tahun", tahun)
    .eq("jenis_surat", "FAKULTAS");

  if (error) throw new Error(error.message);
  
  return { ok: true, message: "Semua nomor urut fakultas berhasil direset ke 001." };
}