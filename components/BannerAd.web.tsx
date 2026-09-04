import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/colors';
import { usePro } from '@/lib/pro-context';

export function BannerAd() {
  const { isPro } = usePro();
  if (isPro) return null;

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Reklam Alanı (AdMob Banner)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', paddingVertical: 4 },
  placeholder: {
    width: '100%', height: 50, backgroundColor: Colors.neutral100, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.neutral200,
  },
  placeholderText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral400 },
});
