import { createClient } from "@supabase/supabase-js";

// Supabase client dengan anon key untuk operasi umum
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase client dengan service role key untuk operasi admin
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types
export type FileStatus = "processing" | "ready" | "error";

export interface FileRecord {
  id: string;
  filename: string;
  file_path: string;
  file_id: string;
  status: FileStatus;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  file_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string;
  updated_at: string;
}
