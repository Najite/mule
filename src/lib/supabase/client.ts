import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://zxgxbpvrermaavosiwrp.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z3hicHZyZXJtYWF2b3Npd3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTM0OTAsImV4cCI6MjEwNzQ2OTQ5MH0.LSWyZlByLF2JiyHdPpRUp_DmeF5HJWdI7PQL_oCCrEI';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY && SUPABASE_PROJECT_URL.startsWith('https://'));
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

