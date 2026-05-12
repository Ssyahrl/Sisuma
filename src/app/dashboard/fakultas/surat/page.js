"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";

const stripExt = (name) => name?.replace(/\.[^/.]+$/, "") || "";

const categoryColor = {
  SK: { bg: "#ede9fe", color: "#5b21b6" },
  KT: { bg: "#e0f2fe", color: "#0369a1" },
};

export default function BuatSuratFakultas() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();

  const handleSelect = useCallback((t) => {
    setSelected(t);
    setValues({});
  }, []);

  useEffect(() => {
    fetch("/api/templates/public")
      .then((r) => r.json())
      .then((j) => {
        const data = j.data || [];
        setTemplates(data);
        const tid = searchParams.get("template_id");
        if (tid) {
          const found = data.find((t) => t.id === tid);
          if (found) handleSelect(found);
        }
      })
      .catch(console.error);
  }, []);

  const filtered = templates.filter((t) =>
    stripExt(t.nama_template).toLowerCase().includes(search.toLowerCase()),
  );

  const fields = (
    typeof selected?.variables === "string"
      ? JSON.parse(selected.variables)
      : selected?.variables || []
  ).filter((v) => v !== "No");

  const previewHtml = useMemo(() => {
    if (!selected?.html_template)
      return "<p style='color:#aaa;font-size:13px;text-align:center;margin-top:40px'>Preview tidak tersedia</p>";
    let html = selected.html_template;
    Object.entries(values).forEach(([key, val]) => {
      if (val)
        html = html.replaceAll(
          `{${key}}`,
          `<mark style="background:#fef9c3;color:#854d0e;padding:0 2px;border-radius:3px">${val}</mark>`,
        );
    });
    html = html.replace(
      /{(.*?)}/g,
      `<span style="background:#fee2e2;color:#b91c1c;padding:0 2px;border-radius:3px;font-style:italic">{$1}</span>`,
    );
    return html;
  }, [selected?.html_template, values]);

  const handleSimpan = async () => {
    if (!selected || saving) return;
    const unfilled = fields.filter((f) => !values[f]);
    if (unfilled.length > 0) {
      alert(`Variabel belum diisi: ${unfilled.join(", ")}`);
      return;
    }
    if (!selected.approval_flow || selected.approval_flow.length === 0) {
      alert("Template ini belum memiliki alur persetujuan. Hubungi Admin untuk mengatur approval flow terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis, silakan login ulang.");

      let isi_final = selected.html_template || "";
      Object.entries(values).forEach(([key, val]) => {
        isi_final = isi_final.replaceAll(`{${key}}`, val);
      });

      const res = await fetch("/api/surat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selected.id,
          data_json: values,
          isi_final,
          user_id: user.id,
          is_draft: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      alert(
        "Surat berhasil disimpan! Silakan kirim melalui halaman Pengajuan Surat.",
      );
      setSelected(null);
      setValues({});
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    const unfilled = fields.filter((f) => !values[f]);
    if (unfilled.length > 0) {
      alert(`Variabel belum diisi: ${unfilled.join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_url: selected.file_url, values }),
      });
      if (!res.ok) throw new Error("Gagal generate");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stripExt(selected.nama_template)}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Gagal generate dokumen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: "#f4f6f9",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 230,
          background: "#fff",
          borderRight: "0.5px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "18px 16px 12px",
            borderBottom: "0.5px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111",
              marginBottom: 2,
            }}
          >
            Buat Surat
          </div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            Pilih template dari admin
          </div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#f4f6f9",
              border: "0.5px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aaa"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari templat..."
              style={{
                border: "none",
                background: "transparent",
                fontSize: 11,
                color: "#555",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 14px" }}>
          {filtered.length === 0 && (
            <p
              style={{
                fontSize: 12,
                color: "#aaa",
                textAlign: "center",
                marginTop: 24,
              }}
            >
              Belum ada template
            </p>
          )}
          {filtered.map((t) => {
            const cat = t.jenis_surat?.toUpperCase() || "SK";
            const catStyle = categoryColor[cat] ?? categoryColor["SK"];
            const isActive = selected?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelect(t)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  marginBottom: 5,
                  background: isActive ? "#eff6ff" : "transparent",
                  border: `1.5px solid ${isActive ? "#3b82f6" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 99,
                    marginBottom: 5,
                    background: catStyle.bg,
                    color: catStyle.color,
                  }}
                >
                  {cat}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#111",
                    lineHeight: 1.3,
                  }}
                >
                  {stripExt(t.nama_template)}
                </div>
                <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>
                  {t.updated_at
                    ? `Terakhir diubah: ${new Date(t.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!selected ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#e6f1fb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={26} color="#185FA5" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
            Pilih Template
          </div>
          <div style={{ fontSize: 12, color: "#aaa" }}>
            Pilih template surat di sebelah kiri untuk mulai membuat surat
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderBottom: "0.5px solid #e5e7eb",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                Preview: {stripExt(selected.nama_template)}
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                {fields.filter((f) => values[f]).length}/{fields.length}{" "}
                variabel terisi
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={handleSimpan}
                disabled={saving}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: "0.5px solid #e5e7eb",
                  background: "#fff",
                  fontSize: 12,
                  cursor: saving ? "not-allowed" : "pointer",
                  color: "#555",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0B2A4A",
                  fontSize: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#fff",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Download size={14} />
                {loading ? "Membuat..." : "Generate DOCX"}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div
              style={{
                width: 220,
                borderRight: "0.5px solid #e5e7eb",
                padding: "16px 14px",
                overflowY: "auto",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Variabel
              </div>
              {fields.length === 0 ? (
                <p style={{ fontSize: 12, color: "#aaa" }}>
                  Tidak ada variabel
                </p>
              ) : (
                fields.map((field) => (
                  <div key={field} style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      {field}
                    </label>
                    <input
                      type="text"
                      value={values[field] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      placeholder={`Isi ${field}`}
                      style={{
                        width: "100%",
                        border: "0.5px solid #e5e7eb",
                        borderRadius: 7,
                        padding: "7px 10px",
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box",
                        color: "#111",
                        background: "#fff",
                      }}
                    />
                  </div>
                ))
              )}
              {fields.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 12px",
                    background: "#f9fafb",
                    borderRadius: 8,
                    border: "0.5px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#aaa",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    Variabel Aktif
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {fields.map((f) => (
                      <span
                        key={f}
                        style={{
                          fontSize: 10,
                          padding: "3px 8px",
                          borderRadius: 99,
                          background: values[f] ? "#eaf3de" : "#f4f6f9",
                          color: values[f] ? "#3B6D11" : "#888",
                          border: `0.5px solid ${values[f] ? "#c6e4a0" : "#e5e7eb"}`,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                background: "#f4f6f9",
              }}
            >
              <div
                style={{
                  maxWidth: 600,
                  margin: "0 auto",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "40px 48px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  minHeight: 700,
                }}
              >
                <div
                  style={{ fontSize: 13, color: "#333", lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}