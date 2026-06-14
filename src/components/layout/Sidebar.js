"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FilePenLine,
  FileText,
  History,
  Bell,
  Settings,
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ClipboardCheck,
  CheckSquare,
  Stamp,
  UserPlus,
  
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const adminNav = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
  { icon: <FileText size={20} />, label: "Templates", href: "/dashboard/templates" },
  { icon: <UserPlus size={20} />, label: "Manajemen User", href: "/dashboard/users" },
  { icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings/nomor" },
];

const fakultasNav = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard/fakultas" },
  { icon: <FilePenLine size={20} />, label: "Pengajuan Surat", href: "/dashboard/fakultas/pengajuan" },
  {icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings/password" },
  
];

const sekretarisNav = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard/sekretaris" },
    // { icon: <ClipboardCheck size={20} />, label: "Review Surat", href: "/dashboard/sekretaris/review" },
    {icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings/password" },
];

const wakilRektorNav = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard/wakil-rektor" },
  // { icon: <CheckSquare size={20} />, label: "Review Surat", href: "/dashboard/wakil-rektor/review" },
  {icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings/password" },
];

const rektorNav = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard/rektor" },
  // { icon: <Stamp size={20} />, label: "Pengesahan Surat", href: "/dashboard/rektor/pengesahan" },
  {icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings/password" },
];

const NAV_CONFIG = {
  admin:      { nav: adminNav,       createPath: "/dashboard/templates",      createLabel: "Create Template", subtitle: "Administrator" },
  fakultas:   { nav: fakultasNav,    createPath: "/dashboard/fakultas/surat", createLabel: "Buat Surat Baru", subtitle: "Fakultas" },
  sekretaris: { nav: sekretarisNav,  createPath: null,                        createLabel: null,              subtitle: "Sekretaris Rektor" },
  warek:      { nav: wakilRektorNav, createPath: null,                        createLabel: null,              subtitle: "Wakil Rektor" },
  rektor:     { nav: rektorNav,      createPath: null,                        createLabel: null,              subtitle: "Rektor" },
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState(null);
  const [namaUser, setNamaUser] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, nama")
        .eq("id", session.user.id)
        .single();
      if (profile?.role) setRole(profile.role.toLowerCase().trim());
      if (profile?.nama) setNamaUser(profile.nama);
      setLoading(false);
    };
    getRole();
  }, []);

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    try {
      document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
      await supabase.auth.signOut({ scope: "global" });
      window.location.href = "/login";
    } catch {
      document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
      window.location.href = "/login";
    }
  };

  if (loading) return (
    <div className="h-screen w-64 bg-[#0B2A4A] flex items-center justify-center">
      <div className="text-white/30 text-xs">Loading...</div>
    </div>
  );

  // Resolve config — fakultas bisa "fakultas_teknik" dll, jadi pakai includes
  const resolvedRole = role
    ? Object.keys(NAV_CONFIG).find(key =>
        key === role || (key === "fakultas" && role.includes("fakultas"))
      )
    : null;

  const config = NAV_CONFIG[resolvedRole] ?? { nav: [], createPath: null, createLabel: null, subtitle: role ?? "" };
  const subtitle = resolvedRole === "fakultas" && namaUser ? namaUser : config.subtitle;

  return (
    <div
      className={`h-screen bg-[#0B2A4A] flex flex-col transition-all duration-300 ease-in-out shrink-0 relative ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="relative flex items-center justify-center border-b border-white/10 shrink-0 h-16">
        {isCollapsed ? (
          <Image
            src="/images/logo-icon.png"
            alt="SISUMA"
            width={32}
            height={32}
            style={{ objectFit: "contain" }}
            priority
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-icon.png"
              alt="SISUMA"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
              priority
            />
            <div>
              <div className="text-white font-bold text-sm leading-none">SISUMA</div>
              <div className="text-white/40 text-[10px] mt-0.5 capitalize">{subtitle}</div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0B2A4A] border border-white/20 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all z-10"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Create Button — hanya tampil jika role punya createPath */}
      {config.createPath && (
        <div className="p-4 shrink-0">
          <button
            onClick={() => router.push(config.createPath)}
            className={`w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
              isCollapsed ? "px-3" : ""
            }`}
          >
            <Plus size={18} />
            {!isCollapsed && <span>{config.createLabel}</span>}
          </button>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {config.nav.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            collapsed={isCollapsed}
          />
        ))}
      </div>

      

      {/* Footer */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-1">
        <NavItem
          icon={<HelpCircle size={20} />}
          label="Support"
          collapsed={isCollapsed}
        />
        <NavItem
          icon={<LogOut size={20} />}
          label="Logout"
          collapsed={isCollapsed}
          isRed
          onClick={handleLogout}
        />
        {!isCollapsed && (
          <p className="text-white/20 text-xs text-center mt-3">V 1.2.4</p>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, collapsed = false, isRed = false, onClick, href }) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = href && pathname === href;

  return (
    <div
      onClick={() => {
        if (onClick) return onClick();
        if (href) router.push(href);
      }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200
        ${isActive ? "bg-white/15 text-white font-medium" : "text-white/50 hover:bg-white/10 hover:text-white"}
        ${isRed ? "text-red-400! hover:text-red-300!" : ""}
        ${collapsed ? "justify-center" : ""}
      `}
    >
      <div className="shrink-0">{icon}</div>
      {!collapsed && <span className="flex-1 truncate text-sm">{label}</span>}
    </div>
  );
}