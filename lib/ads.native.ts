import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

const INTERSTITIAL_ID = 'ca-app-pub-3309697276277935/9343235602';

let interstitial: InterstitialAd | null = null;
let loaded = false;

function getInterstitial(): InterstitialAd {
  if (!interstitial) {
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    interstitial.addAdEventListener(AdEventType.LOADED, () => { loaded = true; });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loaded = false;
      interstitial = null;
      loadInterstitial();
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => { loaded = false; });
  }
  return interstitial;
}

function loadInterstitial() {
  try { getInterstitial().load(); } catch {}
}

export function initAds() {
  loadInterstitial();
}

export function showInterstitial(isPro: boolean): Promise<void> {
  return new Promise((resolve) => {
    if (isPro) { resolve(); return; }
    try {
      const ad = getInterstitial();
      if (loaded) {
        ad.addAdEventListener(AdEventType.CLOSED, () => resolve());
        ad.show();
      } else {
        ad.addAdEventListener(AdEventType.LOADED, () => {
          ad.addAdEventListener(AdEventType.CLOSED, () => resolve());
          ad.show();
        });
        ad.load();
      }
    } catch { resolve(); }
  });
}
