"use client";
import { useRef, useState } from "react";
import TemplateList from "./TemplateList";
import TemplateEditor from "./TemplateEditor";

export default function TemplatesPage() {
  const fileInputRef = useRef(null);

  // TAMBAH INI
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/templates/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("UPLOAD RESULT:", data);

    alert("Template berhasil diupload!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Header Title */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Buat Template</h1>
            <p className="text-gray-600 mt-1">
              Kelola dan kustomisasi standar dokumen universitas dengan sistem variabel dinamis.
            </p>
          </div>

          <>
            <input
              type="file"
              accept=".docx"
              ref={fileInputRef}
              className="hidden"
              onChange={handleUpload}
            />

            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 px-5 py-3 rounded-xl shadow-sm font-medium text-gray-700 transition-all"
            >
              Impor Template
            </button>
          </>
        </div>

        <div className="flex gap-6 h-[calc(100vh-140px)]">
          
          {/*  KIRIM SETSELECT */}
          <div className="w-80 shrink-0">
            <TemplateList onSelect={setSelectedTemplate} />
          </div>

          {/* KIRIM DATA KE EDITOR */}
          <div className="flex-1">
            <TemplateEditor template={selectedTemplate} />
          </div>

        </div>
      </div>
    </div>
  );
}