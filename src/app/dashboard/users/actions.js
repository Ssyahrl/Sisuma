"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_ROLES = ["ADMIN", "SEKRETARIS", "WAREK", "REKTOR", "FAKULTAS"];

export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, nama, role")
    .order("nama", { ascending: true });

  if (error) throw new Error("Gagal mengambil data users: " + error.message);
  return data || [];
}

export async function createUser(formData) {
  const nama     = formData.get("nama")?.trim();
  const email    = formData.get("email")?.trim().toLowerCase();
  const password = formData.get("password")?.trim();
  const role     = formData.get("role")?.trim().toUpperCase();
  const prefix   = formData.get("prefix")?.trim().toUpperCase() || null;
  

  if (!nama || !email || !password || !role)
    return { ok: false, message: "Semua field wajib diisi." };
  if (!VALID_ROLES.includes(role))
    return { ok: false, message: "Role tidak valid." };
  if (password.length < 8)
    return { ok: false, message: "Password minimal 8 karakter." };
  if (role === "FAKULTAS" && !prefix)
    return { ok: false, message: "Kode prefix wajib diisi untuk role Fakultas." };

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) {
    if (authErr.message.includes("already registered"))
      return { ok: false, message: "Email sudah terdaftar." };
    return { ok: false, message: "Gagal membuat akun: " + authErr.message };
  }

  const userId = authData.user.id;

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, email, nama, role });

  if (profileErr) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: false, message: "Gagal menyimpan profil: " + profileErr.message };
  }

  if (role === "FAKULTAS") {
    await createFakultasSettings(nama, prefix);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: `User "${nama}" berhasil dibuat.` };
}

async function createFakultasSettings(namaFakultas, customPrefix = null) {
  const slug = namaFakultas
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const { data: globalSettings } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .in("key", ["nomor_surat_format", "nomor_reset_logic"]);

  const globalMap     = Object.fromEntries((globalSettings || []).map((r) => [r.key, r.value]));
  const defaultFormat = "{NOMOR_URUT:3}/{JENIS}-{PREFIX}/{BULAN_ROMAWI}/{TAHUN}";
  const defaultReset  = globalMap["nomor_reset_logic"] || "tahunan";

  // Pakai customPrefix kalau ada, fallback ke inisial nama
  const shortPrefix = customPrefix || namaFakultas
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 4);

  await supabaseAdmin.from("settings").upsert([
    { key: `fakultas_${slug}_nomor_format`, value: defaultFormat },
    { key: `fakultas_${slug}_prefix`,       value: shortPrefix },
    { key: `fakultas_${slug}_reset_logic`,  value: defaultReset },
  ], { onConflict: "key", ignoreDuplicates: true });
}

export async function updateUserRole(userId, newRole) {
  if (!VALID_ROLES.includes(newRole))
    return { ok: false, message: "Role tidak valid." };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { ok: false, message: "Gagal update role: " + error.message };

  revalidatePath("/dashboard/users");
  return { ok: true, message: "Role berhasil diupdate." };
}

export async function deleteUser(userId) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nama, role")
    .eq("id", userId)
    .single();

  // Hapus dari auth (abaikan semua error)
  await supabaseAdmin.auth.admin.deleteUser(userId);
  await supabaseAdmin
    .from("surat")
    .update({ user_id: null })
    .eq("user_id", userId);

  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  if (profile?.role === "FAKULTAS" && profile?.nama) {
    const slug = profile.nama
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    await supabaseAdmin
      .from("settings")
      .delete()
      .like("key", `fakultas_${slug}_%`);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "User berhasil dihapus." };
}

export async function getFakultasSettings() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .like("key", "fakultas_%")
    .order("key");

  if (error) throw new Error("Gagal ambil settings fakultas: " + error.message);

  const KNOWN_FIELDS = ["nomor_format", "prefix", "reset_logic"];
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

  return Object.values(grouped);
}

export async function updateFakultasSetting(slug, field, value) {
  const key = `fakultas_${slug}_${field}`;
  const { error } = await supabaseAdmin
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) return { ok: false, message: "Gagal update: " + error.message };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
export async function updateUserPassword(userId, newPassword) {
  if (!newPassword || newPassword.length < 8)
    return { ok: false, message: "Password minimal 8 karakter." };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { ok: false, message: "Gagal update password: " + error.message };

  return { ok: true, message: "Password berhasil diubah." };
}