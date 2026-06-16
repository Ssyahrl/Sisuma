"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload, // Disiapkan untuk UI upload (jika nanti ditambahkan)
  ChevronRight,
  CheckCircle2,
  Shield,
  PenSquare,
  X,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";


// ==========================================
// KONSTANTA
// ==========================================
const ALUR_PROSES = [
  { step: 1, label: "Submit Form", desc: "Mahasiswa mengisi data pengajuan.", icon: <PenSquare size={16} /> },
  { step: 2, label: "Verifikasi Admin", desc: "Surat diverifikasi oleh Bag Tata Usaha.", icon: <Shield size={16} /> },
  { step: 3, label: "Digital Signature", desc: "Penerbitan surat dengan TTE resmi.", icon: <CheckCircle2 size={16} /> },
];

export default function PengajuanSuratPage() {
  const router = useRouter();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [jenisSurat, setJenisSurat] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedJenis, setSelectedJenis] = useState(null);
  const [catatanFakultas, setCatatanFakultas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
const [previewId, setPreviewId] = useState(null);

  // State untuk fitur Upload File (Mesin siap, tinggal tambah UI-nya)
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  // ==========================================
  // PENGAMBILAN DATA (EFFECTS)
  // ==========================================
  useEffect(() => {
    const fetchDrafts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) { 
        setLoadingTemplates(false); 
        return; 
      }

      const { data, error } = await supabase
        .from("surat")
        .select("id, template_id, data_json, created_at, templates(nama_template)")
        .eq("user_id", user.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setJenisSurat(data);
      }
      setLoadingTemplates(false);
    };

    fetchDrafts();
  }, []);

  // ==========================================
  // FUNGSI & HANDLER
  // ==========================================
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!selectedJenis) return alert("Pilih surat terlebih dahulu.");
    if (submitting) return;
    
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload dokumen pendukung kalau ada file yang dipilih
      let dokumen_url = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `pendukung/${user.id}_${Date.now()}.${ext}`;
        
        const { error: upErr } = await supabase.storage
          .from("dokumen")
          .upload(path, file);
          
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("dokumen").getPublicUrl(path);
          dokumen_url = urlData.publicUrl;
        }
      }

      // Kirim data ke API internal Next.js
      const res = await fetch(`/api/surat/${selectedJenis.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keperluan: catatanFakultas || "-",
          dokumen_url,
          catatan_fakultas: catatanFakultas,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Arahkan kembali ke dashboard jika sukses
      router.push("/dashboard/fakultas");
    } catch (err) {
      alert("Gagal mengirim: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDraft = async (e, suratId) => {
  e.stopPropagation(); // Jangan trigger select
  if (!confirm("Hapus draft surat ini?")) return;
  
  setDeletingId(suratId);
  try {
    const { error } = await supabase
      .from("surat")
      .delete()
      .eq("id", suratId);
      
    if (error) throw error;
    
    setJenisSurat(prev => prev.filter(s => s.id !== suratId));
    if (selectedJenis?.id === suratId) setSelectedJenis(null);
  } catch (err) {
    alert("Gagal menghapus: " + err.message);
  } finally {
    setDeletingId(null);
  }
};

  // ==========================================
  // RENDER TAMPILAN UI
  // ==========================================
  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
        <span className="cursor-pointer hover:text-gray-600" onClick={() => router.push("/dashboard/fakultas")}>
          Dashboard
        </span>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">Pengajuan Surat</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Pengajuan Surat</h1>
      <p className="text-sm text-gray-400 mb-6">
        Layanan administrasi digital untuk memproses permohonan surat keterangan, izin, dan dokumen akademik secara efisien.
      </p>

      <div className="flex gap-5 items-start">
        {/* Panel Kiri: Form Card */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-800 mb-1">Detail Permohonan</p>
          <p className="text-xs text-gray-400 mb-5">Lengkapi informasi di bawah ini untuk memulai pengajuan.</p>

          {/* List Jenis Surat Tersimpan */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Jenis Surat yang Tersimpan
            </label>
            
            {loadingTemplates ? (
              <p className="text-xs text-gray-300">Memuat surat...</p>
            ) : jenisSurat.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-300">Belum ada surat yang disimpan.</p>
                <button
                  onClick={() => router.push("/dashboard/fakultas/surat")}
                  className="mt-2 text-xs text-[#0B2A4A] font-medium hover:underline"
                >
                  Buat surat baru →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {jenisSurat.map(s => (
                  <div
  key={s.id}
  onClick={() => setSelectedJenis(s)}
  className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
    ${
      selectedJenis?.id === s.id
        ? "border-[#0B2A4A] bg-[#0B2A4A]/5"
        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
    }`}
