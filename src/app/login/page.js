/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const redirectByRole = (role, router) => {
  if (role === "admin") router.replace("/dashboard");
  else if (role.includes("fakultas") || role === "user") router.replace("/dashboard/fakultas");
  else if (role === "sekretaris") router.replace("/dashboard/sekretaris");
  else if (role === "warek") router.replace("/dashboard/wakil-rektor");
  else if (role === "rektor") router.replace("/dashboard/rektor");
  else router.replace("/unauthorized");
};

export default function Login() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(true);

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
          // Profile tidak ditemukan, logout paksa
          await supabase.auth.signOut();
          setChecking(false);
          return;
        }

        redirectByRole(profile.role.toLowerCase().trim(), router);
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const email = `${nip}@masoem.ac.id`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("NIM atau password salah");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      // User ada di Auth tapi tidak ada di tabel profiles
      await supabase.auth.signOut();
      setErrorMsg("Akun tidak memiliki akses. Hubungi administrator.");
      setLoading(false);
      return;
    }

    redirectByRole(profile.role.toLowerCase().trim(), router);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0">
        <img src="/images/Bg-login.png" className="w-full h-full object-cover" alt="bg" />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        <div className="w-1/2 bg-[#0B2A4A] text-white p-10 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-4">SISUMA</h1>
          <h2 className="text-3xl font-bold leading-tight">
            Sistem Administrasi<br />Surat Terpadu
          </h2>
          <p className="mt-2 text-blue-300">MaSoem University</p>
          <p className="mt-6 text-gray-300 text-sm">
            Mengelola korespondensi akademik dengan presisi digital.
          </p>
        </div>

        <div className="w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-4">Selamat Datang</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            <input
              value={nip}
              onChange={(e) => setNip(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 6))}
              placeholder="Masukkan NIP"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

<div className="relative">
  <input
    type={showPass ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Password"
    className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
  />
  <button
    type="button"
    onClick={() => setShowPass((v) => !v)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
  >
    {showPass ? (
      // Eye Off
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      // Eye
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
</div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B2A4A] text-white py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Masuk ke Dashboard →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}