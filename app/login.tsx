import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Wrench, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth-context';
import { GoogleLogo } from '@/components/GoogleLogo';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const hash = window.location.hash;
    if (!hash || (!hash.includes('access_token') && !hash.includes('error'))) return;

    setLoading(true);
    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          setLoading(false);
          setError('Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Oturum alınamadı. Lütfen tekrar deneyin.');
      });
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (signInError: unknown) {
      setError(signInError instanceof Error ? signInError.message : 'Google ile giriş yapılamadı.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerGlow} />

      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <View style={styles.logoCircle}>
            <Wrench color={Colors.white} size={40} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Atölyem</Text>
          <Text style={styles.subtitle}>Atölye & Şantiye Yönetim Asistanınız</Text>
        </View>

        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.neutral700} />
            ) : (
              <>
                <GoogleLogo size={22} />
                <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
              </>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.securityNote}>
            <ShieldCheck color={Colors.primary} size={17} />
            <Text style={styles.securityText}>Güvenli giriş ile verileriniz korunur.</Text>
          </View>
        </View>

        <Text style={styles.termsText}>
          Giriş yaparak Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  headerGlow: {
    position: 'absolute', top: -150, left: -80, right: -80, height: 360,
    backgroundColor: Colors.primary, borderRadius: 240, opacity: 0.08,
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'stretch',
    paddingHorizontal: 28, paddingTop: Platform.OS === 'web' ? 0 : 24, paddingBottom: 28,
  },
  brandBlock: { alignItems: 'center', marginBottom: 52 },
  logoCircle: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.26, shadowRadius: 16, elevation: 8,
  },
  title: { fontFamily: 'Inter-Bold', fontSize: 34, color: Colors.neutral800, marginTop: 20 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral500, marginTop: 6, textAlign: 'center' },
  actionBlock: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  googleButton: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.neutral200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  buttonDisabled: { opacity: 0.7 },
  googleButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral700 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.danger, textAlign: 'center', lineHeight: 19, marginTop: 14 },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22 },
  securityText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral500 },
  termsText: {
    maxWidth: 360, alignSelf: 'center', fontFamily: 'Inter-Regular', fontSize: 11,
    color: Colors.neutral400, lineHeight: 17, textAlign: 'center', marginTop: 'auto', paddingTop: 44,
  },
});
