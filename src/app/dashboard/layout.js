"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

const roleHomeMap = {
  admin: "/dashboard",
  fakultas: "/dashboard/fakultas",
  sekretaris: "/dashboard/sekretaris",
  warek: "/dashboard/wakil-rektor",
  rektor: "/dashboard/rektor",
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // cek session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        // cek role user
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error(error);
          router.replace("/unauthorized");
          return;
        }

        if (!mounted) return;

        if (profile?.role) {
          const role = profile.role.toLowerCase().trim();

          const resolvedRole = Object.keys(roleHomeMap).find(
            (key) =>
              key === role ||
              (key === "fakultas" && role.includes("fakultas"))
          );

          const home = roleHomeMap[resolvedRole] || "/unauthorized";

          // cegah user masuk area role lain
          if (!pathname.startsWith(home)) {
            router.replace(home);
            return;
          }
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
        router.replace("/login");
      }
    };

    initializeAuth();

    // listener auth change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // <- penting, jangan pakai pathname

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FB]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}