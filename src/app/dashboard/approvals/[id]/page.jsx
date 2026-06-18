"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CheckCircle, XCircle, Printer, Clock, MessageSquare } from "lucide-react";

// ==========================================
// KONSTANTA & PEMETAAN 
// (Dipindah ke luar agar tidak dibuat ulang setiap kali halaman re-render)
// ==========================================

const ROLE_MAP = {
  pending_admin: "admin",
  pending_sekretaris: "sekretaris",
  pending_wakil: "warek",
  pending_rektor: "rektor",
};

const DB_COLUMN_MAP = {
  admin: "catatan_admin",
  sekretaris: "catatan_sekretaris",
  warek: "catatan_wakil_rektor",
  rektor: "catatan_rektor",
};

const LABEL_MAP = {
  fakultas: "Fakultas",
  admin: "Admin",
  sekretaris: "Sekretaris",
  warek: "Wakil Rektor",
  rektor: "Rektor",
};

const STATUS_COLOR = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  waiting: "bg-gray-100 text-gray-400",
};

const NEXT_ROLE_MAP = {
  pending_sekretaris: "sekretaris",
  pending_wakil: "warek",
  pending_rektor: "rektor",
};

export default function ApprovalDetailPage() {
  // ==========================================
  // 1. INISIALISASI STATE & HOOKS
  // ==========================================
  const router = useRouter();
  const { id } = useParams();
  
  const [surat, setSurat] = useState(null);
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // 2. MENGAMBIL DATA DARI DATABASE
  // ==========================================
  useEffect(() => {
    async function fetchSurat() {
      setLoading(true);

      const [{ data, error }, { data: steps }] = await Promise.all([
        supabase
          .from("surat")
          .select(`*, profiles(nama, email), templates(nama_template, approval_flow)`)
          .eq("id", id)
          .single(),
        supabase
          .from("approval_steps")
          .select("*")
          .eq("surat_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (error) {
        alert("Surat tidak ditemukan.");
        router.push("/dashboard");
        return;
      }

      setSurat(data);
      setApprovalSteps(steps || []);
      setLoading(false);
    }

    if (id) {
      fetchSurat();
    }
  }, [id, router]);

  // ==========================================
  // 3. LOGIKA ALUR PERSETUJUAN
  // ==========================================
const currentRole = ROLE_MAP[surat?.status] || null;
const isFinished = surat?.status === "rejected" || surat?.status === "approved";
const canAct = !!currentRole && !isFinished;


  const getNextStatus = () => {
    const flow = surat?.templates?.approval_flow || [];
    
    if (surat?.status === "pending_admin") {
      if (flow.includes("SEKRETARIS")) return "pending_sekretaris";
      if (flow.includes("WAREK")) return "pending_wakil";
      if (flow.includes("REKTOR")) return "pending_rektor";
    }
    if (surat?.status === "pending_sekretaris") {
      if (flow.includes("WAREK")) return "pending_wakil";
      if (flow.includes("REKTOR")) return "pending_rektor";
    }
    if (surat?.status === "pending_wakil") {
      if (flow.includes("REKTOR")) return "pending_rektor";
    }
    
    return "approved";
  };

  // ==========================================
  // AKSI: SETUJUI & TERUSKAN
  // ==========================================
  const handleTeruskan = async () => {
    if (!canAct) return;
    setSubmitting(true);

    const nextStatus = getNextStatus();
    const cleanCatatan = catatan.trim() || null;
    const now = new Date().toISOString();

    try {
      const dbCol = DB_COLUMN_MAP[currentRole];
      
      // Update data surat
      const { error: errSurat } = await supabase
        .from("surat")
        .update({ status: nextStatus, updated_at: now, [dbCol]: cleanCatatan })
        .eq("id", id);
        
      if (errSurat) throw errSurat;

      // Tandai step approval saat ini sebagai selesai
      await supabase
        .from("approval_steps")
        .update({ status: "approved", catatan: cleanCatatan, updated_at: now })
        .eq("surat_id", id)
        .eq("role", currentRole);

      // Siapkan step approval untuk pemeriksa selanjutnya
      const nextRole = NEXT_ROLE_MAP[nextStatus];
      if (nextRole) {
        await supabase
          .from("approval_steps")
          .update({ status: "pending", updated_at: now })
          .eq("surat_id", id)
          .eq("role", nextRole);
      }

      router.push("/dashboard");
    } catch (err) {
      alert("Kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // AKSI: TOLAK SURAT
  // ==========================================
  const handleTolak = async () => {
    if (!catatan.trim())
       return alert("Wajib memberikan alasan penolakan.");
    
    setSubmitting(true);
    const now = new Date().toISOString();

    try {
      const dbCol = DB_COLUMN_MAP[currentRole];
      
      // Update data surat menjadi ditolak
      await supabase
        .from("surat")
        .update({ status: "rejected", updated_at: now, [dbCol]: catatan.trim() })
        .eq("id", id);

      // Update riwayat step menjadi ditolak
      await supabase
        .from("approval_steps")
        .update({ status: "rejected", catatan: catatan.trim(), updated_at: now })
        .eq("surat_id", id)
        .eq("role", currentRole);

      router.push("/dashboard");
    } catch (err) {
      alert("Gagal menolak: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // 4. RENDER TAMPILAN UI
  // ==========================================
  if (loading) return <div className="p-20 text-center text-gray-400 font-medium">Memproses data...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm">
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </button>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          <Clock size={14} /> {surat.status.replace(/_/g, " ")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Kiri */}
        <div className="lg:col-span-4 space-y-6">

          {/* Info Pengaju */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Detail Pengaju</h2>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-lg">
                {surat.profiles?.nama?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-800">{surat.profiles?.nama}</p>
                <p className="text-xs text-gray-500">{surat.profiles?.email}</p>
              </div>
            </div>

            {/* Catatan Fakultas */}
            {surat.catatan_fakultas && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Pesan dari Fakultas</p>
                <p className="text-sm text-blue-800 italic leading-relaxed">&quot;{surat.catatan_fakultas}&quot;</p>
              </div>
            )}
          </div>

          {/* History Catatan per Approval */}
          {approvalSteps.filter(s => s.catatan).length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-gray-400" />
                <h3 className="font-bold text-gray-800 text-sm">Riwayat Catatan</h3>
              </div>
              <div className="space-y-3">
                {approvalSteps
                  .filter(s => s.catatan)
                  .map((step) => (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <div className="w-px flex-1 bg-gray-100 mt-1" />
                      </div>
                      <div className="pb-3 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {LABEL_MAP[step.role] || step.role}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[step.status] || ""}`}>
                            {step.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{step.catatan}</p>
                        <p className="text-[10px] text-gray-300 mt-1">
                          {new Date(step.updated_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Form Tindakan */}
          {canAct ? (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800">Tindakan Persetujuan</h3>
              <textarea
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-100 text-sm"
                rows={5}
                placeholder="Berikan instruksi atau alasan di sini..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleTolak}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-2xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Tolak
                </button>
                <button
                  onClick={handleTeruskan}
                  disabled={submitting}
                  className="flex-2 py-3 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  <CheckCircle size={18} /> {submitting ? "Memproses..." : "Setujui & Teruskan"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-amber-700 text-center text-sm font-medium">
              Dokumen ini sedang menunggu persetujuan pihak lain atau sudah selesai diproses.
            </div>
          )}
        </div>

        {/* Panel Kanan: Preview */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col sticky top-6">
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview Dokumen Digital</span>
              <button onClick={() => window.print()} className="p-2 hover:bg-white rounded-xl transition text-gray-500">
                <Printer size={18} />
              </button>
            </div>
            <div className="p-12 overflow-y-auto max-h-[80vh] bg-white">
              <div
                className="prose prose-slate max-w-none"
                style={{ fontFamily: "serif", lineHeight: "1.5", color: "black" }}
                dangerouslySetInnerHTML={{ __html: surat.isi_final }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}