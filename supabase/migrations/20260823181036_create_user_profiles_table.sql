/*
# Create user_profiles table for authenticated users

1. New Tables
- `user_profiles`
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text, user's display name from Google or phone)
  - `email` (text, nullable, from Google OAuth)
  - `phone` (text, nullable, from phone auth)
  - `avatar_url` (text, nullable, Google profile picture)
  - `provider` (text, nullable, 'google' or 'phone')
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
2. Security
- Enable RLS on user_profiles.
- Users can read and update only their own profile (auth.uid() = id).
- Users can insert their own profile row on signup.
3. Notes
- This table is separate from the existing `profiles` (id=1) table which stores app-level settings.
- A trigger automatically creates a user_profiles row when a new auth.user is created.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'Atölye Kullanıcısı',
  email text,
  phone text,
  avatar_url text,
  provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_profile" ON user_profiles;
CREATE POLICY "select_own_user_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_user_profile" ON user_profiles;
CREATE POLICY "insert_own_user_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_user_profile" ON user_profiles;
CREATE POLICY "update_own_user_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_user_profile" ON user_profiles;
CREATE POLICY "delete_own_user_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Auto-create user_profiles row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, phone, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Atölye Kullanıcısı'),
    COALESCE(NEW.email, NULL),
    COALESCE(NEW.phone, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    COALESCE(NEW.raw_app_meta_data->>'provider', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
