import { Platform, Alert } from 'react-native';
import { asyncStorage } from './platform-storage';

export type PlanType = 'lifetime' | 'monthly';

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  planId: string | null;
  error?: string;
}

const STORAGE_KEY = 'atolye_pro_status';

async function getStoredStatus(): Promise<{ isPro: boolean; planId: string | null }> {
  try {
    const raw = await asyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isPro: false, planId: null };
}

async function setStoredStatus(isPro: boolean, planId: string | null) {
  try {
    await asyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPro, planId }));
  } catch {}
}

export async function initPurchases(): Promise<void> {
  // Web'te RevenueCat çalışmaz, simüle ediyoruz
}

export async function buyPackage(planType: PlanType): Promise<PurchaseResult> {
  const planId = planType === 'lifetime' ? 'atolyem_lifetime' : 'atolyem_monthly';

  // Web tarayıcısında test modu — simüle edilmiş satın alma
  return new Promise((resolve) => {
    Alert.alert(
      'Test Modu',
      'Web tarayıcısında gerçek satın alma yapılamaz. Bu, mobil cihazda App Store veya Google Play üzerinden gerçekleştirilecektir. Test için Pro üyelik simülasyonu olarak aktif edilsin mi?',
      [
        { text: 'İptal', onPress: () => resolve({ success: false, isPro: false, planId: null, error: 'İptal edildi' }) },
        {
          text: 'Evet, Test Et',
          onPress: async () => {
            await setStoredStatus(true, planId);
            resolve({ success: true, isPro: true, planId });
          },
        },
      ]
    );
  });
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const status = await getStoredStatus();
  if (status.isPro) {
    return { success: true, isPro: true, planId: status.planId };
  }
  return { success: false, isPro: false, planId: null, error: 'Geri yüklenecek satın alım bulunamadı' };
}

export async function checkProStatus(): Promise<{ isPro: boolean; planId: string | null }> {
  return getStoredStatus();
}
