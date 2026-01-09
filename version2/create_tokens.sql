-- Create the pairing_tokens table
CREATE TABLE IF NOT EXISTS public.pairing_tokens (
    token TEXT PRIMARY KEY, -- 6-digit code
    profile_id TEXT REFERENCES public.profiles(id),
    secure_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Enable RLS
ALTER TABLE public.pairing_tokens ENABLE ROW LEVEL SECURITY;

-- Allow all for now (Adjust for production)
CREATE POLICY "Allow all on pairing_tokens" ON public.pairing_tokens
    FOR ALL
    USING (true)
    WITH CHECK (true);
