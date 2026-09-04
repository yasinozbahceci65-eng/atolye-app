/*
# Toolbox & Project Organizer - Initial Schema

1. New Tables
- `categories`: Material categories (Boyalar, El Aletleri, Sarf Malzemeleri, etc.)
  - id, name, color, icon, created_at
- `items`: Inventory items
  - id, name, category_id, quantity, unit_type, barcode_value, critical_level, image_url, updated_at, created_at
- `projects`: Projects for the calculator
  - id, project_name, project_type, area_m2, notes, is_completed, created_at
- `project_materials`: Materials required per project
  - id, project_id, item_id, required_quantity, unit_type

2. Security
- RLS enabled on all tables with anon+authenticated access (single-tenant, no auth required)
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text NOT NULL DEFAULT 'box',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 0,
  max_quantity numeric NOT NULL DEFAULT 100,
  unit_type text NOT NULL DEFAULT 'Adet',
  barcode_value text,
  critical_level numeric NOT NULL DEFAULT 10,
  image_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  project_type text NOT NULL DEFAULT 'Boyama',
  area_m2 numeric,
  notes text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  required_quantity numeric NOT NULL DEFAULT 0,
  unit_type text NOT NULL DEFAULT 'Adet',
  is_sufficient boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode_value);
CREATE INDEX IF NOT EXISTS idx_project_materials_project ON project_materials(project_id);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_items" ON items;
CREATE POLICY "anon_select_items" ON items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_items" ON items;
CREATE POLICY "anon_insert_items" ON items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_items" ON items;
CREATE POLICY "anon_update_items" ON items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_items" ON items;
CREATE POLICY "anon_delete_items" ON items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_project_materials" ON project_materials;
CREATE POLICY "anon_select_project_materials" ON project_materials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_project_materials" ON project_materials;
CREATE POLICY "anon_insert_project_materials" ON project_materials FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_project_materials" ON project_materials;
CREATE POLICY "anon_update_project_materials" ON project_materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_project_materials" ON project_materials;
CREATE POLICY "anon_delete_project_materials" ON project_materials FOR DELETE TO anon, authenticated USING (true);

-- Seed default categories
INSERT INTO categories (name, color, icon) VALUES
  ('Boyalar', '#3B82F6', 'droplets'),
  ('El Aletleri', '#F59E0B', 'wrench'),
  ('Sarf Malzemeleri', '#10B981', 'package'),
  ('Elektrik', '#EF4444', 'zap'),
  ('Boru & Tesisat', '#8B5CF6', 'pipe')
ON CONFLICT DO NOTHING;