>
  {/* Tombol Hapus */}
  <button
    onClick={(e) => handleDeleteDraft(e, s.id)}
    disabled={deletingId === s.id}
    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors group"
    title="Hapus draft"
  >
    {deletingId === s.id ? (
      <span className="w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
    ) : (
      <X size={10} className="text-gray-400 group-hover:text-red-500" />
    )}
  </button>

  <div
    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
    ${selectedJenis?.id === s.id ? "bg-[#0B2A4A]" : "bg-gray-100"}`}
  >
    <FileText size={14} className={selectedJenis?.id === s.id ? "text-white" : "text-gray-400"} />
  </div>
  <div className="min-w-0 pr-4">
    <p className="text-xs font-semibold text-gray-700 truncate">
      {s.templates?.nama_template || "Surat"}
    </p>
    <p className="text-[10px] text-gray-400 mt-0.5">
      {new Date(s.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}

    </p>
    <button
      onClick={(e) => { e.stopPropagation(); setPreviewId(s.id); }}
      className="text-gray-300 hover:text-[#0B2A4A] transition-colors"
      title="Preview surat"
    >
      <Eye size={12} />
    </button>
  </div>
  {previewId && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-xl overflow-hidden">
      {/* Header modal */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Preview Surat</p>
        <button
          onClick={() => setPreviewId(null)}
          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Iframe */}
      <iframe
        src={`/api/surat/${previewId}/preview`}
        className="flex-1 w-full"
        title="Preview Surat"
      />
    </div>
  </div>
)}
</div>
                ))}
              </div>
            )}
          </div>

          {/* Form Keperluan / Catatan */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Catatan untuk Admin <span className="text-gray-300 font-normal">(opsional)</span>
            </label>
            <textarea
              value={catatanFakultas}
              onChange={e => setCatatanFakultas(e.target.value)}
              placeholder="Tambahkan catatan khusus yang perlu diketahui admin..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none outline-none focus:border-[#0B2A4A]/40 placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => router.push("/dashboard/fakultas")}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Batalkan
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#0B2A4A] text-white text-sm font-medium hover:bg-[#0d3560] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? "Mengirim..." : "Kirim Pengajuan"}
              {!submitting && <ChevronRight size={15} />}
            </button>
          </div>
        </div>

        {/* Panel Kanan: Sidebar Info */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          
          {/* Card: Alur Proses */}
          <div className="bg-[#0B2A4A] rounded-2xl p-5">
            <p className="text-white text-sm font-semibold mb-4">Alur Proses</p>
            <div className="flex flex-col gap-4">
              {ALUR_PROSES.map((item, idx) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
                      <span className="text-xs font-bold">{item.step}</span>
                    </div>
                    {idx < ALUR_PROSES.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 mt-1.5" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-white text-xs font-semibold leading-none mb-1">{item.label}</p>
                    <p className="text-white/40 text-[11px] leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Banner Informasi Otomatis Hapus */}
          <div className="rounded-2xl overflow-hidden relative h-36 bg-[#0B2A4A]">
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <p className="text-white text-sm font-semibold leading-snug">Informasi Akademik</p>
              <p className="text-white/60 text-[11px] mt-1 leading-snug">
                Pengajuan yang sudah approve dan direject akan otomatis terhapus setelah 24 jam, pastikan untuk mendownload salinan surat yang sudah jadi jika diperlukan.
              </p>
            </div>
          </div>

          {/* Card: Informasi Tambahan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Tambahan</p>
            {[
              ["Format Dokumen", "PDF, JPG, PNG (maks 5MB)"], 
              ["Pengambilan Fisik", "Loket TU Lt. 1, Senin–Jumat"]
            ].map(([k]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs text-gray-300">—</span>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}