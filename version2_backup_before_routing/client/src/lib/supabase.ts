import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual keys provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://czqdodyatihgmlerrgiu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_m1vQFs8vAUXqrVofMaIxpQ_oYX5HiP9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
