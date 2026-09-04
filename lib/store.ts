import { useState, useEffect, useCallback } from 'react';
import { supabase, Item, Category, Project } from './supabase';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(*)')
      .order('name');
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refetch: fetch };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data ?? []);
      setLoading(false);
    });
  }, []);

  return { categories, loading };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*, project_materials(*)')
      .order('created_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { projects, loading, refetch: fetch };
}
