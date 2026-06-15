"use client";
// app/dashboard/settings/nomor/GlobalSettings.jsx

import { useState, useEffect } from "react";
import {
  COLORS, SYSTEM_TOKENS, SYSTEM_TOKEN_DESC, SYSTEM_SAMPLE,
  labelStyle, hintStyle, inputBase,
  tokensToFormatString, parseFormatString,
  getTokenColor, getTokenSample,
} from "./constants";
import { resetAdminCounter, loadAdminCounter } from "./actions";

// ==========================================
// KOMPONEN 1: SEPARATOR PILL
// ==========================================
function SeparatorPill({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const commit = () => {
    setEditing(false);
    onChange(draft || "/");
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, 3))}
        onBlur={commit}
        onKeyDown={(e) => { 
          if (e.key === "Enter" || e.key === "Escape") commit(); 
        }}
        style={{
          width: 32, textAlign: "center", fontFamily: "monospace",
          fontSize: 13, padding: "2px 4px",
          border: "1px solid #c9993a", borderRadius: 6,
          background: "#fef3dc", color: "#92400e", outline: "none",
        }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Klik untuk ubah separator"
      style={{
        fontFamily: "monospace", fontSize: 13,
        color: "#c9993a", background: "#fef3dc",
        border: "1px dashed #c9993a",
        padding: "2px 7px", borderRadius: 6,
        cursor: "pointer", minWidth: 24,
        textAlign: "center", lineHeight: 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fde68a")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fef3dc")}
    >
      {value}
    </button>
  );
}

