import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ebsxjwqdzraazinacbma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3hqd3FkenJhYXppbmFjYm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDEyMDIsImV4cCI6MjA4MzQ3NzIwMn0.u_0nmYw51hRY7WCSgjnpEfXyDZgvqh9xaWgAjZX2x5M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'orsolyaapp-auth',
    persistSession: true,
  }
});
