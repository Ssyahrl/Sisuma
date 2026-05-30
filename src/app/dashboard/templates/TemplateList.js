"use client";

import { Pencil, Trash2, X, Check, FileText } from "lucide-react";
import { useEffect, useState } from "react";

// ==========================================
// KONSTANTA & PENGATURAN TAMPILAN
// ==========================================
const ROLES = ["ADMIN", "SEKRETARIS", "WAREK", "REKTOR"];

const ROLE_COLORS = {
  ADMIN:      { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  check: "bg-violet-500" },
  SEKRETARIS: { bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-700",     check: "bg-sky-500" },
  WAREK:      { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   check: "bg-amber-500" },
  REKTOR:     { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", check: "bg-emerald-500" },
};

const JENIS_OPTIONS = [
  { value: "SK", label: "Surat Keputusan" },
  { value: "KT", label: "Surat Keterangan / Usulan" },
];

const stripExt = (name) => name?.replace(/\.[^/.]+$/, "") || "";

export default function TemplateList({ onSelect }) {
  // ==========================================
  // 1. STATE & DATA FETCHING
  // ==========================================
  const [templates, setTemplates] = useState([]);
  const [editData, setEditData]   = useState(null);
  const [refresh, setRefresh]     = useState(0);

  const refetch = () => setRefresh((n) => n + 1);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((json) => setTemplates(json.data || []))
      .catch((err) => console.error("FETCH ERROR:", err));
  }, [refresh]);

  // ==========================================
  // 2. HANDLERS
  // ==========================================
  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus template ini?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    refetch();
  };

  const handleEdit = (template) => {
    setEditData({
      ...template,
      nama_template: stripExt(template.nama_template),
      approval_flow: template.approval_flow || [],
      jenis_surat:   template.jenis_surat || "SK",
    });
  };

  const toggleRole = (role) => {
    const roleIndex = ROLES.indexOf(role);
    const currentFlow = editData.approval_flow;
    
    // Jika role tersebut sudah ada, hapus role itu beserta role setelahnya
    if (currentFlow.includes(role)) {
      const newFlow = ROLES.filter((r, i) => i < roleIndex && currentFlow.includes(r));
      setEditData({ ...editData, approval_flow: newFlow });
    } 
    // Jika role tersebut belum ada, pastikan role sebelumnya sudah dipilih
    else {
      const prevRoles = ROLES.slice(0, roleIndex);
      const allPrevSelected = prevRoles.every((r) => currentFlow.includes(r));
      
      if (!allPrevSelected) {
        alert(`Harus pilih ${prevRoles.filter((r) => !currentFlow.includes(r)).join(" → ")} terlebih dahulu`);
        return;
      }
      
      const newFlow = ROLES.filter((r, i) => i <= roleIndex && (currentFlow.includes(r) || r === role));
      setEditData({ ...editData, approval_flow: newFlow });
    }
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    
    await fetch(`/api/templates/${editData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama_template: editData.nama_template,
        approval_flow: editData.approval_flow,
        jenis_surat:   editData.jenis_surat,
      }),
    });
    
    setEditData(null);
    refetch();
  };

  // ==========================================
  // 3. RENDER UI
  // ==========================================
  return (
    <div className="bg-white rounded-2xl shadow h-full flex flex-col">
      {/* Kolom Pencarian */}
      <div className="p-6 pb-4">
        <input
          type="text"
          placeholder="Cari template..."
          className="w-full bg-gray-100 border border-gray-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Daftar Template */}
      <div className="flex-1 overflow-auto px-3 pb-6">
        {templates.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-10">Belum ada template</p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="mx-3 mb-3 p-4 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all group"
            >
              <div className="flex justify-between items-start">
                
                {/* Informasi Template (Klik untuk pilih) */}
                <div onClick={() => onSelect && onSelect(template)} className="cursor-pointer flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800 text-[15px]">
                      {stripExt(template.nama_template)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        template.jenis_surat === "KT"
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "bg-violet-50 text-violet-600 border-violet-200"
                      }`}
                    >
                      {template.jenis_surat || "SK"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.variables?.length || 0} variabel • {template.approval_flow?.length || 0} approval
                  </div>
                </div>

                {/* Tombol Aksi (Edit & Hapus) */}
                <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2.5 hover:bg-blue-50 rounded-xl text-blue-600 transition"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2.5 hover:bg-red-50 rounded-xl text-red-500 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==========================================
          MODAL: EDIT TEMPLATE
          ========================================== */}
      {editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Header Modal */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Edit Template</h2>
                  <p className="text-xs text-gray-400">Ubah nama, jenis & alur persetujuan</p>
                </div>
              </div>
              <button
                onClick={() => setEditData(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5">
              
              {/* Input: Nama Template */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Template</label>
                <input
                  type="text"
                  value={editData.nama_template}
                  onChange={(e) => setEditData({ ...editData, nama_template: e.target.value })}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  placeholder="Masukkan nama template"
                />
              </div>

              {/* Pilihan: Jenis Surat */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Surat</label>
                <div className="grid grid-cols-2 gap-2">
                  {JENIS_OPTIONS.map((opt) => {
                    const active = editData.jenis_surat === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setEditData({ ...editData, jenis_surat: opt.value })}
                        className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all text-left ${
                          active ? "bg-indigo-50 border-indigo-400" : "bg-gray-50 border-transparent hover:border-gray-200"
                        }`}
                      >
                        <span className={`text-base font-bold ${active ? "text-indigo-700" : "text-gray-500"}`}>
                          {opt.value}
                        </span>
                        <span className={`text-[11px] mt-0.5 ${active ? "text-indigo-500" : "text-gray-400"}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Contoh nomor: <span className="font-mono font-semibold text-gray-600">001/{editData.jenis_surat}-FBD/V/2026</span>
                </p>
              </div>

              {/* Pengaturan: Alur Persetujuan (Approval Flow) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Alur Persetujuan</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const active = editData.approval_flow.includes(role);
                    const c = ROLE_COLORS[role];
                    return (
                      <button
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                          active ? `${c.bg} ${c.border}` : "bg-gray-50 border-transparent hover:border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            active ? c.check + " shadow-sm" : "bg-gray-200"
                          }`}
                        >
                          {active ? (
                            <Check size={15} className="text-white" strokeWidth={3} />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${active ? c.text : "text-gray-500"}`}>
                          {role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Aksi Modal (Batal & Simpan) */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEditData(null)}
                  className="flex-1 py-3 font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow transition text-sm"
                >
                  Simpan
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}