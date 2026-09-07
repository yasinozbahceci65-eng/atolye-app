import { useEffect, Component, ReactNode } from 'react';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ProProvider } from '@/lib/pro-context';
import { ProfileProvider } from '@/lib/profile-context';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { GuestGuardProvider } from '@/lib/guest-guard';
import { initAds } from '@/lib/ads';
import { offlineSync } from '@/lib/offline-sync';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/lib/colors';

SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Bir sorun oluştu</Text>
          <Text style={styles.errorText}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AuthGate() {
  const { session, loading, isGuest } = useAuth();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;
    if (loading) return;
    if (!session && !isGuest) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)/');
    }
  }, [session, loading, isGuest, navState?.key, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initAds();
    offlineSync.init();
    return () => offlineSync.destroy();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <GuestGuardProvider>
          <ProProvider>
            <ProfileProvider>
              <AuthGate />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen name="item-detail" />
              <Stack.Screen name="add-item" />
              <Stack.Screen name="scanner" />
              <Stack.Screen name="project-detail" />
              <Stack.Screen name="consult" />
              <Stack.Screen name="ai-diagnose" />
              <Stack.Screen name="pro-upgrade" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
            </ProfileProvider>
          </ProProvider>
        </GuestGuardProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#666', textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.neutral50 },
});
