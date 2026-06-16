"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, FileDown } from "lucide-react";

const pdfEnabled = process.env.NEXT_PUBLIC_PDF_ENABLED === "true";

// ==========================================
// KONSTANTA & PENGATURAN TAMPILAN
// ==========================================
const statusConfig = {
  draft: { label: "DRAFT", bg: "#f4f6f9", color: "#888" },
  pending_admin: { label: "Menunggu Admin", bg: "#faeeda", color: "#854F0B" },
  pending_sekretaris: { label: "Di Sekretaris", bg: "#faeeda", color: "#854F0B" },
  pending_wakil: { label: "Di Wakil Rektor", bg: "#e6f1fb", color: "#185FA5" },
  pending_rektor: { label: "Di Rektor", bg: "#ede9fe", color: "#5B21B6" },
  approved: { label: "DISETUJUI", bg: "#eaf3de", color: "#3B6D11" },
  rejected: { label: "DITOLAK", bg: "#fcebeb", color: "#A32D2D" },
};

const roleLabel = {
  ADMIN: "Admin",
  SEKRETARIS: "Sekretaris",
  WAREK: "Wakil Rektor",
  WAKIL_REKTOR: "Wakil Rektor",
  REKTOR: "Rektor",
};

const stepStatusStyle = (status) => {
  if (status === "approved") {
    return {
      border: "#bbf7d0",
      bg: "#f0fdf4",
      badge: {
        bg: "#dcfce7",
        color: "#166534",
        label: "DISETUJUI",
      },
    };
  }

  if (status === "rejected") {
    return {
      border: "#fecaca",
      bg: "#fff1f2",
      badge: {
        bg: "#fee2e2",
        color: "#991b1b",
        label: "DITOLAK",
      },
    };
  }

  return {
    border: "#e5e7eb",
    bg: "#fafafa",
    badge: {
      bg: "#f3f4f6",
      color: "#6b7280",
      label: "MENUNGGU",
    },
  };
};

const barColor = (status) => {
  if (status === "approved") return "#22c55e";
  if (status === "rejected") return "#ef4444";
  return "#e5e7eb";
};

