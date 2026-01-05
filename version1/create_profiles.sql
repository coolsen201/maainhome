-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Can be UUID (if linked to auth.users) or Email
    full_name TEXT,
    email_id TEXT,
    secure_key TEXT,
    key_expiry TIMESTAMP WITH TIME ZONE,
    screensaver_photos TEXT[] DEFAULT '{}',
    selfie_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) if you want to restrict access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all for now (Adjust this later for production security)
CREATE POLICY "Allow all actions for all users" ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: If using Supabase Auth and you want a trigger to auto-create profiles
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email_id, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
