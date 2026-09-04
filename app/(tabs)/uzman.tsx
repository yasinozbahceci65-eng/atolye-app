import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HardHat, PencilRuler, ScanLine, Sparkles, Crown, ArrowRight, MessageCircle } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { usePro } from '@/lib/pro-context';

export default function UzmanScreen() {
  const router = useRouter();
  const { isPro } = usePro();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Uzman Desteği</Text>
        <Text style={styles.title}>Danış & Çöz</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.card, !isPro && styles.cardLocked]}
          onPress={() => isPro ? router.push({ pathname: '/consult', params: { type: 'usta' } }) : router.push('/pro-upgrade')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
            <HardHat color={Colors.secondary} size={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Ustaya Danış</Text>
              {!isPro && (
                <View style={styles.proBadge}>
                  <Crown color={Colors.proGold} size={12} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDesc}>Sorunlu bölgenin fotoğrafını yükleyin, açıklama yazın ve WhatsApp ile ustaya gönderin.</Text>
          </View>
          <ArrowRight color={Colors.neutral300} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, !isPro && styles.cardLocked]}
          onPress={() => isPro ? router.push({ pathname: '/consult', params: { type: 'mimar' } }) : router.push('/pro-upgrade')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
            <PencilRuler color={Colors.primary} size={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Mimara Danış</Text>
              {!isPro && (
                <View style={styles.proBadge}>
                  <Crown color={Colors.proGold} size={12} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDesc}>Proje veya tasarım sorularınızı mimara iletin, fotoğraf ekleyerek destek alın.</Text>
          </View>
          <ArrowRight color={Colors.neutral300} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/scanner')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#DCFCE7' }]}>
            <ScanLine color={Colors.accent} size={28} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Hızlı Tarayıcı</Text>
            <Text style={styles.cardDesc}>Barkod veya QR kod tarayarak malzemenin miktarını anında güncelleyin.</Text>
          </View>
          <ArrowRight color={Colors.neutral300} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, isPro && styles.cardPro]}
          onPress={() => router.push('/ai-diagnose')}
        >
          <View style={[styles.cardIcon, { backgroundColor: isPro ? '#FEF3C7' : Colors.neutral100 }]}>
            <Sparkles color={isPro ? Colors.proGold : Colors.neutral400} size={28} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Yapay Zeka Teşhisi</Text>
              {!isPro && (
                <View style={styles.proBadge}>
                  <Crown color={Colors.proGold} size={12} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDesc}>Sorunlu bölgenin fotoğrafını yükleyin, yapay zeka size gerekli işlemi söylesin.</Text>
          </View>
          <ArrowRight color={Colors.neutral300} size={20} />
        </TouchableOpacity>

        {!isPro && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => router.push('/pro-upgrade')}>
            <View style={styles.upgradeLeft}>
              <Crown color={Colors.proGold} size={24} />
              <View>
                <Text style={styles.upgradeTitle}>Pro'ya Yükseltin</Text>
                <Text style={styles.upgradeDesc}>Yapay zeka teşhisi ve tüm premium özellikler</Text>
              </View>
            </View>
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Yükselt</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: Colors.primary },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  title: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardPro: { borderWidth: 1.5, borderColor: Colors.proGold },
  cardLocked: { borderWidth: 1.5, borderColor: Colors.neutral200, opacity: 0.85 },
  cardIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral800 },
  cardDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral500, marginTop: 4, lineHeight: 18 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.proGoldLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  proBadgeText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: Colors.proGold },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.neutral900, borderRadius: 16, padding: 16, marginTop: 8,
  },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.white },
  upgradeDesc: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, marginTop: 2 },
  upgradeButton: { backgroundColor: Colors.proGold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  upgradeButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.white },
});
