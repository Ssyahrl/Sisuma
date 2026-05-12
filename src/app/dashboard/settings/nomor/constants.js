// app/dashboard/settings/nomor/constants.js

export const COLORS = {
  navy:      "#1a2744",
  gold:      "#c9993a",
  goldLight: "#fef3dc",
  goldDark:  "#92400e",
};

export const DEFAULT_FORMAT = "{JENIS}/{NOMOR_URUT:3}/{BULAN_ROMAWI}/{TAHUN}";

export const SYSTEM_TOKENS = [
  "NOMOR", "JENIS", "TAHUN", "BULAN_ROMAWI", "BULAN_ANGKA", "SEMESTER", "PREFIX",
];

export const SYSTEM_TOKEN_DESC = {
  NOMOR:        "Nomor urut otomatis (001, 002, ...)",
  JENIS:        "Kode jenis surat dari template (SK, SP, dll)",
  TAHUN:        "Tahun 4 digit (2026)",
  BULAN_ROMAWI: "Bulan romawi (V, VI, ...)",
  BULAN_ANGKA:  "Bulan 2 digit (05, 06, ...)",
  SEMESTER:     "Semester aktif (GNP / GNJ)",
  PREFIX:       "Kode/prefix khusus fakultas",
};

export const SYSTEM_SAMPLE = {
  NOMOR:        "001",
  JENIS:        "SK",
  TAHUN:        "2026",
  BULAN_ROMAWI: "V",
  BULAN_ANGKA:  "05",
  SEMESTER:     "GNP",
  PREFIX:       "FBD",
};

export const CHIP_COLOR = {
  NOMOR:        "#fff",
  JENIS:        "#34d399",
  TAHUN:        "#fbbf24",
  BULAN_ROMAWI: "#f472b6",
  BULAN_ANGKA:  "#fb7185",
  SEMESTER:     "#fb923c",
  PREFIX:       "#38bdf8",
};

export const CUSTOM_COLORS = [
  "#a78bfa", "#60a5fa", "#4ade80", "#f97316", "#e879f9",
];

// ─── shared style objects ─────────────────────────────────────────────────────
export const labelStyle = {
  fontSize: 11,
  fontWeight: 500,
  color: "#64748b",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 5,
};

export const hintStyle = {
  fontSize: 11,
  color: "#94a3b8",
  marginTop: 4,
};

export const inputBase = {
  fontSize: 12,
  padding: "7px 10px",
  border: "0.5px solid rgba(0,0,0,0.12)",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#1e293b",
  fontFamily: "inherit",
  outline: "none",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
export function tokensToFormatString(tokens, digits, separators) {
  return tokens
    .map((t, i) => {
      const part = t === "NOMOR" ? `{NOMOR_URUT:${digits}}` : `{${t}}`;
      return i < tokens.length - 1 ? part + (separators[i] ?? "/") : part;
    })
    .join("");
}

export function parseFormatString(str) {
  const tokenMatches = [];
  const separatorMatches = [];
  const re = /\{([^}:]+)(?::(\d+))?\}([^{]*)/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    tokenMatches.push(m[1] === "NOMOR_URUT" ? "NOMOR" : m[1]);
    if (m[3]) separatorMatches.push(m[3]);
  }
  const d = str.match(/\{NOMOR_URUT:(\d+)\}/);
  return {
    tokens:     tokenMatches,
    separators: separatorMatches,
    digits:     d ? parseInt(d[1]) : 3,
  };
}

export function getTokenColor(name, customTokens = []) {
  if (CHIP_COLOR[name]) return CHIP_COLOR[name];
  const idx = customTokens.findIndex((t) => t.name === name);
  return CUSTOM_COLORS[idx % CUSTOM_COLORS.length] || "#fff";
}

export function getTokenSample(name, customTokens = []) {
  if (SYSTEM_SAMPLE[name]) return SYSTEM_SAMPLE[name];
  return customTokens.find((t) => t.name === name)?.value || name;
}