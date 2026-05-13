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

/**
 * Menghapus/Mereset nomor urut surat global ke 0 untuk tahun berjalan
 */
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

/**
 * Mengecek nomor urut surat global selanjutnya
 */
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

// ==========================================
// 3. PENGATURAN FAKULTAS
// ==========================================

/**
 * Membaca pengaturan dan nomor urut khusus untuk masing-masing Fakultas
 */
export async function loadFakultasSettings() {
  // Ambil semua setting yang depannya "fakultas_"
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .like("key", "fakultas_%")
    .order("key");

  if (error) throw new Error(error.message);

  // 1. Kelompokkan data setting berdasarkan "slug" fakultasnya
  const grouped = {};
  for (const row of data || []) {
    const afterPrefix = row.key.replace(/^fakultas_/, "");
    let slug = "", field = "";
    
    // Pisahkan slug fakultas dengan field pengaturannya
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

  // 2. Ambil semua profil dengan role FAKULTAS
  const { data: users } = await supabaseAdmin
    .from("profiles")
    .select("id, nama")
    .eq("role", "FAKULTAS");

  // 3. Pasangkan (Match) slug dengan user_id berdasarkan nama fakultas
  const slugToUserId = {};
  for (const u of users || []) {
    const slugFromNama = u.nama.trim().toUpperCase().replace(/\s+/g, "_");
    slugToUserId[slugFromNama] = u.id;
  }

  const userIds = Object.values(slugToUserId);
  const counterMap = {};

  // 4. Baca counter (nomor terakhir) per user_id di tahun berjalan
  if (userIds.length > 0) {
    const currentYear = new Date().getFullYear();

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

  // 5. Gabungkan data pengaturan dengan data nomor selanjutnya
  return Object.values(grouped).map(f => {
    const userId = slugToUserId[f.slug];
    const lastNum = userId ? (counterMap[userId] ?? 0) : 0;
    
    return {
      ...f,
      nextNumber: String(lastNum + 1).padStart(3, "0"),
    };
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