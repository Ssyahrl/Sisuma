import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================= DELETE =================
export async function DELETE(req, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      throw new Error("ID tidak ada");
    }

    console.log("DELETE ID:", id);

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return Response.json({ message: "Deleted" });

  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}



// ================= EDIT =================
export async function PUT(req, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      throw new Error("ID tidak ada");
    }

    const body = await req.json(); // ← body didefinisikan di sini

    console.log("EDIT ID:", id);
    console.log("BODY:", body);

    const { nama_template, approval_flow, jenis_surat } = body; // ← tambah jenis_surat

    if (!nama_template) {
      throw new Error("Nama template kosong");
    }

    const { error } = await supabase
      .from("templates")
      .update({
        nama_template,
        approval_flow,
        jenis_surat: jenis_surat || "SK", // ← tambah ini
      })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ message: "Updated" });

  } catch (err) {
    console.error("PUT ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}