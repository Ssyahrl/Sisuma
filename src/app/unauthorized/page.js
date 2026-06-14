// src/app/unauthorized/page.js
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-red-500">403</h1>
      <p className="text-gray-500 mt-2">Akses Ditolak</p>
      <a href="/login" className="mt-4 text-blue-500 underline text-sm">Kembali ke Login</a>
    </div>
  )
}