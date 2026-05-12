import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ data });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}