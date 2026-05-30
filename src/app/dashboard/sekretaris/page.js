'use client';

import { processApproval } from "@/app/dashboard/actions/approval";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, FileText, ChevronRight, X, Eye } from 'lucide-react';

// ==========================================
// KONSTANTA & PENGATURAN TAMPILAN
// ==========================================
const STATUS_LABEL = {
  pending_sekretaris: { label: 'Menunggu Review',              color: '#c9993a', bg: '#fdf6e7' },
  pending_wakil:      { label: 'Diteruskan ke Wakil Rektor',   color: '#1a2744', bg: '#e8ecf4' },
  pending_rektor:     { label: 'Diteruskan ke Rektor',         color: '#1a2744', bg: '#e8ecf4' },
  approved:           { label: 'Disetujui',                    color: '#15803d', bg: '#f0fdf4' },
  rejected:           { label: 'Ditolak',                      color: '#dc2626', bg: '#fef2f2' },
  draft:              { label: 'Draft',                        color: '#6b7280', bg: '#f3f4f6' },
};

const FILTERS = [
  { key: 'pending_sekretaris', label: 'Perlu Review'  },
  { key: 'pending_wakil',      label: 'Diteruskan'    },
  { key: 'rejected',           label: 'Ditolak'       },
  { key: 'approved',           label: 'Selesai'       },
];

// ==========================================
// KOMPONEN 1: BADGE STATUS
// ==========================================
function Badge({ status }) {
  const s = STATUS_LABEL[status] || STATUS_LABEL.draft;
  
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        letterSpacing: 0.2,
        border: `1px solid ${s.color}33`,
      }}
    >
      {s.label}
    </span>
  );
}

// ==========================================
// KOMPONEN 2: CATATAN BOX
// ==========================================
function CatatanBox({ label, value, color = '#1d4ed8', bg = '#eff6ff', border = '#bfdbfe' }) {
  if (!value) return null;
  
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: '10px 14px',
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 11,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: '#1e3a5f', fontStyle: 'italic', lineHeight: 1.6 }}>
        {value}
      </p>
    </div>
  );
}