// ==========================================
// KOMPONEN: SURAT DETAIL MODAL
// ==========================================
function SuratDetailModal({ suratId, createdAt, onClose }) {
  // 1. STATE
  const [surat, setSurat] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // 2. DATA FETCHING
  useEffect(() => {
    if (!suratId) return;

    (async () => {
      try {
        setLoading(true);

        // Ambil Data Surat Utama
        const { data: suratData, error: suratError } = await supabase
          .from("surat")
          .select(`
            id, nomor_surat, status, created_at, updated_at, template_id,
            catatan_admin, catatan_sekretaris, catatan_wakil_rektor, catatan_rektor,
            templates(nama_template)
          `)
          .eq("id", suratId)
          .single();

        if (suratError) {
          console.error("SURAT ERROR:", suratError);
          return;
        }

        // Ambil Riwayat Approval Steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("approval_steps")
          .select(`role, status, catatan, updated_at`)
          .eq("surat_id", suratId)
          .order("updated_at", { ascending: true });

        if (stepsError) {
          console.error("STEP ERROR:", stepsError);
        }

        // Susun Catatan (Fallback ke kolom surat jika catatan di step kosong)
        const finalSteps = (stepsData || []).map((step) => {
          let fallbackCatatan = null;

          if (step.role === "ADMIN") fallbackCatatan = suratData?.catatan_admin;
          if (step.role === "SEKRETARIS") fallbackCatatan = suratData?.catatan_sekretaris;
          if (step.role === "WAREK" || step.role === "WAKIL_REKTOR") fallbackCatatan = suratData?.catatan_wakil_rektor;
          if (step.role === "REKTOR") fallbackCatatan = suratData?.catatan_rektor;

          return {
            ...step,
            catatan: step.catatan || fallbackCatatan || null,
          };
        });

        setSurat(suratData);
        setSteps(finalSteps);
      } catch (err) {
        console.error("MODAL ERROR:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [suratId]);

  // 3. COMPUTED VALUES (Kalkulasi Data)
  const lastApproved = [...(steps || [])]
    .filter((s) => s.status === "approved")
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

  const isApproved = surat?.status === "approved";
  const hasNomor   = !!surat?.nomor_surat;
  const overallCfg = statusConfig[surat?.status] || statusConfig.draft;
  
  const activeIndex = steps.findIndex((s) => !s.status || s.status === "pending");

  // Identifikasi Penolak & Alasan
  const rejectedBy = surat?.catatan_rektor ? "Rektor"
    : surat?.catatan_wakil_rektor ? "Wakil Rektor"
    : surat?.catatan_sekretaris ? "Sekretaris"
    : surat?.catatan_admin ? "Admin"
    : null;

  const rejectedReason =
    surat?.catatan_rektor ||
    surat?.catatan_wakil_rektor ||
    surat?.catatan_sekretaris ||
    surat?.catatan_admin ||
    null;

  // 4. HANDLERS
  const handleDownload = async () => {
    if (!surat?.nomor_surat) return;
    setDownloading(true);

    try {
      const res = await fetch(`/api/surat/${surat.id}/download`);
      if (!res.ok) throw new Error("Gagal mengambil surat");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");

      a.href     = url;
      a.download = `surat_${surat.nomor_surat.replace(/\//g, "-")}.docx`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download gagal: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  // 5. RENDER UI MODAL
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "0.5px solid #e5e7eb",
            background: "#fafafa",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
              Detail Surat
            </div>
            <div style={{ fontSize: 10, color: "#999", marginTop: 2, fontFamily: "monospace" }}>
              {surat?.nomor_surat || "Nomor belum diterbitkan"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "0.5px solid #e5e7eb", background: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14, color: "#888",
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY MODAL */}
        <div style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 12 }}>
              Memuat detail...
            </div>
          ) : (
            <>
              {/* INFO SINGKAT SURAT */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "0.5px solid #e5e7eb" }}>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                    Jenis Surat
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                    {surat?.templates?.nama_template || "SK"}
                  </div>
                </div>

                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "0.5px solid #e5e7eb" }}>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                    Tanggal Diajukan
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                    {(surat?.created_at || createdAt)
                      ? new Date(surat?.created_at || createdAt).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

              {/* STATUS SAAT INI */}
              <div
                style={{
                  background: "#f9fafb", borderRadius: 8, padding: "10px 12px",
                  border: "0.5px solid #e5e7eb", display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Status Saat Ini
                  </div>
                  {isApproved && lastApproved && (
                    <div style={{ fontSize: 10, color: "#3B6D11", marginTop: 2 }}>
                      Disetujui oleh {roleLabel[lastApproved.role] || lastApproved.role}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    background: overallCfg.bg, color: overallCfg.color, fontSize: 10,
                    fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                  }}
                >
                  {overallCfg.label}
                </span>
              </div>

              {/* INFORMASI PENOLAKAN */}
              {surat?.status === "rejected" && (
                <div style={{ background: "#fff1f2", border: "0.5px solid #fecdd3", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#be123c", textTransform: "uppercase", marginBottom: 10 }}>
                    Informasi Penolakan
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2, textTransform: "uppercase" }}>
                      Ditolak Oleh
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                      {rejectedBy || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase" }}>
                      Alasan Penolakan
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.7, fontStyle: "italic" }}>
                      &ldquo;{rejectedReason || "Tidak ada catatan"}&rdquo;
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRESS BAR ALUR */}
              {steps.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Alur Persetujuan
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    {steps.map(({ role, status }, idx) => (
                      <div key={role} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div
                          style={{
                            height: 5, width: "100%", borderRadius: 99, background: barColor(status),
                            opacity: (!status || status === "pending") ? (idx === activeIndex ? 1 : 0.35) : 1,
                          }}
                        />
                        <div style={{ fontSize: 8, color: "#aaa", textAlign: "center", whiteSpace: "nowrap" }}>
                          {roleLabel[role] || role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAIL STEPS */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {steps.map(({ role, status, catatan, updated_at }) => {
                  const cfg = stepStatusStyle(status);
                  return (
                    <div key={role} style={{ border: `0.5px solid ${cfg.border}`, background: cfg.bg, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                            {roleLabel[role] || role}
                          </div>
                          {updated_at && status !== "pending" && (
                            <div style={{ fontSize: 9, color: "#aaa", marginTop: 1 }}>
                              {new Date(updated_at).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                        <span style={{ background: cfg.badge.bg, color: cfg.badge.color, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
                          {cfg.badge.label}
                        </span>
                      </div>
                      {catatan && (
                        <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: "2px solid #e5e7eb" }}>
                          <div style={{ fontSize: 9, color: "#aaa", marginBottom: 2 }}>Catatan:</div>
                          <div style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>
                            &ldquo;{catatan}&rdquo;
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* FOOTER MODAL */}
       <div style={{ padding: "12px 20px", borderTop: "0.5px solid #e5e7eb", background: "#fafafa", display: "flex", gap: 8 }}>
  {hasNomor ? (
    <>
      <a href={`/api/surat/${suratId}/download?format=docx`} style={{ flex: 1, textDecoration: "none" }}>
        <button style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <FileText size={14} /> Word
        </button>
      </a>

      {pdfEnabled ? (
        <a href={`/api/surat/${suratId}/download?format=pdf`} style={{ flex: 1, textDecoration: "none" }}>
          <button style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <FileDown size={14} /> PDF
          </button>
        </a>
      ) : (
        <button disabled style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#f3f4f6", color: "#9ca3af", border: "0.5px solid #e5e7eb", fontSize: 12, fontWeight: 600, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <FileDown size={14} /> PDF
        </button>
      )}
    </>
  ) : (
    <button disabled style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#f3f4f6", color: "#9ca3af", border: "0.5px solid #e5e7eb", fontSize: 12, fontWeight: 600 }}>
      Belum Ada Surat
    </button>
  )}
  <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none" }}>
    Tutup
  </button>
</div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA: DASHBOARD FAKULTAS
// ==========================================
export default function DashboardFakultas() {
  // 1. STATE & HOOKS
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuratId, setSelectedSuratId] = useState(null);
  const [lastApprovers, setLastApprovers] = useState({});

  // 2. DATA FETCHING
  useEffect(() => {
    (async () => {
      let user;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch (e) {
        console.warn("auth error:", e.message);
        return;
      }
      
      if (!user) return;

      // Ambil List Pengajuan Surat
      const { data, error } = await supabase
        .from("surat")
        .select(`id, status, created_at, nomor_surat, template_id, templates(nama_template)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) return setLoading(false);
      setSuratList(data);

      // Cari Approver Terakhir untuk Surat yang "Approved"
      const approvedIds = data.filter((s) => s.status === "approved").map((s) => s.id);
      
      if (approvedIds.length > 0) {
        const { data: stepData } = await supabase
          .from("approval_steps")
          .select("surat_id, role, updated_at")
          .in("surat_id", approvedIds)
          .eq("status", "approved")
          .order("updated_at", { ascending: false });

        const map = {};
        (stepData || []).forEach((s) => { 
          if (!map[s.surat_id]) map[s.surat_id] = s; 
        });
        
        setLastApprovers(map);
      }

      setLoading(false);
    })();
  }, []);

  // 3. RENDER UI DASHBOARD
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", background: "#f4f6f9", minHeight: "100vh" }}>
      <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        Academic Overview
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 20 }}>
        Dashboard Overview
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "0.5px solid #e5e7eb" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Daftar Pengajuan Surat</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 13 }}>
            Memuat data...
          </div>
        ) : suratList.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 13 }}>
            Belum ada pengajuan surat
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["No. Surat", "Jenis Surat", "Tanggal", "Status", "Aksi"].map((h) => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suratList.map((row, i) => {
                const st = statusConfig[row.status] || statusConfig.draft;
                const lastApprover = lastApprovers[row.id];
                
                return (
                  <tr key={row.id} style={{ borderBottom: i < suratList.length - 1 ? "0.5px solid #e5e7eb" : "none" }}>
                    
                    {/* No. Surat */}
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: "#f4f6f9", padding: "3px 7px", borderRadius: 4, color: "#555" }}>
                        {row.nomor_surat || "Belum ada nomor"}
                      </span>
                    </td>
                    
                    {/* Jenis Surat */}
                    <td style={{ padding: "11px 18px", fontWeight: 500 }}>
                      {row.templates?.nama_template || "—"}
                    </td>
                    
                    {/* Tanggal */}
                    <td style={{ padding: "11px 18px", color: "#888" }}>
                      {new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    
                    {/* Status */}
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 99, display: "inline-block" }}>
                        {st.label}
                      </span>
                      {row.status === "approved" && lastApprover && (
                        <div style={{ fontSize: 9, color: "#888", marginTop: 3 }}>
                          oleh {roleLabel[lastApprover.role] || lastApprover.role}
                        </div>
                      )}
                    </td>
                    
                    {/* Aksi */}
                    <td style={{ padding: "11px 18px" }}>
                      <div
                        onClick={() => setSelectedSuratId(row.id)}
                        title="Lihat detail & alur persetujuan"
                        style={{ width: 26, height: 26, borderRadius: 6, border: "0.5px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
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

      {/* Render Modal Detail Surat jika ada yang diklik */}
      {selectedSuratId && (
        <SuratDetailModal
          suratId={selectedSuratId}
          createdAt={suratList.find((s) => s.id === selectedSuratId)?.created_at}
          onClose={() => setSelectedSuratId(null)}
        />
      )}
    </div>
  );
}