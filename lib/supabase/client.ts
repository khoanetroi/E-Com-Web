import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://oruauodjvprscllyzyvw.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_z-GVqg-oqJaOOWoMOQgtnQ_z6C46axk";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  return createBrowserClient(url, key);
}