// ==========================================
// KOMPONEN 3: MODAL DETAIL SURAT
// ==========================================
function Modal({ surat, onClose, onAction }) {
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  if (!surat) return null;

  const isLastStep   = surat.tujuan === 'SEKRETARIS';
  const approveLabel = isLastStep ? 'Setujui' : 'Teruskan ke Wakil Rektor';
  const ApproveIcon  = isLastStep ? CheckCircle : ChevronRight;

  async function handleClick(action) {
  if (action === 'reject' && !catatan.trim()) {
    alert("Wajib mengisi catatan alasan penolakan.");
    return;
  }
  setLoading(true);
  await onAction(surat.id, action, catatan);
  setLoading(false);
  onClose();
}

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb',
            position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Detail Surat
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: '#1a2744' }}>
              {surat.templates?.nama_template || 'Surat'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', border: 'none', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#374151',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Informasi Meta */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Status',      <Badge key="status" status={surat.status} />],
              ['Nomor Surat', surat.nomor_surat || <span key="nomor" style={{ color: '#9ca3af', fontStyle: 'italic' }}>Belum ada nomor</span>],
              ['Dibuat',      new Date(surat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
              ['Pembuat',     surat.profiles?.email || ''],
              ['Tujuan',      surat.tujuan || 'NULL'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {label}
                </p>
                <div style={{ fontSize: 14, color: '#1a2744', fontWeight: 500 }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan dari Fakultas & Admin */}
        {(surat.catatan_fakultas || surat.catatan_admin) && (
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Catatan Sebelumnya
            </p>
            <CatatanBox
              label="Catatan dari Fakultas"
              value={surat.catatan_fakultas}
              color="#1d4ed8"
              bg="#eff6ff"
              border="#bfdbfe"
            />
            <CatatanBox
              label="Catatan dari Admin"
              value={surat.catatan_admin}
              color="#854d0e"
              bg="#fefce8"
              border="#fde68a"
            />
          </div>
        )}

        {/* Preview isi_final */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <Eye size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Preview Surat
          </p>
          {surat.isi_final ? (
            <div
              style={{
                border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '1.25rem', fontSize: 14, lineHeight: 1.8,
                color: '#374151', background: '#fafafa',
                maxHeight: 320, overflowY: 'auto',
                fontFamily: 'Georgia, serif',
              }}
              dangerouslySetInnerHTML={{ __html: surat.isi_final }}
            />
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              Tidak ada isi surat
            </div>
          )}
        </div>

        {/* Input Catatan Sekretaris */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Catatan Sekretaris (opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tambahkan catatan untuk level approval berikutnya atau alasan penolakan..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '10px 14px', fontSize: 14, color: '#374151',
              resize: 'vertical', fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Tombol Aksi */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleClick('reject')}
            disabled={loading}
            style={{
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5',
              borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <XCircle size={15} /> Tolak
          </button>
          
          <button
            onClick={() => handleClick('approve')}
            disabled={loading}
            style={{
              background: '#1a2744', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <ApproveIcon size={15} /> {loading ? 'Memproses...' : approveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN 4: DASHBOARD UTAMA SEKRETARIS
// ==========================================
export default function DashboardSekretarisRektor() {
  // 1. STATE & HOOKS
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState('pending_sekretaris');
  const [stats, setStats]         = useState({ pending: 0, approved: 0, rejected: 0 });

  // 2. DATA FETCHING (List Surat)
  useEffect(() => {
    async function fetchSurat() {
      setLoading(true);
      try {
        // Cek session dulu sebelum fetch
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/";
          return;
        }

        const { data, error } = await supabase
          .from('surat')
          .select(`
            *,
            profiles:user_id (email, nama),
            templates:template_id (nama_template)
          `)
          .eq('status', filter)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Fetch error:", error.message);
          return;
        }

        setSuratList(data || []);
      } catch (err) {
        console.error("Unexpected error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSurat();
  }, [filter]);
  // DATA FETCHING (Statistik)
  useEffect(() => {
    async function fetchStats() {
      const statuses = ['pending_sekretaris', 'approved', 'rejected'];
      const results  = await Promise.all(
        statuses.map(s => supabase.from('surat').select('id', { count: 'exact' }).eq('status', s))
      );
      setStats({
        pending:  results[0].count || 0,
        approved: results[1].count || 0,
        rejected: results[2].count || 0,
      });
    }
    fetchStats();
  }, []);

  // 3. HANDLERS
  async function handleAction(suratId, action, catatan) {
    try {
      await processApproval(suratId, "SEKRETARIS", action, catatan);
      setSuratList((prev) => prev.filter((s) => s.id !== suratId));
    } catch (err) {
      alert("Gagal: " + err.message);
    }
  }

  // 4. COMPUTED VALUES (Stat Cards)
  const STAT_CARDS = [
    { label: 'Menunggu Review', value: stats.pending,  icon: <Clock size={18} />,       color: '#c9993a', bg: '#fdf6e7' },
    { label: 'Disetujui',       value: stats.approved, icon: <CheckCircle size={18} />, color: '#15803d', bg: '#f0fdf4' },
    { label: 'Ditolak',         value: stats.rejected, icon: <XCircle size={18} />,     color: '#dc2626', bg: '#fef2f2' },
  ];

  // 5. RENDER UI
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header Dashboard */}
      <div style={{ background: '#1a2744', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ margin: 0, color: '#c9993a', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            SISUMA — Sistem Manajemen Surat
          </p>
          <h1 style={{ margin: '6px 0 0', color: '#fff', fontSize: 22, fontWeight: 700 }}>
            Dashboard Sekretaris Rektor
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Statistik Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: '1.5rem' }}>
          {STAT_CARDS.map(({ label, value, icon, color, bg }) => (
            <div
              key={label}
              style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #e5e7eb', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{ background: bg, color, borderRadius: 10, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 700, color: '#1a2744', lineHeight: 1 }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigasi Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                background: filter === key ? '#1a2744' : '#fff',
                color:      filter === key ? '#fff'    : '#6b7280',
                border:     filter === key ? '1px solid #1a2744' : '1px solid #e5e7eb',
                borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Daftar Surat (Tabel) */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Memuat data...</p>
            </div>
          ) : suratList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada surat</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                Semua surat sudah diproses atau belum ada yang masuk.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#f8fafc' }}>
                  {['Jenis Surat', 'Pembuat', 'Tanggal', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left', padding: '11px 16px',
                        fontSize: 11, color: '#9ca3af', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suratList.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: i < suratList.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelected(s)}
                  >
                    {/* Kolom Jenis Surat */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#e8ecf4', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={15} color="#1a2744" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a2744' }}>
                            {s.templates?.nama_template || 'Surat Tidak Bernama'}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
                            {s.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Kolom Pembuat */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b7280' }}>
                      {s.profiles?.nama || s.profiles?.email || '-'}
                    </td>

                    {/* Kolom Tanggal */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Kolom Status */}
                    <td style={{ padding: '13px 16px' }}>
                      <Badge status={s.status} />
                    </td>

                    {/* Ikon Arrow */}
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <ChevronRight size={16} color="#9ca3af" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Render Modal jika ada surat yang diklik */}
      <Modal surat={selected} onClose={() => setSelected(null)} onAction={handleAction} />
    </div>
  );
}