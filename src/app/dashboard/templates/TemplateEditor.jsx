"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// KONSTANTA
// ==========================================
// Tujuan pengajuan Admin & approval chain-nya
const TUJUAN_OPTIONS = [
  { 
    value: "SEKRETARIS", 
    label: "Sekretaris Rektor",
    chain: "Sekretaris"
  },
  { 
    value: "WAREK", 
    label: "Wakil Rektor",
    chain: "Sekretaris → Warek"
  },
  { 
    value: "REKTOR", 
    label: "Rektor",
    chain: "Sekretaris → Warek → Rektor"
  },
];

export default function TemplateEditor({ template }) {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [values, setValues]                 = useState({});
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [tujuan, setTujuan]                 = useState(null);
  const [catatan, setCatatan]               = useState("");
  const [submitting, setSubmitting]         = useState(false);

  // ==========================================
  // 2. COMPUTED VALUES (Preview HTML)
  // ==========================================
  const previewHtml = useMemo(() => {
    if (!template?.html_template) {
      return "<p>Preview tidak tersedia</p>";
    }
      
    let html = template.html_template;
    
    // Highlight variabel yang sudah diisi
    Object.entries(values).forEach(([key, val]) => {
      html = html.replaceAll(
        `{${key}}`,
        `<mark class="bg-yellow-100 text-yellow-800 px-0.5 rounded">${val}</mark>`
      );
    });
    
    // Highlight sisa variabel yang belum diisi
    html = html.replace(
      /{(.*?)}/g,
      `<span class="bg-red-100 text-red-400 px-0.5 rounded italic">{$1}</span>`
    );
    
    return html;
  }, [template?.html_template, values]);

  // Jika belum ada template yang dipilih
  if (!template) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Pilih template terlebih dahulu
      </div>
    );
  }

  const fields = template.variables?.filter((v) => v !== "No") || [];

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleKirim = async () => {
    try {
      const res = await fetch(`/api/templates/${template.id}/publish`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error();
      alert("Template berhasil dikirim ke Fakultas!");
    } catch {
      alert("Gagal kirim ke Fakultas");
    }
  };

  const handleGenerate = async () => {
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_url: template.file_url, values }),
      });
      
      if (!res.ok) throw new Error();
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      a.href = url; 
      a.download = "hasil.docx"; 
      a.click();
      
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal generate dokumen");
    }
  };

const handleAjukanAdmin = async () => {
  if (!tujuan) { 
    alert("Pilih tujuan terlebih dahulu"); 
    return; 
  }

  // Validasi semua field harus diisi
  const emptyFields = fields.filter(f => !values[f]?.trim());
  if (emptyFields.length > 0) {
    alert(`Mohon isi field berikut:\n${emptyFields.join(", ")}`);
    return;
  }

  setSubmitting(true);
    
    try {
      // Ambil session token untuk Authorization API
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      console.log("session:", session);

      const res = await fetch("/api/surat/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ template_id: template.id, values, tujuan, catatan }),
      });
      
      if (!res.ok) throw new Error();
      
      alert("Surat berhasil diajukan!");
      setShowAdminModal(false);
      setTujuan(null);
      setCatatan("");
    } catch {
      alert("Gagal mengajukan surat");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // 4. RENDER UI
  // ==========================================
  return (
    <>
      <div className="bg-white rounded-2xl shadow h-full flex flex-col">

        {/* Header + Tombol Aksi */}
        <div className="border-b px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="font-semibold text-lg">Isi Data Template</h2>
          <div className="flex gap-2">
            <button
              onClick={handleKirim}
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 transition"
            >
              Kirim ke Fakultas
            </button>

         <button
  onClick={() => { 
    const emptyFields = fields.filter(f => !values[f]?.trim());
    if (emptyFields.length > 0) {
      alert(`Isi semua variabel dulu:\n${emptyFields.join(", ")}`);
      return;
    }
    setShowAdminModal(true); 
    setTujuan(null); 
  }}
  className="border border-violet-600 text-violet-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-50 transition"
>
  Ajukan sebagai Admin
</button>
          </div>
        </div>

        {/* Body Editor */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Panel Kiri: Input Variabel */}
          <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r p-6 space-y-4 overflow-auto">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Variabel
            </p>
            {fields.length === 0 ? (
              <p className="text-gray-400 text-sm">Tidak ada variabel</p>
            ) : (
              fields.map((field) => (
                <div key={field}>
                  <label className="block text-sm mb-1 font-medium text-gray-700">
                    {field}
                  </label>
                  <input
                    type="text"
                    value={values[field] || ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder={`Isi ${field}`}
                  />
                </div>
              ))
            )}
          </div>

          {/* Panel Kanan: Kertas Preview HTML */}
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-xl p-8 min-h-full">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
                Preview Dokumen
              </p>
              <div
                className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
          
        </div>
      </div>

      {/* ==========================================
          MODAL: AJUKAN SEBAGAI ADMIN
          ========================================== */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-gray-900">Ajukan sebagai Admin</h2>
              <p className="text-xs text-gray-400 mt-1">Pilih tujuan pengajuan surat</p>
            </div>

            <div className="px-6 pb-6 space-y-3">
              {/* Opsi Tujuan */}
              {TUJUAN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTujuan(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                    tujuan === opt.value
                      ? "bg-violet-50 border-violet-400"
                      : "bg-gray-50 border-transparent hover:border-gray-200"
                  }`}
                >
                  <p className={`text-sm font-medium ${tujuan === opt.value ? "text-violet-700" : "text-gray-700"}`}>
                    {opt.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${tujuan === opt.value ? "text-violet-400" : "text-gray-400"}`}>
                    {opt.chain}
                  </p>
                </button>
              ))}

              {/* Input Catatan */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  Catatan <span className="text-gray-300">(opsional)</span>
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan untuk penerima..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAdminModal(false); setCatatan(""); }}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleAjukanAdmin}
                  disabled={!tujuan || submitting}
                  className="flex-1 py-3 text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition"
                >
                  {submitting ? "Mengajukan..." : "Ajukan Surat"}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}