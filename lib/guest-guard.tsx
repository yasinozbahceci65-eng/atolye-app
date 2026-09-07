import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth-context';

interface GuestGuardState {
  requireAuth: (action?: string) => boolean;
  modalVisible: boolean;
}

const GuestGuardContext = createContext<GuestGuardState>({
  requireAuth: () => false,
  modalVisible: false,
});

export function GuestGuardProvider({ children }: { children: ReactNode }) {
  const { isGuest, session } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const requireAuth = useCallback((): boolean => {
    if (session) return true;
    if (isGuest) {
      setModalVisible(true);
      return false;
    }
    return true;
  }, [isGuest, session]);

  const goToLogin = () => {
    setModalVisible(false);
    router.replace('/login');
  };

  return (
    <GuestGuardContext.Provider value={{ requireAuth, modalVisible }}>
      {children}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Lock color={Colors.primary} size={32} />
            </View>
            <Text style={styles.title}>Giriş Yapmanız Gerekiyor</Text>
            <Text style={styles.desc}>Bu özelliği kullanabilmek için lütfen giriş yapın.</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={goToLogin}>
              <Text style={styles.loginBtnText}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GuestGuardContext.Provider>
  );
}

export function useGuestGuard() { return useContext(GuestGuardContext); }
