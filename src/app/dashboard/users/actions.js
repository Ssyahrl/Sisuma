"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ==========================================
// KONSTANTA & FUNGSI BANTUAN
// ==========================================
const VALID_ROLES = ["ADMIN", "SEKRETARIS", "WAREK", "REKTOR", "FAKULTAS"];

/**
 * Mengubah string nama menjadi format slug yang aman untuk key database
 * Contoh: "Fakultas Teknik" -> "FAKULTAS_TEKNIK"
 */
const generateSlug = (nama) => {
  if (!nama) return "";
  return nama
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
};

// ==========================================
// MANAJEMEN USER (CRUD)
// ==========================================

/**
 * Mengambil semua data profil user dari database
 */
export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, nama, role")
    .order("nama", { ascending: true });

  if (error) throw new Error("Gagal mengambil data users: " + error.message);

  return data || [];
}

/**
 * Membuat user baru (Auth & Profile) beserta pengaturan defaultnya
 */
export async function createUser(formData) {
  const nama = formData.get("nama")?.trim();
  const nip = formData
    .get("nip")
    ?.trim()
    .replace(/[^0-9]/g, "");
  const email = nip ? `${nip}@masoem.ac.id` : "";
  const password = formData.get("password")?.trim();
  const role = formData.get("role")?.trim().toUpperCase();
  const prefix = formData.get("prefix")?.trim().toUpperCase() || null;

  // 1. Validasi Input
  if (!nama || !nip || !password || !role) {
    return { ok: false, message: "Semua field wajib diisi." };
  }
  if (nip.length !== 6) {
    return { ok: false, message: "NIP harus 6 digit." };
  }
  if (password.length < 8 || password.length > 12) {
    return { ok: false, message: "Password harus 8-12 karakter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: "Password harus mengandung minimal 1 huruf kapital." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: "Password harus mengandung minimal 1 angka." };
  }
  if (/[\s'";\-\-\/\*\\]/.test(password)) {
    return { ok: false, message: "Password mengandung karakter yang tidak diizinkan." };
  }
  if (role === "FAKULTAS" && !prefix) {
    return {
      ok: false,
      message: "Kode prefix wajib diisi untuk role Fakultas.",
    };
  }

  // 1b. Cek duplikat NAMA (semua role) dan NIP/email sebelum bikin akun
  const { data: existingUsers, error: checkErr } = await supabaseAdmin
    .from("profiles")
    .select("id, nama, email");

  if (checkErr) {
    return {
      ok: false,
      message: "Gagal memeriksa data duplikat: " + checkErr.message,
    };
  }

  const namaDuplikat = (existingUsers || []).some(
    (u) => u.nama?.trim().toLowerCase() === nama.toLowerCase(),
  );
  if (namaDuplikat) {
    return {
      ok: false,
      message: `Nama "${nama}" sudah digunakan oleh user lain.`,
    };
  }

  const nipDuplikat = (existingUsers || []).some(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (nipDuplikat) {
    return {
      ok: false,
      message: `NIP "${nip}" sudah digunakan oleh user lain.`,
    };
  }

  // 2. Buat Akun di Supabase Auth
  const { data: authData, error: authErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authErr) {
    if (authErr.message.includes("already registered")) {
      return { ok: false, message: "Email sudah terdaftar." };
    }
    return { ok: false, message: "Gagal membuat akun: " + authErr.message };
  }

  const userId = authData.user.id;

  // 3. Buat Profil User
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, email, nama, role });

  // Rollback jika profil gagal dibuat
  if (profileErr) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      message: "Gagal menyimpan profil: " + profileErr.message,
    };
  }

  // 4. Buat pengaturan khusus jika role adalah FAKULTAS
  if (role === "FAKULTAS") {
    await createFakultasSettings(nama, prefix);
  }

  // 5. Revalidate cache agar UI langsung update
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/settings");

  return { ok: true, message: `User "${nama}" berhasil dibuat.` };
}

/**
 * Mengubah role dari user yang sudah ada
 */
export async function updateUserRole(userId, newRole) {
  if (!VALID_ROLES.includes(newRole)) {
    return { ok: false, message: "Role tidak valid." };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error)
    return { ok: false, message: "Gagal update role: " + error.message };

  revalidatePath("/dashboard/users");
  return { ok: true, message: "Role berhasil diupdate." };
}

