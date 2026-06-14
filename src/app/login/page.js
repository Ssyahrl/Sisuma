/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const redirectByRole = (role, router) => {
  const r = role.toLowerCase().trim();
  if (r === "admin") router.replace("/dashboard");
  else if (r.includes("fakultas") || r === "user") router.replace("/dashboard/fakultas");
  else if (r === "sekretaris") router.replace("/dashboard/sekretaris");
  else if (r === "warek") router.replace("/dashboard/wakil-rektor");
  else if (r === "rektor") router.replace("/dashboard/rektor");
  else router.replace("/unauthorized");
};

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(true);
  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (error || !profile) {
          await supabase.auth.signOut();
          setChecking(false);
          return;
        }
        document.cookie = `user_role=${profile.role.toLowerCase().trim()}; path=/; max-age=86400; SameSite=Lax`;
        redirectByRole(profile.role, router);
      } else {
        setChecking(false);
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockUntil(null);
        setFailCount(0);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockUntil && Date.now() < lockUntil) return;
    setLoading(true);
    setErrorMsg("");

    const email = `${nip}@masoem.ac.id`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 3) {
        setLockUntil(Date.now() + 60 * 1000);
        setErrorMsg("Terlalu banyak percobaan gagal. Coba lagi dalam 1 menit atau hubungi administrator.");
      } else {
        setErrorMsg(`NIP atau password salah. Percobaan ${newCount}/3.`);
      }
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setErrorMsg("Akun tidak memiliki akses. Hubungi administrator.");
      setLoading(false);
      return;
    }

    document.cookie = `user_role=${profile.role.toLowerCase().trim()}; path=/; max-age=86400; SameSite=Lax`;
    redirectByRole(profile.role, router);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg animate-pulse text-gray-400">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0">
        <img src="/images/Bg-login.png" className="w-full h-full object-cover" alt="background university" />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        <div className="hidden md:flex w-1/2 bg-[#0B2A4A] text-white p-10 flex-col justify-center">
          <h1 className="text-2xl font-bold mb-4 tracking-widest">SISUMA</h1>
          <h2 className="text-3xl font-bold leading-tight">Sistem Administrasi<br />Surat Terpadu</h2>
          <p className="mt-2 text-blue-300">MaSoem University</p>
          <p className="mt-6 text-gray-300 text-sm leading-relaxed">
            Mengelola korespondensi akademik dengan presisi digital dan efisiensi birokrasi universitas.
          </p>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Selamat Datang</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-500 text-sm">
                {errorMsg}
                {countdown > 0 && <p className="mt-1 font-semibold">Tunggu: {countdown} detik</p>}
              </div>
            )}
            <input
              value={nip}
              onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="Masukkan NIP"
              inputMode="numeric"
              required
              className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-12"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <button type="submit" disabled={loading || countdown > 0}
              className="w-full bg-[#0B2A4A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#081e3a] transition-all disabled:opacity-50 shadow-lg shadow-blue-900/10">
              {loading ? "Memproses..." : countdown > 0 ? `Tunggu ${countdown}d...` : "Masuk ke Dashboard →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}