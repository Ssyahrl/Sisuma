"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PasswordSettingsPage() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [current, setCurrent]     = useState("");
  const [newPass, setNewPass]     = useState("");
  const [confirm, setConfirm]     = useState("");
const [isPending, setIsPending]     = useState(false);
const [toast, setToast]             = useState(null);
const [showCurrent, setShowCurrent] = useState(false);
const [showNew, setShowNew]         = useState(false);
const [showConfirm, setShowConfirm] = useState(false);

  // ==========================================
  // 2. HANDLERS & HELPERS
  // ==========================================
  const showToast = (ok, message) => {
    setToast({ ok, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi input lokal
if (newPass.length < 8 || newPass.length > 12) {
  return showToast(false, "Password harus 8-12 karakter.");
}
if (!/[A-Z]/.test(newPass)) {
  return showToast(false, "Password harus mengandung minimal 1 huruf kapital.");
}
if (!/[0-9]/.test(newPass)) {
  return showToast(false, "Password harus mengandung minimal 1 angka.");
}
if (!/^[A-Za-z0-9@#$%^&*!+=\-_.]+$/.test(newPass)) {
  return showToast(false, "Password mengandung karakter yang tidak diizinkan.");
}
if (newPass !== confirm) {
  return showToast(false, "Konfirmasi password tidak cocok.");
}

    setIsPending(true);
    try {
      // 1. Ambil email user saat ini
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;

      // 2. Verifikasi password lama terlebih dahulu
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });

      if (signInErr) {
        return showToast(false, "Password saat ini salah.");
      }

      // 3. Update ke password baru
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateErr) {
        return showToast(false, "Gagal update password: " + updateErr.message);
      }

      // 4. Jika sukses
      showToast(true, "Password berhasil diubah.");
      setCurrent(""); 
      setNewPass(""); 
      setConfirm("");
    } finally {
      setIsPending(false);
    }
  };

  // ==========================================
  // 3. RENDER UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6">

        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Ganti Password</h1>
          <p className="text-sm text-slate-500 mt-1">Perbarui password akun kamu</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 space-y-4">

         {/* Input: Password Saat Ini */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password Saat Ini</label>
  <div className="relative">
    <input
      type={showCurrent ? "text" : "password"}
      value={current}
      onChange={(e) => setCurrent(e.target.value)}
      required
      placeholder="Masukkan password saat ini"
      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 pr-24 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
    />
    <button type="button" onClick={() => setShowCurrent(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs">
      {showCurrent ? "sembunyikan" : "tampilkan"}
    </button>
  </div>
</div>

{/* Input: Password Baru */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password Baru</label>
  <div className="relative">
    <input
      type={showNew ? "text" : "password"}
      value={newPass}
      onChange={(e) => setNewPass(e.target.value)}
      required
      minLength={8}
      placeholder="Min. 8 karakter"
      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 pr-24 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
    />
    <button type="button" onClick={() => setShowNew(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs">
      {showNew ? "sembunyikan" : "tampilkan"}
    </button>
  </div>

  {/* Indikator Syarat Password */}
  {newPass && (
    <div className="mt-2.5 space-y-1.5 px-1">
      {[
        { ok: newPass.length >= 8 && newPass.length <= 12, label: "8-12 karakter" },
        { ok: /[A-Z]/.test(newPass), label: "Minimal 1 huruf kapital" },
        { ok: /[0-9]/.test(newPass), label: "Minimal 1 angka" },
        { ok: /^[A-Za-z0-9@#$%^&*!+=\-_.]+$/.test(newPass), label: "Tidak ada karakter terlarang" },
      ].map(({ ok, label }) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className={ok ? "text-green-400" : "text-slate-600"}>
            {ok ? "✓" : "✕"}
          </span>
          <span className={ok ? "text-green-400" : "text-slate-500"}>{label}</span>
        </div>
      ))}
    </div>
  )}
</div>

{/* Input: Konfirmasi Password Baru */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1.5">Konfirmasi Password Baru</label>
  <div className="relative">
    <input
      type={showConfirm ? "text" : "password"}
      value={confirm}
      onChange={(e) => setConfirm(e.target.value)}
      required
      placeholder="Ulangi password baru"
      className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 pr-24 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition
        ${confirm && newPass !== confirm
          ? "border-red-500/60 focus:border-red-400 focus:ring-red-400"
          : "border-slate-600 focus:border-slate-400 focus:ring-slate-400"
        }`}
    />
    <button type="button" onClick={() => setShowConfirm(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs">
      {showConfirm ? "sembunyikan" : "tampilkan"}
    </button>
  </div>
  {confirm && newPass !== confirm && (
    <p className="text-xs text-red-400 mt-1.5">Password tidak cocok</p>
  )}
</div>
          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
          >
            {isPending ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>
      </div>

      {/* Komponen Toast Notifikasi */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium
            ${
              toast.ok
                ? "bg-green-950 border-green-700 text-green-300"
                : "bg-red-950 border-red-700 text-red-300"
            }`}
        >
          <span>{toast.ok ? "✓" : "✕"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}