// ==========================================
// KOMPONEN 2: PREVIEW NUMBER
// ==========================================
function PreviewNumber({ tokens, separators, digits, customTokens = [] }) {
  return (
    <div style={{ background: COLORS.navy, borderRadius: 12, padding: "1rem 1.1rem", marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10, fontWeight: 500,
          color: "rgba(201,153,58,0.7)",
          letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10,
        }}
      >
        Preview Nomor Surat
      </div>
      
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        {tokens.length === 0 && (
          <span style={{ fontFamily: "monospace", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
            — tambahkan token —
          </span>
        )}
        
        {tokens.map((t, i) => (
          <span key={t + i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontFamily: "monospace", fontSize: 18, fontWeight: 500,
                padding: "3px 10px", borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: getTokenColor(t, customTokens),
              }}
            >
              {t === "NOMOR"
                ? String(1).padStart(digits, "0")
                : getTokenSample(t, customTokens)}
            </span>
            {i < tokens.length - 1 && (
              <span style={{ fontFamily: "monospace", fontSize: 16, color: "rgba(201,153,58,0.6)", minWidth: 10, textAlign: "center" }}>
                {separators[i] ?? "/"}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN 3: CARD WRAPPER
// ==========================================
function Card({ stepLabel, title, children }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.85rem 1.1rem", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: COLORS.goldDark ?? "#92400e", background: COLORS.goldLight, borderRadius: 5, padding: "2px 7px" }}>
          {stepLabel}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "1rem 1.1rem" }}>{children}</div>
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA: GLOBAL SETTINGS
// ==========================================
export default function GlobalSettings({ initialFormat, onSaveSuccess }) {
  // KONSTANTA DEFAULT
  const DEFAULT_INIT = "{JENIS}/{NOMOR_URUT:3}/{BULAN_ROMAWI}/{TAHUN}";

  // STATE MANAGEMENT
  const parsed = parseFormatString(initialFormat || DEFAULT_INIT);
  const [activeTokens, setActiveTokens]     = useState(parsed.tokens);
  const [separators, setSeparators]         = useState(
    parsed.separators.length
      ? parsed.separators
      : Array(Math.max(0, parsed.tokens.length - 1)).fill("/")
  );
  
  const [digits, setDigits]                 = useState(parsed.digits || 3);
  const [customTokens, setCustomTokens]     = useState([]);
  const [newTokenName, setNewTokenName]     = useState("");
  const [newTokenValue, setNewTokenValue]   = useState("");
  const [saving, setSaving]                 = useState(false);
  const [savedFormat, setSavedFormat]       = useState(initialFormat || DEFAULT_INIT);
  const [error, setError]                   = useState("");
  const [currentNumbers, setCurrentNumbers] = useState({});

  // DATA FETCHING
useEffect(() => {
  loadAdminCounter().then((n) => setCurrentNumbers(n));
}, []);

  // Sync kalau parent reload data
  useEffect(() => {
    const p = parseFormatString(initialFormat || DEFAULT_INIT);
    setActiveTokens(p.tokens);
    setSeparators(
      p.separators.length
        ? p.separators
        : Array(Math.max(0, p.tokens.length - 1)).fill("/")
    );
    setDigits(p.digits || 3);
    setSavedFormat(initialFormat || DEFAULT_INIT);
  }, [initialFormat]);

  // COMPUTED VALUES
  const allTokens     = [...SYSTEM_TOKENS, ...customTokens.map((t) => t.name)];
  const unusedTokens  = allTokens.filter((t) => !activeTokens.includes(t));
  const currentFormat = tokensToFormatString(activeTokens, digits, separators);
  const isDirty       = currentFormat !== savedFormat;

  // ----------------------------------------
  // HANDLERS: TOKENS
  // ----------------------------------------
  const removeToken = (idx) => {
    const newT = activeTokens.filter((_, i) => i !== idx);
    const newS = [...separators];
    
    if (idx < newS.length) newS.splice(idx, 1);
    else if (newS.length > 0) newS.splice(newS.length - 1, 1);
    
    setActiveTokens(newT);
    setSeparators(newS.slice(0, Math.max(0, newT.length - 1)));
  };

  const addToken = (t) => {
    setActiveTokens([...activeTokens, t]);
    setSeparators([...separators, "/"]);
  };

  const updateSep = (idx, val) => {
    setSeparators(separators.map((s, i) => (i === idx ? val : s)));
  };

  // ----------------------------------------
  // HANDLERS: CUSTOM TOKENS
  // ----------------------------------------
  const addCustomToken = () => {
    const name  = newTokenName.trim().toUpperCase().replace(/\s+/g, "_");
    const value = newTokenValue.trim();
    if (!name || !value) return;
    if (allTokens.includes(name)) return;
    
    setCustomTokens([...customTokens, { name, value }]);
    setNewTokenName("");
    setNewTokenValue("");
  };

  const removeCustomToken = (name) => {
    setCustomTokens(customTokens.filter((t) => t.name !== name));
    const idx = activeTokens.indexOf(name);
    if (idx !== -1) removeToken(idx);
  };

  const updateCustomToken = (name, val) => {
    setCustomTokens(customTokens.map((t) => (t.name === name ? { ...t, value: val } : t)));
  };

  // ----------------------------------------
  // HANDLERS: SAVE & RESET
  // ----------------------------------------
  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setError("");
    
    try {
      await onSaveSuccess({ format: currentFormat, customTokens });
      setSavedFormat(currentFormat);
    } catch (err) {
      setError("Gagal menyimpan: " + err.message);
    }
    
    setSaving(false);
  };

const handleReset = async () => {
  if (!confirm("Reset nomor urut Admin ke 001? Format tidak akan berubah.")) return;
  try {
    await resetAdminCounter();
    setCurrentNumbers({ SK: "001", KT: "001" });
  } catch (e) {
    alert("Gagal reset: " + e.message);
  }
};

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div>
      {/* Header Utama Konfigurasi */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: COLORS.navy, borderRadius: 12, padding: "0.85rem 1.1rem", marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(201,153,58,0.18)",
              border: "1px solid rgba(201,153,58,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={COLORS.gold}>
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Konfigurasi Nomor Surat</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Format global · Admin</div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)",
              padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              fontSize: 12, fontWeight: 600,
              color:      !isDirty ? "#94a3b8" : COLORS.navy,
              background: !isDirty ? "rgba(255,255,255,0.08)" : COLORS.gold,
              border: "none", padding: "6px 16px", borderRadius: 8,
              cursor: !isDirty ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all .15s",
            }}
          >
            {saving ? "Menyimpan..." : isDirty ? "Simpan Global" : "Tersimpan ✓"}
          </button>
        </div>
      </div>

      {/* Pesan Error */}
      {error && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#991b1b", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Card 03: Struktur Format Global */}
      <Card stepLabel="03" title="Struktur Format Global">
        <p style={{ ...hintStyle, marginBottom: 12 }}>
          Dipakai untuk semua surat <strong>non-fakultas</strong>.
        </p>

        <PreviewNumber tokens={activeTokens} separators={separators} digits={digits} customTokens={customTokens} />

        {/* Nomor surat berikutnya */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", marginBottom: 14,
            background: "linear-gradient(135deg, #1a2744 0%, #22335a 100%)",
            border: "1px solid rgba(201,153,58,0.25)",
            borderRadius: 10, position: "relative", overflow: "hidden",
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            Nomor urut Admin berikut nya
          </span>
          {/* Decorative Glow */}
          <div
            style={{
              position: "absolute", right: -20, top: -20,
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(201,153,58,0.08)", pointerEvents: "none",
            }}
          />

          <div
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: "rgba(201,153,58,0.15)",
              border: "1px solid rgba(201,153,58,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3" />
              <rect x="9" y="3" width="6" height="8" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </div>

         <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
  {["SK", "KT"].map((jenis) => (
    <div key={jenis} style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: "0.1em" }}>
        {jenis}
      </div>
      <span style={{
        fontFamily: "monospace", fontSize: 24, fontWeight: 700,
        color: currentNumbers[jenis] ? COLORS.gold : "rgba(255,255,255,0.3)",
      }}>
        {currentNumbers[jenis] ?? "—"}
      </span>
    </div>
  ))}
  
</div>
        </div>

        
       
        {/* Daftar Token Aktif */}
        <div style={{ marginBottom: 10 }}>
          <div style={labelStyle}>
            Token aktif{" "}
            <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>
              — klik × hapus · klik separator emas untuk ubah
            </span>
          </div>
          <div
            style={{
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4,
              minHeight: 44, padding: "8px 10px", background: "#f8fafc",
              border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 8, marginTop: 5,
            }}
          >
            {activeTokens.length === 0 && (
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Belum ada token</span>
            )}
            
            {activeTokens.map((t, i) => (
              <span key={t + i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => removeToken(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontFamily: "monospace", fontSize: 11, fontWeight: 500,
                    padding: "4px 9px", borderRadius: 6, border: "0.5px solid rgba(0,0,0,0.12)",
                    background: "#fff", color: "#334155", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.color = "#334155"; }}
                >
                  {t} <span style={{ fontSize: 10, color: "#94a3b8" }}>×</span>
                </button>
                {i < activeTokens.length - 1 && (
                  <SeparatorPill value={separators[i] ?? "/"} onChange={(val) => updateSep(i, val)} />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Tambah Token Baru */}
        {unusedTokens.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Tambah ke format</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
              {unusedTokens.map((t) => {
                const isCustom = customTokens.some((c) => c.name === t);
                return (
                  <button
                    key={t}
                    onClick={() => addToken(t)}
                    title={isCustom ? `Nilai: ${customTokens.find((c) => c.name === t)?.value}` : SYSTEM_TOKEN_DESC[t]}
                    style={{
                      fontFamily: "monospace", fontSize: 11, fontWeight: 500,
                      padding: "4px 10px", borderRadius: 6,
                      border: isCustom ? "0.5px dashed #a78bfa" : "0.5px dashed #cbd5e1",
                      background: "transparent",
                      color: isCustom ? "#7c3aed" : "#64748b",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isCustom ? "#f5f3ff" : "#f1f5f9";
                      e.currentTarget.style.borderStyle = "solid";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderStyle = "dashed";
                    }}
                  >
                    + {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Display Format String Akhir */}
        <div
          style={{
            padding: "9px 12px", background: "#f8fafc",
            border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 8,
            fontFamily: "monospace", fontSize: 12, color: "#475569", marginBottom: 4,
          }}
        >
          {currentFormat}
        </div>
        <div style={hintStyle}>
          Format ini disimpan ke database dan dipakai untuk generate nomor otomatis.
        </div>
      </Card>

      {/* Card 05: Token Sistem (Otomatis) */}
      <Card stepLabel="05" title="Token Sistem (Otomatis)">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Token", "Keterangan", "Contoh"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 10px", textAlign: "left", fontSize: 10,
                    fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SYSTEM_TOKENS.map((t, i, arr) => (
              <tr key={t} style={{ borderBottom: i < arr.length - 1 ? "0.5px solid #f3f4f6" : "none" }}>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "#374151" }}>
                  {t}
                </td>
                <td style={{ padding: "8px 10px", color: "#555" }}>
                  {SYSTEM_TOKEN_DESC[t]}
                </td>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#888" }}>
                  {SYSTEM_SAMPLE[t]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}