/**
 * Mengubah password user oleh Admin
 */
export async function updateUserPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 8 || newPassword.length > 12) {
    return { ok: false, message: "Password harus 8-12 karakter." };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { ok: false, message: "Password harus mengandung minimal 1 huruf kapital." };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { ok: false, message: "Password harus mengandung minimal 1 angka." };
  }
  if (!/^[A-Za-z0-9@#$%^&*!+=\-_.]+$/.test(newPassword)) {
    return { ok: false, message: "Password mengandung karakter yang tidak diizinkan." };
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error)
    return { ok: false, message: "Gagal update password: " + error.message };

  return { ok: true, message: "Password berhasil diubah." };
}

/**
 * Menghapus user secara permanen dari Auth, Profile, dan membersihkan relasinya
 */
export async function deleteUser(userId) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nama, role")
    .eq("id", userId)
    .single();

  await supabaseAdmin.auth.admin.deleteUser(userId);

  await supabaseAdmin
    .from("surat")
    .update({ user_id: null })
    .eq("user_id", userId);

  // Tambah ini — null-kan referensi di approval_steps
  await supabaseAdmin
    .from("approval_steps")
    .update({ approved_by: null })
    .eq("approved_by", userId);

  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  if (profile?.role === "FAKULTAS" && profile?.nama) {
    const slug = generateSlug(profile.nama);
    await supabaseAdmin
      .from("settings")
      .delete()
      .like("key", `fakultas_${slug}_%`);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/settings");

  return { ok: true, message: "User berhasil dihapus." };
}

// ==========================================
// PENGATURAN FAKULTAS (KHUSUS ROLE FAKULTAS)
// ==========================================

/**
 * Membuat pengaturan nomor surat awal untuk fakultas baru
 */
async function createFakultasSettings(namaFakultas, customPrefix = null) {
  const slug = generateSlug(namaFakultas);

  // Ambil format global untuk dijadikan template awal
  const { data: globalSettings } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .in("key", ["nomor_surat_format", "nomor_reset_logic"]);

  const globalMap = Object.fromEntries(
    (globalSettings || []).map((r) => [r.key, r.value]),
  );
  const defaultFormat =
    "{NOMOR_URUT:3}/{JENIS}-{PREFIX}/{BULAN_ROMAWI}/{TAHUN}";
  const defaultReset = globalMap["nomor_reset_logic"] || "tahunan";

  // Pakai customPrefix kalau ada, jika tidak ada fallback ke inisial nama (maks 4 huruf)
  const shortPrefix =
    customPrefix ||
    namaFakultas
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 4);

  // Simpan pengaturan awal ke database
  await supabaseAdmin.from("settings").upsert(
    [
      { key: `fakultas_${slug}_nomor_format`, value: defaultFormat },
      { key: `fakultas_${slug}_prefix`, value: shortPrefix },
      { key: `fakultas_${slug}_reset_logic`, value: defaultReset },
    ],
    { onConflict: "key", ignoreDuplicates: true },
  );
}

/**
 * Mengambil seluruh pengaturan khusus fakultas
 */
export async function getFakultasSettings() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .like("key", "fakultas_%")
    .order("key");

  if (error) throw new Error("Gagal ambil settings fakultas: " + error.message);

  const KNOWN_FIELDS = ["nomor_format", "prefix", "reset_logic"];
  const grouped = {};

  // Kelompokkan data setting berdasarkan nama fakultas (slug)
  for (const row of data || []) {
    const afterPrefix = row.key.replace(/^fakultas_/, "");
    let slug = "",
      field = "";

    for (const f of KNOWN_FIELDS) {
      if (afterPrefix.endsWith("_" + f)) {
        field = f;
        slug = afterPrefix.slice(0, -(f.length + 1));
        break;
      }
    }

    if (!slug) continue;
    if (!grouped[slug]) grouped[slug] = { slug };

    grouped[slug][field] = row.value;
  }

  return Object.values(grouped);
}

/**
 * Menyimpan perubahan pada salah satu field pengaturan fakultas
 */
export async function updateFakultasSetting(slug, field, value) {
  const key = `fakultas_${slug}_${field}`;

  const { error } = await supabaseAdmin
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) return { ok: false, message: "Gagal update: " + error.message };

  revalidatePath("/dashboard/settings");

  return { ok: true };
}