"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Konfigurasi label dan warna status utama (DIPERBAIKI: Tambahkan export)
export const statusConfig = {
  draft:              { label: "DRAFT",           bg: "#f4f6f9", color: "#888" },
  pending_admin:      { label: "Menunggu Admin",  bg: "#faeeda", color: "#854F0B" },
  pending_sekretaris: { label: "Di Sekretaris",   bg: "#faeeda", color: "#854F0B" },
  pending_wakil:      { label: "Di Wakil Rektor", bg: "#e6f1fb", color: "#185FA5" },
  pending_rektor:     { label: "Di Rektor",       bg: "#ede9fe", color: "#5B21B6" },
  approved:           { label: "DISETUJUI",       bg: "#eaf3de", color: "#3B6D11" },
  rejected:           { label: "DITOLAK",         bg: "#fcebeb", color: "#A32D2D" },
};

// Pemetaan Role (DIPERBAIKI: Tambahkan export)
export const roleLabel = {
  fakultas:     "Fakultas",
  admin:        "Admin / TU",
  sekretaris:   "Sekretaris",
  warek:        "Wakil Rektor",
  rektor:       "Rektor",
};

// Styling untuk setiap card di riwayat catatan
const stepStatusStyle = (status) => {
  if (status === "approved") return {
    border: "#bbf7d0", bg: "#f0fdf4",
    badge: { bg: "#dcfce7", color: "#166534", label: "DISETUJUI" },
  };
  if (status === "rejected") return {
    border: "#fecaca", bg: "#fff1f2",
    badge: { bg: "#fee2e2", color: "#991b1b", label: "DITOLAK" },
  };
  if (status === "pending") return {
    border: "#fde68a", bg: "#fffbeb",
    badge: { bg: "#fef9c3", color: "#854d0e", label: "MENUNGGU" },
  };
  return {
    border: "#e5e7eb", bg: "#fafafa",
    badge: { bg: "#f3f4f6", color: "#6b7280", label: "BELUM GILIRAN" },
  };
};

const barColor = (status) => {
  if (status === "approved") return "#22c55e";
  if (status === "rejected") return "#ef4444";
  if (status === "pending")  return "#f59e0b";
  return "#e5e7eb";
};

