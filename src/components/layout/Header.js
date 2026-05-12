"use client";

import { Search, Bell, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const SEARCH_ROUTES = {
  admin: [
    { label: "Manajemen User", href: "/dashboard/users", keywords: ["user", "manajemen", "tambah user"] },
    { label: "Templates", href: "/dashboard/templates", keywords: ["template", "surat"] },
    { label: "Settings Nomor", href: "/dashboard/settings/nomor", keywords: ["settings", "nomor", "format"] },
    { label: "Ganti Password", href: "/dashboard/settings/password", keywords: ["password", "ganti"] },
  ],
  fakultas: [
    { label: "Dashboard", href: "/dashboard/fakultas", keywords: ["dashboard", "beranda"] },
    { label: "Pengajuan Surat", href: "/dashboard/fakultas/pengajuan", keywords: ["pengajuan", "surat", "buat"] },
    { label: "Ganti Password", href: "/dashboard/settings/password", keywords: ["password", "ganti"] },
  ],
  sekretaris: [
    { label: "Dashboard", href: "/dashboard/sekretaris", keywords: ["dashboard", "beranda"] },
    { label: "Ganti Password", href: "/dashboard/settings/password", keywords: ["password", "ganti"] },
  ],
  warek: [
    { label: "Dashboard", href: "/dashboard/wakil-rektor", keywords: ["dashboard", "beranda"] },
    { label: "Ganti Password", href: "/dashboard/settings/password", keywords: ["password", "ganti"] },
  ],
  rektor: [
    { label: "Dashboard", href: "/dashboard/rektor", keywords: ["dashboard", "beranda"] },
    { label: "Ganti Password", href: "/dashboard/settings/password", keywords: ["password", "ganti"] },
  ],
};

export default function Header() {
  const router = useRouter();
  const [query, setQuery]       = useState("");
  const [role, setRole]         = useState(null);
  const [results, setResults]   = useState([]);
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (profile?.role) setRole(profile.role.toLowerCase());
    });
  }, []);

  useEffect(() => {
    if (!query.trim() || !role) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setShowDrop(false);
      return;
    }

    const resolvedRole = Object.keys(SEARCH_ROUTES).find(
      (key) => key === role || (key === "fakultas" && role.includes("fakultas"))
    );
    const routes = SEARCH_ROUTES[resolvedRole] || [];
    const q = query.toLowerCase();

    const matched = routes.filter(
      (r) => r.label.toLowerCase().includes(q) || r.keywords.some((k) => k.includes(q))
    );

    setResults(matched);
    setShowDrop(matched.length > 0);
  }, [query, role]);

  function handleSelect(href) {
    router.push(href);
    setQuery("");
    setShowDrop(false);
  }

  return (
    <div className="px-6 pt-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3 flex justify-between items-center">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">SISUMA</h1>

          {/* SEARCH */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              <Search size={16} className="text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder="Cari menu..."
                className="bg-transparent outline-none text-sm w-56"
                suppressHydrationWarning
              />
            </div>

            {/* DROPDOWN HASIL */}
            {showDrop && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {results.map((r) => (
                  <button
                    key={r.href}
                    onMouseDown={() => handleSelect(r.href)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Search size={13} className="text-gray-400 shrink-0" />
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        

      </div>
    </div>
  );
}