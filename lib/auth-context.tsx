import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthProfile {
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  provider: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const meta = currentUser.user_metadata ?? {};
    const phone = currentUser.phone ?? meta.phone ?? null;
    const fullName = meta.full_name ?? meta.name ?? (phone ? `Kullanıcı ${phone.slice(-4)}` : 'Atölye Kullanıcısı');
    const email = currentUser.email ?? meta.email ?? null;
    const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
    const provider = currentUser.app_metadata?.provider ?? null;

    let dbProfile: AuthProfile = {
      name: fullName,
      email,
      phone,
      avatar_url: avatarUrl,
      provider,
    };

    try {
      const { data: dbData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (dbData) {
        dbProfile = {
          name: dbData.full_name ?? fullName,
          email: dbData.email ?? email,
          phone: dbData.phone ?? phone,
          avatar_url: dbData.avatar_url ?? avatarUrl,
          provider: dbData.provider ?? provider,
        };
      }
    } catch {
      // DB erişimi başarısız olursa meta verilerden devam et
    }

    setProfile(dbProfile);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        loadProfile(data.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        await loadProfile(newSession?.user ?? null);
        setLoading(false);
      })();
    });

    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [user, loadProfile]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Platform.OS === 'web'
      ? `${window.location.origin}/login`
      : Linking.createURL('auth-callback');

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('OAuth URL alınamadı.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.slice(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      signInWithGoogle, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
