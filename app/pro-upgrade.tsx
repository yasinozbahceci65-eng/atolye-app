import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check, Sparkles, Shield, Bell, Star, HardHat, PencilRuler, Lock } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { usePro } from '@/lib/pro-context';
import { useState } from 'react';
import { PlanType } from '@/lib/purchase-service';

const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://atolye-toolbox.vercel.app/privacy';

const PLANS: { id: PlanType; name: string; price: string; period: string; desc: string; badge?: string }[] = [
  { id: 'lifetime', name: 'Ömür Boyu Pro', price: '₺659,99', period: 'Tek Seferlik', desc: 'Bir kez öde, sonsuza dek kullan.', badge: '★ EN DEĞERLİ' },
  { id: 'monthly', name: 'Aylık Abonelik', price: '₺79,99', period: '/ay', desc: 'İstediğin zaman iptal et.' },
];

const FEATURES = [
  { icon: Sparkles, title: 'Yapay Zeka Teşhisi', desc: 'Duvardaki sorunları fotoğrafla anında teşhis et' },
  { icon: HardHat, title: 'Ustaya Danışma Desteği', desc: 'Usta ile doğrudan iletişim, fotoğraf gönder' },
  { icon: PencilRuler, title: 'Mimara Danışma Desteği', desc: 'Proje ve tasarım sorularını mimara ilet' },
  { icon: Shield, title: 'Sınırsız Proje & Envanter', desc: 'Sınırsız proje ve malzeme yönetimi' },
  { icon: Bell, title: 'Reklamsız Deneyim', desc: 'Tüm reklamlar kaldırılır, kesintisiz kullanım' },
];

