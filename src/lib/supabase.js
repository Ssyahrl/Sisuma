import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kexuvrlxzmjnhihpqjwn.supabase.co";
const supabaseAnonKey = "sb_publishable_o2CYbpBtuKyL8tZfBayXOQ_4vxFeU2O";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
