import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Pick<Profile, 'name' | 'email' | 'phone' | 'avatar_color'>>) => Promise<void>;
}

const ProfileContext = createContext<ProfileState>({
  profile: null,
  loading: true,
  updateProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { profile: authProfile, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 1)
      .maybeSingle<Profile>();

    if (data) {
      setProfile(data);
    } else {
      await supabase.from('profiles').insert({ id: 1, name: 'Atölye Kullanıcısı' });
      const { data: newData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 1)
        .maybeSingle<Profile>();
      if (newData) setProfile(newData);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const syncWithAuth = useCallback(async () => {
    if (!authProfile || !profile) return;

    const updates: Partial<Profile> = {};
    if (authProfile.name && authProfile.name !== profile.name) updates.name = authProfile.name;
    if (authProfile.email !== profile.email) updates.email = authProfile.email;
    if (authProfile.phone !== profile.phone) updates.phone = authProfile.phone;

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', 1);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [authProfile, profile]);

  useEffect(() => {
    if (session && authProfile) syncWithAuth();
  }, [session, authProfile, syncWithAuth]);

  const updateProfile = useCallback(async (updates: Partial<Pick<Profile, 'name' | 'email' | 'phone' | 'avatar_color'>>) => {
    await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() { return useContext(ProfileContext); }
