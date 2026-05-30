"use client";

import { Pencil, Trash2, X, Check, FileText } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  updateUserPassword,
} from "./actions";

// ==========================================
// KONSTANTA & PENGATURAN TAMPILAN
// ==========================================
const ROLES = ["ADMIN", "SEKRETARIS", "WAREK", "REKTOR", "FAKULTAS"];

const ROLE_STYLE = {
  ADMIN: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  SEKRETARIS: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  WAREK: {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  REKTOR: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  FAKULTAS: {
    bg: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/30",
  },
};

// ==========================================
// ICONS (SVGs)
// ==========================================
const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ==========================================
// UI COMPONENTS KECIL
// ==========================================
function Avatar({ nama }) {
  const initials = nama
    ? nama
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || {
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
    >
      {role}
    </span>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium transition-all
      ${toast.ok ? "bg-green-950 border-green-700 text-green-300" : "bg-red-950 border-red-700 text-red-300"}`}
    >
      <span>{toast.ok ? "✓" : "✕"}</span>
      <span>{toast.message}</span>
    </div>
  );
}

// ==========================================
// MODAL: TAMBAH USER BARU
// ==========================================
function TambahUserModal({ open, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);

    startTransition(async () => {
      const res = await createUser(formData);
      if (res.ok) {
        onSuccess(res.message);
        onClose();
        e.target.reset();
        setSelectedRole("");
      } else {
        setError(res.message);
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Tambah User Baru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              User langsung aktif tanpa verifikasi email
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body Modal (Form) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Nama Lengkap
            </label>
            <input
              name="nama"
              type="text"
              required
              placeholder="cth: Fakultas Teknik"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              NIP
            </label>
            <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg overflow-hidden focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition">
              <input
                name="nip"
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                onChange={(e) =>
                  (e.target.value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 6))
                }
                placeholder="123456"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
              <span className="px-3 py-2.5 text-sm text-slate-500 border-l border-slate-600 shrink-0 select-none">
                @masoem.ac.id
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Password Sementara
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                maxLength={12}
                placeholder="Min. 8 karakter"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                {showPass ? "sembunyikan" : "tampilkan"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Role
            </label>
            <select
              name="role"
              required
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition appearance-none"
            >
              <option value="">— Pilih role —</option>
              {ROLES.filter((r) => r !== "ADMIN").map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedRole === "FAKULTAS" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Kode Prefix Surat
                <span className="text-slate-600 font-normal ml-1">
                  (cth: FTEK, FBD, FH)
                </span>
              </label>
              <input
                name="prefix"
                type="text"
                required
                maxLength={8}
                placeholder="cth: FTEK"
                onChange={(e) =>
                  (e.target.value = e.target.value.toUpperCase())
                }
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition uppercase tracking-widest"
              />
              <p className="text-xs text-slate-600 mt-1.5">
                Akan dipakai di nomor surat:{" "}
                <span className="text-slate-400 font-mono">
                  001/SK-FTEK/V/2026
                </span>
              </p>
            </div>
          )}

          {/* Pesan Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Tombol Modal */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                setSelectedRole("");
              }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending ? "Menyimpan..." : "Buat User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: KONFIRMASI HAPUS USER
// ==========================================
function DeleteConfirmModal({ user, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteUser(user.id);
      onSuccess(res);
      onClose();
    });
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-xl">
            🗑
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            Hapus User?
          </h2>
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{user.nama}</span> (
            {user.email}) akan dihapus permanen dan tidak bisa login lagi.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition"
          >
            {isPending ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA: USERS PAGE
// ==========================================
export default function UsersPage() {
  // STATE MANAGEMENT
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);

  // STATE (Ganti Password Inline)
  const [editPassId, setEditPassId] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  // DATA FETCHING
  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      setToast({ ok: false, message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id || null;
      setCurrentUserId(userId);
      if (userId) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single()
          .then(({ data: profile }) => setCurrentRole(profile?.role || null));
      }
    });
  }, []);

  // COMPUTED VALUES (Filter Data)
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.nama?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // HANDLERS
  function handleRoleChange(userId, newRole) {
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      setToast(res);
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
      setEditingRole(null);
    });
  }

  // RENDER UI
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Manajemen User
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {users.length} user terdaftar
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-900 rounded-xl text-sm font-semibold hover:bg-white transition shrink-0"
          >
            <span className="text-base leading-none">+</span>
            Tambah User
          </button>
        </div>

        {/* Filter Input & Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-slate-500 transition"
          >
            <option value="ALL">Semua Role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Role Cards (Statistik) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ROLES.map((role) => {
            const count = users.filter((u) => u.role === role).length;
            const s = ROLE_STYLE[role];
            return (
              <button
                key={role}
                onClick={() =>
                  setFilterRole(filterRole === role ? "ALL" : role)
                }
                className={`rounded-xl border px-3 py-2.5 text-left transition hover:opacity-90
                  ${filterRole === role ? `${s.bg} ${s.border}` : "bg-slate-900 border-slate-700/60"}`}
              >
                <div
                  className={`text-xl font-bold ${filterRole === role ? s.text : "text-slate-200"}`}
                >
                  {count}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{role}</div>
              </button>
            );
          })}
        </div>

        {/* Tabel User */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
              <span className="animate-spin">⟳</span> Memuat data...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              {search || filterRole !== "ALL"
                ? "Tidak ada user yang cocok dengan filter."
                : "Belum ada user. Tambahkan user pertama!"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-right px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Data User (Avatar + Info) */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar nama={user.nama} />
                        <div>
                          <div className="font-medium text-slate-200">
                            {user.nama || "—"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role (Bisa di-edit inline) */}
                    <td className="px-5 py-3.5">
                      {editingRole?.userId === user.id ? (
                        <select
                          defaultValue={user.role}
                          autoFocus
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          onBlur={() => setEditingRole(null)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-slate-400"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRole({ userId: user.id })}
                          title="Klik untuk ganti role"
                          className="hover:opacity-80 transition-opacity"
                        >
                          <RoleBadge role={user.role} />
                        </button>
                      )}
                    </td>

                    {/* Tombol Aksi (Ganti Password & Hapus) */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ganti Password Inline (Hanya Admin atau diri sendiri) */}
                        {(user.id === currentUserId ||
                          currentRole?.toUpperCase() === "ADMIN") &&
                          (editPassId === user.id ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <input
                                  type={showNewPass ? "text" : "password"}
                                  placeholder="Min. 8 karakter"
                                  value={newPass}
                                  onChange={(e) => setNewPass(e.target.value)}
                                  autoFocus
                                  className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 pr-7 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 w-40 transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPass((v) => !v)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                  title={
                                    showNewPass ? "Sembunyikan" : "Tampilkan"
                                  }
                                >
                                  {showNewPass ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                              </div>
                              <button
                                onClick={async () => {
                                  const res = await updateUserPassword(
                                    user.id,
                                    newPass,
                                  );
                                  setToast(res);
                                  if (res.ok) {
                                    setEditPassId(null);
                                    setNewPass("");
                                    setShowNewPass(false);
                                  }
                                }}
                                className="text-green-400 hover:text-green-300 transition-colors p-1 rounded hover:bg-green-500/10"
                                title="Simpan"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditPassId(null);
                                  setNewPass("");
                                  setShowNewPass(false);
                                }}
                                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-700"
                                title="Batal"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditPassId(user.id);
                                setNewPass("");
                              }}
                              className="text-slate-600 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-700"
                              title="Ganti password"
                            >
                              <PencilIcon />
                            </button>
                          ))}

                        {/* Tombol Hapus (Tidak bisa hapus diri sendiri) */}
                        {user.id === currentUserId ? (
                          <span className="text-xs text-slate-700 px-2 py-1">
                            Anda
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="text-slate-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Render Modal Tambah & Hapus */}
      <TambahUserModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(msg) => {
          setToast({ ok: true, message: msg });
          loadUsers();
        }}
      />

      <DeleteConfirmModal
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={(res) => {
          setToast(res);
          if (res.ok) {
            setUsers([]);
            loadUsers();
          }
        }}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