export default function SuratDetailModal({ suratId, createdAt, onClose }) {
  const [surat, setSurat]             = useState(null);
  const [steps, setSteps]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!suratId) return;
    (async () => {
      setLoading(true);
      try {
        // Fetch data surat utama
        const { data: suratData } = await supabase
          .from("surat")
          .select(`
            id, nomor_surat, status, created_at, tujuan,
            catatan_fakultas, catatan_admin, catatan_sekretaris,
            catatan_wakil_rektor, catatan_rektor,
            template_id, templates(nama_template)
          `)
          .eq("id", suratId)
          .single();

        // Fetch data alur persetujuan
        const { data: stepsData } = await supabase
          .from("approval_steps")
          .select("role, status, catatan, nama, updated_at, created_at")
          .eq("surat_id", suratId)
          .order("created_at", { ascending: true });

        setSurat(suratData);

        const catatanCol = {
          fakultas:   suratData?.catatan_fakultas,
          admin:      suratData?.catatan_admin,
          sekretaris: suratData?.catatan_sekretaris,
          warek:      suratData?.catatan_wakil_rektor,
          rektor:     suratData?.catatan_rektor,
        };

        let enriched = [];

        if (stepsData && stepsData.length > 0) {
          enriched = stepsData.map((s) => {
            const lowRole = s.role?.toLowerCase() || "";
            return {
              ...s,
              role: lowRole,
              catatan: s.catatan || catatanCol[lowRole] || null
            };
          });
        } else if (suratData) {
          const tujuan = suratData.tujuan || "ADMIN";
          const chainMap = {
            SEKRETARIS: ["admin", "sekretaris"],
            WAREK:      ["admin", "sekretaris", "warek"],
            REKTOR:     ["admin", "sekretaris", "warek", "rektor"],
            ADMIN:      ["admin"],
          };
          
          const chain = chainMap[tujuan] || ["admin"];
          const isRejected = suratData.status === "rejected";
          const isApproved = suratData.status === "approved";

          chain.forEach((role) => {
            let stepStatus = "waiting";
            const note = catatanCol[role.toLowerCase()];

            if (isApproved) {
              stepStatus = "approved";
            } else if (isRejected) {
              if (note) stepStatus = "rejected";
              else stepStatus = "waiting";
            }

            enriched.push({
              role: role.toLowerCase(),
              status: stepStatus,
              catatan: note || null,
              updated_at: null,
            });
          });
        }

        // Tambahkan pengaju (fakultas)
        if (catatanCol.fakultas && !enriched.some(s => s.role === 'fakultas')) {
          enriched.unshift({
            role: "fakultas",
            status: "approved",
            catatan: catatanCol.fakultas,
            updated_at: suratData.created_at,
          });
        }

        setSteps(enriched);
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [suratId]);

  const isApproved    = surat?.status === "approved";
  const isRejected    = surat?.status === "rejected";
  const hasNomor      = isApproved && !!surat?.nomor_surat;
  const overallCfg    = statusConfig[surat?.status] || statusConfig.draft;
  const progressSteps = steps.filter((s) => s.role !== "fakultas");
  const rejectedBy    = isRejected ? steps.find((s) => s.status === "rejected") : null;

  const handleDownload = async () => {
    if (!surat?.nomor_surat) return;
    setDownloading(true);
    try {
      const res  = await fetch(`/api/surat/${surat.id}/download`);
      if (!res.ok) throw new Error("Gagal mengambil surat");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `surat_${surat.nomor_surat.replace(/\//g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download gagal: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480,
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "0.5px solid #e5e7eb", background: "#fafafa",
        }}>
          <div style={{ fontSize: 10, color: "#999", marginTop: 2, fontFamily: "monospace" }}>
            {isApproved && surat?.nomor_surat ? surat.nomor_surat : "Nomor belum diterbitkan"}
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: "0.5px solid #e5e7eb",
            background: "#fff", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 14, color: "#888",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 12 }}>
              Memuat detail...
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "0.5px solid #e5e7eb" }}>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Jenis Surat</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{surat?.templates?.nama_template || "—"}</div>
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: "0.5px solid #e5e7eb" }}>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Tanggal Diajukan</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                    {new Date(surat?.created_at || createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div style={{
                background: isRejected ? "#fff1f2" : "#f9fafb",
                borderRadius: 8, padding: "10px 12px",
                border: isRejected ? "0.5px solid #fecaca" : "0.5px solid #e5e7eb",
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status Saat Ini</div>
                  {isRejected && (
                    <div style={{ fontSize: 10, color: "#991b1b", marginTop: 2, fontWeight: 600 }}>
                      Ditolak oleh {rejectedBy ? (roleLabel[rejectedBy.role] || rejectedBy.role) : "Sistem/Admin"}
                    </div>
                  )}
                </div>
                <span style={{
                  background: overallCfg.bg, color: overallCfg.color,
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                }}>
                  {overallCfg.label}
                </span>
              </div>

              {/* Riwayat Catatan */}
              <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Riwayat Catatan
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map(({ role, status, catatan, nama, updated_at }, idx) => {
                  const cfg = stepStatusStyle(status);
                  return (
                    <div key={`${role}-${idx}`} style={{
                      border: `0.5px solid ${cfg.border}`,
                      background: cfg.bg, borderRadius: 10, padding: "11px 14px",
                      ...(role === "fakultas" ? { borderLeft: "4px solid #93c5fd" } : {}),
                      ...(status === "rejected" ? { borderLeft: "4px solid #f87171" } : {}),
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{roleLabel[role] || role}</div>
                          {updated_at && <div style={{ fontSize: 9, color: "#aaa" }}>{new Date(updated_at).toLocaleString("id-ID")}</div>}
                        </div>
                        <span style={{ background: cfg.badge.bg, color: cfg.badge.color, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                          {role === "fakultas" ? "DIAJUKAN" : cfg.badge.label}
                        </span>
                      </div>
                      {catatan && (
                        <div style={{ marginTop: 8, padding: "8px", background: "rgba(255,255,255,0.5)", borderRadius: 6, borderLeft: "2px solid #e5e7eb" }}>
                          <div style={{ fontSize: 11, color: "#444" }}>{catatan}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "0.5px solid #e5e7eb", background: "#fafafa", display: "flex", gap: 8 }}>
          {hasNomor ? (
            <button onClick={handleDownload} disabled={downloading} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {downloading ? "Menyiapkan..." : "Download Surat"}
            </button>
          ) : (
            <button disabled style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#f3f4f6", color: "#9ca3af", border: "0.5px solid #e5e7eb", fontSize: 12, fontWeight: 600 }}>
              Belum Ada Surat
            </button>
          )}
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}