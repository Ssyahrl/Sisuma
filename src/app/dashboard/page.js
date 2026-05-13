"use client";
import SuratDetailModal, { statusConfig} from "./SuratDetailModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  AlertCircle,
  Users,
  XCircle,
  ChevronRight,
  Plus,
  Download,
  Settings,
} from "lucide-react";


export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    users: 0,
    rejected: 0,
  });

  const [pendingList, setPendingList] = useState([]);
  const [adminSurat, setAdminSurat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuratId, setSelectedSuratId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const [approved, pending, rejected, users] = await Promise.all([
        supabase
          .from("surat")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),

        supabase
          .from("surat")
          .select("id", { count: "exact", head: true })
          .in("status", [
            "pending_admin",
            "pending_sekretaris",
            "pending_wakil",
            "pending_rektor",
          ]),

        supabase
          .from("surat")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),
      ]);

      setStats({
        approved: approved.count || 0,
        pending: pending.count || 0,
        rejected: rejected.count || 0,
        users: users.count || 0,
      });

      const { data } = await supabase
        .from("surat")
        .select(`
          id,
          status,
          created_at,
          user_id,
          templates (
            nama_template
          ),
          profiles (
            nama,
            email
          )
        `)
        .eq("status", "pending_admin")
        .order("created_at", { ascending: false })
        .limit(10);

      setPendingList(data || []);

      if (session) {
        const adminRes = await fetch("/api/surat/admin", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }).then((r) => r.json());

        setAdminSurat(adminRes.data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const getInitials = (nama) => {
    if (!nama) return "?";

    return nama
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const statusLabel = {
    pending_admin: "Menunggu Admin",
    pending_sekretaris: "Menunggu Sekretaris",
    pending_wakil: "Menunggu Wakil Rektor",
    pending_rektor: "Menunggu Rektor",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          Institutional Dashboard
        </h1>

        <p className="text-gray-500 text-sm mt-1 max-w-2xl">
          Welcome to the central control hub. Monitor administrative flows and
          manage university-wide documentations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="APPROVE LETTERS"
          desc="Surat yang di Approve"
          value={stats.approved.toLocaleString()}
          icon={<FileText size={20} />}
          color="blue"
        />

        <Card
          title="ACTION NEEDED"
          desc="Menunggu Persetujuan"
          value={stats.pending.toLocaleString()}
          icon={<AlertCircle size={20} />}
          color="orange"
        />

        <Card
          title="ACTIVE NOW"
          desc="Total Users"
          value={stats.users.toLocaleString()}
          icon={<Users size={20} />}
          color="green"
        />

        <Card
          title="REJECTED LETTERS"
          desc="Surat yang ditolak"
          value={stats.rejected.toLocaleString()}
          icon={<XCircle size={20} />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">

          {/* Pending Approvals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg text-gray-800">
                Pending Approvals
              </h2>

              
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
                Memuat data...
              </div>
            ) : pendingList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
                Tidak ada pengajuan yang menunggu persetujuan admin.
              </div>
            ) : (
              pendingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    router.push(`/dashboard/approvals/${item.id}`)
                  }
                  className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-11 h-11 bg-gray-100 rounded-2xl flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0">
                        {getInitials(item.profiles?.nama)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {item.profiles?.nama ||
                            item.profiles?.email ||
                            "—"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.templates?.nama_template || "—"}
                        </p>

                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-600">
                        {statusLabel[item.status] || item.status}
                      </span>

                      <ChevronRight
                        size={16}
                        className="text-gray-300"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Surat yang Diajukan Admin */}
          <div>
            <h2 className="font-semibold text-lg text-gray-800 mb-4">
              Surat yang Saya Ajukan
            </h2>

            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e7eb",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {loading ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#aaa",
                    fontSize: 13,
                  }}
                >
                  Memuat data...
                </div>
              ) : adminSurat.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#aaa",
                    fontSize: 13,
                  }}
                >
                  Belum ada surat yang diajukan.
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {[
                        "No. Surat",
                        "Jenis Surat",
                        "Tanggal",
                        "Status",
                        "Aksi",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 18px",
                            textAlign: "left",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#888",
                            borderBottom: "0.5px solid #e5e7eb",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {adminSurat.map((row, i) => {
                      const st =
                        statusConfig[row.status] ||
                        statusConfig.draft;

                      return (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom:
                              i < adminSurat.length - 1
                                ? "0.5px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          <td style={{ padding: "11px 18px" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                background: "#f4f6f9",
                                padding: "3px 7px",
                                borderRadius: 4,
                                color: "#555",
                              }}
                            >
                              {row.status === "approved" && row.nomor_surat ? row.nomor_surat : "Belum ada nomor"}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "11px 18px",
                              fontWeight: 500,
                            }}
                          >
                            {row.templates?.nama_template || "—"}
                          </td>

                          <td
                            style={{
                              padding: "11px 18px",
                              color: "#888",
                            }}
                          >
                            {new Date(
                              row.created_at
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          <td style={{ padding: "11px 18px" }}>
                            <span
                              style={{
                                background: st.bg,
                                color: st.color,
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 99,
                                display: "inline-block",
                              }}
                            >
                              {st.label}
                            </span>
                          </td>

                          <td style={{ padding: "11px 18px" }}>
                            <div
                              onClick={() =>
                                setSelectedSuratId(row.id)
                              }
                              title="Lihat detail & alur persetujuan"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                border:
                                  "0.5px solid #e5e7eb",
                                background: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#888"
                                strokeWidth="2"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {selectedSuratId && (
              <SuratDetailModal
                suratId={selectedSuratId}
                createdAt={
                  adminSurat.find(
                    (s) => s.id === selectedSuratId
                  )?.created_at
                }
                onClose={() =>
                  setSelectedSuratId(null)
                }
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4">
          <div className="bg-[#0B2A4A] text-white p-6 rounded-3xl shadow-xl sticky top-6">
            <h2 className="font-semibold text-xl mb-6">
              Quick Actions
            </h2>

            <div className="space-y-4">
              <Quick
                icon={<Plus size={20} />}
                title="Create New Template"
                desc="Design institutional templates"
                onClick={() =>
                  router.push("/dashboard/templates")
                }
              />

              <Quick
                icon={<Download size={20} />}
                title="Export Reports"
                desc="Monthly administrative summary"
              />

              <Quick
                icon={<Settings size={20} />}
                title="User Management"
                desc="Control access levels & permissions"
                onClick={() =>
                  router.push("/dashboard/settings/nomor")
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, value, icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow transition-all flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
          {title}
        </p>

        <p className="text-sm text-gray-500 mt-1">
          {desc}
        </p>

        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mt-3">
          {value}
        </h2>
      </div>

      <div
        className={`p-4 rounded-2xl ${colors[color]} shrink-0`}
      >
        {icon}
      </div>
    </div>
  );
}

function Quick({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-4 bg-white/10 hover:bg-white/15 p-4 rounded-2xl transition-all cursor-pointer group"
    >
      <div className="mt-0.5 text-white/80 group-hover:text-white transition-colors">
        {icon}
      </div>

      <div>
        <p className="text-base font-medium text-white">
          {title}
        </p>

        <p className="text-sm text-white/70 mt-0.5 leading-tight">
          {desc}
        </p>
      </div>
    </div>
  );
}