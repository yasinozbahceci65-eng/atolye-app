import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, Star, Bell, Shield, Info, LogOut, User, Mail, Phone, Edit2, X, Palette, Image as ImageIcon } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { usePro } from '@/lib/pro-context';
import { useProfile } from '@/lib/profile-context';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { Image, Alert as RNAlert } from 'react-native';

const AVATAR_COLORS = ['#1A6B8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function AyarlarScreen() {
  const router = useRouter();
  const { isPro, planId, cancelPro } = usePro();
  const { profile, updateProfile } = useProfile();
  const { profile: authProfile, signOut } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? '');
  const [editEmail, setEditEmail] = useState(profile?.email ?? '');
  const [editPhone, setEditPhone] = useState(profile?.phone ?? '');
  const [editColor, setEditColor] = useState(profile?.avatar_color ?? '#1A6B8A');
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setEditName(profile?.name ?? '');
    setEditEmail(profile?.email ?? '');
    setEditPhone(profile?.phone ?? '');
    setEditColor(profile?.avatar_color ?? '#1A6B8A');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: editName || 'Atölye Kullanıcısı',
        email: editEmail || null,
        phone: editPhone || null,
        avatar_color: editColor,
      });
      setEditModalVisible(false);
    } catch {
      Alert.alert('Hata', 'Profil güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() ?? 'A';
  };

  const handleSignOut = () => {
    RNAlert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => { await signOut(); } },
    ]);
  };

  const displayName = authProfile?.name ?? profile?.name ?? 'Atölye Kullanıcısı';
  const displayEmail = authProfile?.email ?? profile?.email ?? null;
  const displayPhone = authProfile?.phone ?? profile?.phone ?? null;
  const avatarUrl = authProfile?.avatar_url ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={openEditModal}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: profile?.avatar_color || Colors.primary }]}>
              <Text style={styles.profileAvatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail || displayPhone || 'İletişim bilgisi yok'}</Text>
            {authProfile?.provider && (
              <View style={styles.providerBadge}>
                {authProfile.provider === 'google' && <Text style={styles.providerText}>Google</Text>}
                {authProfile.provider === 'phone' && <Text style={styles.providerText}>Telefon</Text>}
              </View>
            )}
            <View style={styles.planRow}>
              {isPro ? (
                <>
                  <Crown color={Colors.proGold} size={14} />
                  <Text style={styles.planTextPro}>Pro Üye</Text>
                </>
              ) : (
                <Text style={styles.planTextFree}>Ücretsiz Plan</Text>
              )}
            </View>
          </View>
          <Edit2 color={Colors.neutral400} size={20} />
        </TouchableOpacity>

        {!isPro && (
          <TouchableOpacity style={styles.upgradeCard} onPress={() => router.push('/pro-upgrade')}>
            <View style={styles.upgradeLeft}>
              <Crown color={Colors.proGold} size={28} />
              <View>
                <Text style={styles.upgradeTitle}>Pro'ya Yükseltin</Text>
                <Text style={styles.upgradeDesc}>Yapay zeka teşhisi, reklamsız deneyim ve daha fazlası</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Hesap</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={openEditModal}>
            <User color={Colors.neutral500} size={20} />
            <Text style={styles.rowText}>Profili Düzenle</Text>
            <Text style={styles.rowValue}>{profile?.name ? 'Düzenle' : ''}</Text>
          </TouchableOpacity>
          {displayPhone ? (
            <View style={styles.row}>
              <Phone color={Colors.neutral500} size={20} />
              <Text style={styles.rowText}>Telefon</Text>
              <Text style={styles.rowValue}>{displayPhone}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut color={Colors.danger} size={20} />
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Genel</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <Bell color={Colors.neutral500} size={20} />
            <Text style={styles.rowText}>Bildirimler</Text>
            <Text style={styles.rowValue}>Kritik stok</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Shield color={Colors.neutral500} size={20} />
            <Text style={styles.rowText}>Gizlilik</Text>
            <Text style={styles.rowValue}>Veriler cihazınızda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Info color={Colors.neutral500} size={20} />
            <Text style={styles.rowText}>Hakkında</Text>
            <Text style={styles.rowValue}>v1.0.0</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Premium</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => isPro ? null : router.push('/pro-upgrade')}>
            <Crown color={isPro ? Colors.proGold : Colors.neutral400} size={20} />
            <Text style={styles.rowText}>Pro Üyelik</Text>
            <Text style={styles.rowValue}>{isPro ? 'Aktif' : 'Pasif'}</Text>
          </TouchableOpacity>
          {isPro && (
            <TouchableOpacity
              style={styles.row}
              onPress={() => Alert.alert('Pro Üyelik İptali', 'Pro üyeliğinizi iptal etmek istediğinize emin misiniz?', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'İptal Et', style: 'destructive', onPress: async () => { await cancelPro(); Alert.alert('İptal Edildi', 'Pro üyeliğiniz iptal edildi.'); } },
              ])}
            >
              <LogOut color={Colors.danger} size={20} />
              <Text style={styles.rowText}>Pro Üyeliği İptal Et</Text>
              {planId && <Text style={styles.rowValue}>{planId === 'yearly' ? 'Yıllık' : 'Aylık'}</Text>}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.row}>
            <Star color={Colors.neutral500} size={20} />
            <Text style={styles.rowText}>Uygulamayı Değerlendir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profili Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                <X color={Colors.neutral500} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalAvatarPreview}>
                <View style={[styles.profileAvatar, { backgroundColor: editColor }]}>
                  <Text style={styles.profileAvatarText}>{getInitials(editName || 'A')}</Text>
                </View>
              </View>

              <Text style={styles.modalLabel}>Ad Soyad</Text>
              <View style={styles.modalInputRow}>
                <User color={Colors.neutral400} size={20} style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Adınız"
                  placeholderTextColor={Colors.neutral400}
                />
              </View>

              <Text style={styles.modalLabel}>E-posta</Text>
              <View style={styles.modalInputRow}>
                <Mail color={Colors.neutral400} size={20} style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="ornek@email.com"
                  placeholderTextColor={Colors.neutral400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.modalLabel}>Telefon</Text>
              <View style={styles.modalInputRow}>
                <Phone color={Colors.neutral400} size={20} style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="05xx xxx xx xx"
                  placeholderTextColor={Colors.neutral400}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.modalLabel}>Avatar Rengi</Text>
              <View style={styles.colorPickerRow}>
                {AVATAR_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setEditColor(color)}
                  >
                    {editColor === color && <Check color={Colors.white} size={18} />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveProfile} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: Colors.primary },
  title: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 100 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarImage: {
    width: 56, height: 56, borderRadius: 28,
  },
  providerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.neutral100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start',
  },
  providerText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: Colors.neutral500 },
  profileAvatarText: { fontFamily: 'Inter-Bold', fontSize: 24, color: Colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral800 },
  profileEmail: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, marginTop: 2 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  planTextPro: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.proGold },
  planTextFree: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400 },
  upgradeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral900,
    borderRadius: 16, padding: 16, marginBottom: 20,
  },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  upgradeTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.white },
  upgradeDesc: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, marginTop: 2 },
  sectionTitle: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral500, marginBottom: 8, marginLeft: 4 },
  section: {
    backgroundColor: Colors.white, borderRadius: 14, marginBottom: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral100, gap: 12,
  },
  rowText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800 },
  rowValue: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.neutral800 },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.neutral100, justifyContent: 'center', alignItems: 'center' },
  modalAvatarPreview: { alignItems: 'center', marginBottom: 20 },
  modalLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600, marginBottom: 8, marginTop: 12 },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral50,
    borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.neutral200,
  },
  modalInputIcon: { marginRight: 10 },
  modalInput: {
    flex: 1, paddingVertical: 14,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800,
  },
  colorPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  colorOption: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  colorOptionSelected: { borderWidth: 3, borderColor: Colors.neutral800 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, marginBottom: 20,
    borderWidth: 1.5, borderColor: Colors.dangerLight,
  },
  signOutText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.danger },
});
