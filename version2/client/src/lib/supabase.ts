import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual keys provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fuhwunhermairyuimvqd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_oB8WUck3t1jObog-zlgQMQ_o_Zewc3K';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
