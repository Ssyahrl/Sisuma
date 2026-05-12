"use client";
// app/dashboard/settings/nomor/FakultasSection.jsx
import { useState, useEffect, useCallback } from "react";
import { loadFakultasSettings, resetAllFakultasCounters } from "./actions";
import { COLORS, DEFAULT_FORMAT } from "./constants";

// ─── FakultasCard ─────────────────────────────────────────────────────────────
function FakultasCard({ f, nextNumber = "001" }) {
  const displayName = f.slug.replace(/_/g, " ");
  const prefix      = f.prefix || f.slug;

  const contoh = DEFAULT_FORMAT
    .replace("{NOMOR_URUT:3}", nextNumber)
    .replace("{JENIS}",        "SK")
    .replace("{PREFIX}",       prefix)
    .replace("{BULAN_ROMAWI}", "V")
    .replace("{TAHUN}",        new Date().getFullYear().toString());

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", background: "#fff",
      border: "0.5px solid #d1fae5", borderRadius: 10, marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "#d1fae5", border: "1px solid #6ee7b7",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>
          🏛
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#065f46", textTransform: "capitalize" }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            Prefix:{" "}
            <span style={{ fontFamily: "monospace", color: "#10b981", fontWeight: 600 }}>
              {prefix}
            </span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>
          {DEFAULT_FORMAT}
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: 13, fontWeight: 700,
          color: nextNumber === "001" ? "#059669" : "#065f46",
          marginTop: 2, transition: "color .3s",
        }}>
          No berikut nya : {contoh}
        </div>
      </div>
    </div>
  );
}

// ─── FakultasSection ──────────────────────────────────────────────────────────
export default function FakultasSection() {
  const [fakultasList, setFakultasList] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [resetting,    setResetting]    = useState(false);
  const [resetMsg,     setResetMsg]     = useState(null);


  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadFakultasSettings();
      setFakultasList(data);
      // Ambil nextNumber dari data (semua pakai counter GLOBAL)

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleResetSemua = async () => {
    if (!confirm("Reset semua nomor urut fakultas ke 001? Surat lama tidak terpengaruh.")) return;
    setResetting(true);
    try {
      const res = await resetAllFakultasCounters();
      if (res.ok) {
        await loadData(); // ✅ reload dari DB, bukan hardcode "001"
      }
      setResetMsg({ ok: res.ok, msg: res.message });
    } catch (e) {
      setResetMsg({ ok: false, msg: e.message });
    } finally {
      setResetting(false);
      setTimeout(() => setResetMsg(null), 4000);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 16px", padding: "0 2px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          🏛 Format Nomor per Fakultas
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
      </div>

      <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534", marginBottom: 14 }}>
        Format nomor surat fakultas:{" "}
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{DEFAULT_FORMAT}</span>
        <div style={{ marginTop: 4, fontSize: 11, color: "#6ee7b7" }}>
          SK = Surat Keputusan · PREFIX = Kode fakultas
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "#94a3b8" }}>
          Memuat data fakultas...
        </div>
      ) : fakultasList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "#94a3b8", border: "1px dashed #d1d5db", borderRadius: 12 }}>
          Belum ada fakultas. Tambahkan user dengan role FAKULTAS terlebih dahulu.
        </div>
      ) : (
        <>
                {fakultasList.map((f) => (
                <FakultasCard key={f.slug} f={f} nextNumber={f.nextNumber ?? "001"} />
                ))}

          <button
            onClick={handleResetSemua}
            disabled={resetting}
            style={{
              width: "100%", marginTop: 8,
              padding: "10px 0", borderRadius: 10,
              border: "1px solid #fca5a5",
              background: resetting ? "#f1f5f9" : "#fef2f2",
              color:      resetting ? "#94a3b8" : "#dc2626",
              fontSize: 13, fontWeight: 600,
              cursor: resetting ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all .15s",
            }}
          >
            {resetting ? "Mereset..." : "↺ Reset Semua Nomor Urut Fakultas ke 001"}
          </button>

          {resetMsg && (
            <div style={{
              marginTop: 8, padding: "10px 14px", borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              background: resetMsg.ok ? "#f0fdf4" : "#fef2f2",
              border: `0.5px solid ${resetMsg.ok ? "#bbf7d0" : "#fecaca"}`,
              color:  resetMsg.ok ? "#166534" : "#991b1b",
            }}>
              {resetMsg.ok ? "✓ " : "✕ "}{resetMsg.msg}
            </div>
          )}
        </>
      )}
    </div>
  );
}