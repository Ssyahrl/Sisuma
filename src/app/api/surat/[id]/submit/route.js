import { createClient } from "@supabase/supabase-js";

function substituteTemplate(html, data) {
  return html.replace(/\{([^}]+)\}/g, (_, key) => {
    const trimmed = key.trim();
    return data[trimmed] ?? data[key] ?? `{${trimmed}}`;
  });
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;

    // 1. Inisialisasi Supabase dengan Service Role agar bisa bypass RLS jika diperlukan
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Ambil data dari body request
    const { keperluan, dokumen_url, catatan_fakultas } = await req.json();

    // 3. Ambil data surat beserta template terkait
    const { data: surat, error: sErr } = await supabase
      .from("surat")
      .select("*, templates(html_template, approval_flow, jenis_surat)")
      .eq("id", id)
      .single();

    if (sErr) return Response.json({ error: sErr.message }, { status: 500 });

    // Validasi status: hanya surat berstatus 'draft' yang bisa disubmit
    if (surat.status !== "draft") {
      return Response.json({ error: "Surat sudah pernah disubmit atau sedang diproses." }, { status: 400 });
    }

    // 4. Siapkan data JSON baru dan render HTML final
    const new_data_json = {
      ...surat.data_json,
      keperluan,
      ...(dokumen_url && { dokumen_url }),
    };

    const isi_final = substituteTemplate(
      surat.templates.html_template || "",
      new_data_json
    );

    // 5. Tentukan Logika Flow Persetujuan
    const flow = surat.templates.approval_flow || [];
    
    // Tentukan tujuan akhir (Siapa yang tanda tangan/terakhir approve)
    let tujuan = null;
    if (flow.includes("REKTOR")) tujuan = "REKTOR";
    else if (flow.includes("WAREK")) tujuan = "WAREK";
    else if (flow.includes("SEKRETARIS")) tujuan = "SEKRETARIS";

    // Tentukan status awal setelah submit (Siapa yang harus approve duluan)
    let status = "approved"; // Default jika tidak ada flow
    if (flow.includes("ADMIN")) status = "pending_admin";
    else if (flow.includes("SEKRETARIS")) status = "pending_sekretaris";
    else if (flow.includes("WAREK")) status = "pending_wakil";
    else if (flow.includes("REKTOR")) status = "pending_rektor";

    // 6. Update tabel 'surat'
    const { error: uErr } = await supabase
      .from("surat")
      .update({
        data_json: new_data_json,
        isi_final,
        status,
        tujuan,
        jenis_surat: surat.templates.jenis_surat || "SK",
        catatan_fakultas: catatan_fakultas || null, // Simpan catatan awal
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (uErr) return Response.json({ error: uErr.message }, { status: 500 });

    // 7. Inisialisasi Riwayat Persetujuan di tabel 'approval_steps'
    if (flow.length > 0) {
      const roleMap = {
        ADMIN: "admin",
        SEKRETARIS: "sekretaris",
        WAREK: "warek",
        REKTOR: "rektor",
      };

      // Buat array steps berdasarkan template flow
      const steps = flow.map((roleKey, idx) => ({
        surat_id: id,
        role: roleMap[roleKey] || roleKey.toLowerCase(),
        status: idx === 0 ? "pending" : "waiting", // Step pertama langsung 'pending'
        catatan: null,
      }));

      // Tambahkan step 'fakultas' di urutan paling atas sebagai bukti pengajuan
      steps.unshift({
        surat_id: id,
        role: "fakultas",
        status: "approved", // Otomatis approved karena ini tahap pengajuan
        catatan: catatan_fakultas || "Surat diajukan oleh fakultas",
        approved_by: surat.user_id,
        created_at: new Date().toISOString(),
      });

      // Bersihkan langkah lama (jika ada) untuk menghindari duplikasi saat re-submit
      await supabase.from("approval_steps").delete().eq("surat_id", id);

      // Simpan semua langkah ke database
      const { error: stepErr } = await supabase.from("approval_steps").insert(steps);
      
      if (stepErr) {
        console.error("Gagal menyimpan approval steps:", stepErr.message);
      }
    }

    return Response.json({ success: true, status });
    
  } catch (err) {
    console.error("Submit Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}