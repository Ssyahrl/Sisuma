"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PasswordSettingsPage() {
  const [current, setCurrent]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confirm, setConfirm]   = useState("");
  const [isPending, setIsPending] = useState(false);
  const [toast, setToast]       = useState(null);

  function showToast(ok, message) {
    setToast({ ok, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPass.length < 8)
      return showToast(false, "Password baru minimal 8 karakter.");
    if (newPass !== confirm)
      return showToast(false, "Konfirmasi password tidak cocok.");

    setIsPending(true);
    try {
      // Verifikasi password lama dulu
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });

      if (signInErr)
        return showToast(false, "Password saat ini salah.");

      // Update ke password baru
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateErr)
        return showToast(false, "Gagal update password: " + updateErr.message);

      showToast(true, "Password berhasil diubah.");
      setCurrent(""); setNewPass(""); setConfirm("");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Ganti Password</h1>
          <p className="text-sm text-slate-500 mt-1">Perbarui password akun kamu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 space-y-4">

          {/* Password Saat Ini */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password Saat Ini</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              placeholder="Masukkan password saat ini"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
            />
          </div>

          {/* Password Baru */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password Baru</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 karakter"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
            />
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Ulangi password baru"
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition
                ${confirm && newPass !== confirm
                  ? "border-red-500/60 focus:border-red-400 focus:ring-red-400"
                  : "border-slate-600 focus:border-slate-400 focus:ring-slate-400"
                }`}
            />
            {confirm && newPass !== confirm && (
              <p className="text-xs text-red-400 mt-1.5">Password tidak cocok</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
          >
            {isPending ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium
          ${toast.ok
            ? "bg-green-950 border-green-700 text-green-300"
            : "bg-red-950 border-red-700 text-red-300"}`}>
          <span>{toast.ok ? "✓" : "✕"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}