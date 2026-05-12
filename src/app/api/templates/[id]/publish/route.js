import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req, context) {
  try {
    const { id } = await context.params;

    const { error } = await supabase
      .from("templates")
      .update({ is_public: true })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ message: "Template dikirim ke Fakultas" });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}