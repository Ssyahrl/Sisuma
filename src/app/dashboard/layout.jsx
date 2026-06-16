"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

// ==========================================
// KONSTANTA PEMETAAN HALAMAN (ROLE)
// ==========================================
const ROLE_HOME_MAP = {
  admin: "/dashboard",
  fakultas: "/dashboard/fakultas",
  sekretaris: "/dashboard/sekretaris",
  warek: "/dashboard/wakil-rektor",
  rektor: "/dashboard/rektor",
};

export default function DashboardLayout({ children }) {
  // ==========================================
  // 1. HOOKS
  // ==========================================
  const router = useRouter();
  const pathname = usePathname();

  // ==========================================
  // 2. AUTH & ROLE CHECK (Client Side Guard)
  // ==========================================
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Cek Session Aktif
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        // Cek Role User dari Database Profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          // console.error(error);
          router.replace("/unauthorized");
          return;
        }

        if (!mounted) return;

        // Validasi Akses Berdasarkan Role
        if (profile?.role) {
          const role = profile.role.toLowerCase().trim();

          const resolvedRole = Object.keys(ROLE_HOME_MAP).find(
            (key) => key === role || (key === "fakultas" && role.includes("fakultas"))
          );

          const home = ROLE_HOME_MAP[resolvedRole] || "/unauthorized";

          // Cegah user masuk ke area role lain
          if (!pathname.startsWith(home)) {
            router.replace(home);
            return;
          }
        }
      } catch (err) {
        // console.error("Auth Init Error:", err);
        router.replace("/login");
      }
    };

    initializeAuth();

    // Listener perubahan status Auth (misal: user logout di tab lain)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    // Cleanup function untuk mencegah memory leak
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
    
    // PENTING: pathname sengaja tidak dimasukkan agar tidak terjadi infinite loop DB call
  }, [router]); 

  // ==========================================
  // 3. RENDER UI LAYOUT
  // ==========================================
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FB]">
      {/* Sidebar Navigasi Kiri */}
      <Sidebar />

      {/* Konten Utama Kanan */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

<PageWrapper pathname={pathname}>
  {children}
</PageWrapper>
      </div>
    </div>
  );
}
function PageWrapper({ children, pathname }) {
  return (
    <main
      key={pathname}
      className="page-transition flex-1 overflow-auto p-4 sm:p-6 lg:p-8"
    >
      {children}
    </main>
  );
}