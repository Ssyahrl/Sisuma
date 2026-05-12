"use client";
// app/dashboard/settings/nomor/page.js
import { useState, useEffect } from "react";
import { saveNomorSettings, loadNomorSettings } from "./actions";
import GlobalSettings  from "./GlobalSettings";
import FakultasSection from "./FakultasSection";

export default function SettingsNomorPage() {
  const [initialFormat, setInitialFormat] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");

  // Load konfigurasi global dari DB
  useEffect(() => {
    (async () => {
      try {
        const s   = await loadNomorSettings();
        const fmt = s["nomor_surat_format"] || "{JENIS}/{NOMOR_URUT:3}/{BULAN_ROMAWI}/{TAHUN}";
        setInitialFormat(fmt);
      } catch (err) {
        setError("Gagal memuat konfigurasi: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handler save yang diterusin dari GlobalSettings
  const handleSave = async ({ format, customTokens }) => {
    await saveNomorSettings({
      format,
      customTokens,
      resetLogic: "yearly",
      startFrom:  1,
    });
    setInitialFormat(format);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f1f5f9" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Memuat konfigurasi...</span>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "1.5rem", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {success && (
          <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534", marginBottom: 12 }}>
            ✓ Konfigurasi global berhasil disimpan
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#991b1b", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Section admin: token custom + format builder + token sistem */}
        <GlobalSettings
          initialFormat={initialFormat}
          onSaveSuccess={handleSave}
        />

        {/* Section fakultas: list + reset counter */}
        <FakultasSection />

      </div>
    </div>
  );
}