export default function ProUpgradeScreen() {
  const router = useRouter();
  const { purchase, restore, isPro } = usePro();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('lifetime');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreAlert, setShowRestoreAlert] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await purchase(selectedPlan);
      if (result.success) {
        Alert.alert(
          'Tebrikler!',
          'Pro üyeliğiniz aktif edildi! Tüm premium özellikler açık.',
          [{ text: 'Tamam', onPress: () => router.back() }]
        );
      } else if (result.error && result.error !== 'İptal edildi') {
        Alert.alert('Hata', result.error);
      }
    } catch {
      Alert.alert('Hata', 'Satın alma işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restore();
      if (result.success) {
        setRestoreMessage('Satın alımlarınız başarıyla geri yüklendi! Pro üyelik aktif.');
        setShowRestoreAlert(true);
      } else {
        setRestoreMessage(result.error ?? 'Geri yüklenecek satın alım bulunamadı.');
        setShowRestoreAlert(true);
      }
    } catch {
      setRestoreMessage('Geri yükleme başarısız oldu.');
      setShowRestoreAlert(true);
    }
    setRestoring(false);
  };

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pro'ya Yükselt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Crown color={Colors.proGold} size={44} />
          </View>
          <Text style={styles.heroTitle}>Atölyem Pro</Text>
          <Text style={styles.heroDesc}>Tüm Özellikleri Açın</Text>
        </View>

        {/* Features Card - Dark Design */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
              <View style={[styles.featureIcon, { backgroundColor: i === 0 ? 'rgba(217,119,6,0.15)' : 'rgba(26,107,138,0.15)' }]}>
                <f.icon color={i === 0 ? Colors.proGold : Colors.primaryLight} size={20} />
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Check color={Colors.success} size={18} />
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        <Text style={styles.sectionTitle}>Plan Seçin</Text>
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              {plan.badge && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View style={[styles.radio, selectedPlan === plan.id && styles.radioActive]}>
                  {selectedPlan === plan.id && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.planName, selectedPlan === plan.id && styles.planNameActive]}>{plan.name}</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, selectedPlan === plan.id && styles.planPriceActive]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, selectedPlan === plan.id && styles.planPeriodActive]}>{plan.period}</Text>
              </View>
              <Text style={[styles.planDesc, selectedPlan === plan.id && styles.planDescActive]}>{plan.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Button */}
        <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase} disabled={purchasing}>
          {purchasing ? (
            <>
              <ActivityIndicator color={Colors.white} />
              <Text style={styles.purchaseBtnText}>İşleniyor...</Text>
            </>
          ) : (
            <>
              <Lock color={Colors.white} size={18} />
              <Text style={styles.purchaseBtnText}>1 Tıkla Satın Al</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.priceHint}>
          {selectedPlan === 'lifetime'
            ? '₺659,99 tek seferlik ödeme — sonsuza dek kullan'
            : '₺79,99/ay — istediğin zaman iptal et'}
        </Text>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={handleRestore} disabled={restoring}>
            <Text style={styles.footerLink}>
              {restoring ? 'Geri yükleniyor...' : 'Satın Alımları Geri Yükle'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}> · </Text>
          <TouchableOpacity onPress={() => Linking.openURL(EULA_URL)}>
            <Text style={styles.footerLink}>Kullanım Koşulları (EULA)</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}> · </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.footerLink}>Gizlilik Politikası</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Ödeme App Store veya Google Play hesabınızdan tahsil edilir. Abonelik otomatik yenilenir. İstediğiniz zaman ayarlardan iptal edebilirsiniz.
        </Text>
      </ScrollView>

      {/* Restore Alert Modal */}
      <Modal visible={showRestoreAlert} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Geri Yükleme</Text>
            <Text style={styles.modalMessage}>{restoreMessage}</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowRestoreAlert(false);
                if (restoreMessage.includes('başarıyla')) router.back();
              }}
            >
              <Text style={styles.modalBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 24 },
  heroIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.proGoldLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.proGold,
  },
  heroTitle: { fontFamily: 'Inter-Bold', fontSize: 26, color: Colors.neutral800, marginTop: 14 },
  heroDesc: { fontFamily: 'Inter-Medium', fontSize: 15, color: Colors.neutral500, marginTop: 4 },

  // Features - Dark Card
  featuresCard: {
    backgroundColor: Colors.neutral900, borderRadius: 16, padding: 4, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  featureIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureBody: { flex: 1 },
  featureTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  featureDesc: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 17 },

  // Plans
  sectionTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral800, marginBottom: 12 },
  plansContainer: { gap: 12 },
  planCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18,
    borderWidth: 2, borderColor: Colors.neutral200, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  planCardActive: {
    borderColor: Colors.proGold,
    backgroundColor: '#FFFBEB',
    shadowColor: Colors.proGold, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  bestValueBadge: {
    position: 'absolute', top: -11, right: 16,
    backgroundColor: Colors.proGold, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
  },
  bestValueText: { fontFamily: 'Inter-SemiBold', fontSize: 9, color: Colors.white },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.neutral300, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.proGold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.proGold },
  planName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral600 },
  planNameActive: { color: Colors.proGold },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginLeft: 32 },
  planPrice: { fontFamily: 'Inter-Bold', fontSize: 24, color: Colors.neutral800 },
  planPriceActive: { color: Colors.proGold },
  planPeriod: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral400, marginLeft: 4 },
  planPeriodActive: { color: Colors.proGold },
  planDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral500, marginTop: 6, marginLeft: 32 },
  planDescActive: { color: Colors.neutral700 },

  // Purchase Button
  purchaseBtn: {
    flexDirection: 'row', backgroundColor: Colors.proGold, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
    shadowColor: Colors.proGold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  purchaseBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  priceHint: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, textAlign: 'center', marginTop: 10 },

  // Footer
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 2 },
  footerLink: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.primary },
  footerDot: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.neutral300 },
  disclaimer: { fontFamily: 'Inter-Regular', fontSize: 10, color: Colors.neutral400, textAlign: 'center', marginTop: 12, lineHeight: 15 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 40 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.neutral800, marginBottom: 10 },
  modalMessage: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral500, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  modalBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.white },
});
