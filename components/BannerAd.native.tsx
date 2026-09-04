import { View, StyleSheet } from 'react-native';
import { BannerAd as RNBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { usePro } from '@/lib/pro-context';

const BANNER_ID = 'ca-app-pub-3309697276277935/3471239046';

export function BannerAd() {
  const { isPro } = usePro();
  if (isPro) return null;

  return (
    <View style={styles.container}>
      <RNBannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', paddingVertical: 4 },
});
