CREATE TABLE IF NOT EXISTS profiles (
  id integer PRIMARY KEY DEFAULT 1,
  name text NOT NULL DEFAULT 'Atölye Kullanıcısı',
  email text,
  phone text,
  avatar_color text DEFAULT '#1A6B8A',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO profiles (id, name) VALUES (1, 'Atölye Kullanıcısı')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_profile" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_profile" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_profile" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_profile" ON profiles FOR DELETE
  TO anon, authenticated USING (true);
