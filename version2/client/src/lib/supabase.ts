import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual keys provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fuhwunhermairyuimvqd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aHd1bmhlcm1haXJ5dWltdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDIxMDYsImV4cCI6MjA4MzUxODEwNn0.7N2jqRvTmAioQ9-XrQs-o8YKDjRV2wUHl3S_ETPbuUE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
