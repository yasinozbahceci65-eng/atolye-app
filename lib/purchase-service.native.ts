import { Platform } from 'react-native';
import { asyncStorage } from './platform-storage';

export type PlanType = 'lifetime' | 'monthly';

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  planId: string | null;
  error?: string;
}

const STORAGE_KEY = 'atolye_pro_status';
const ANDROID_API_KEY = 'goog_api_key_buraya';
const IOS_API_KEY = 'appl_api_key_buraya';

let initialized = false;

let Purchases: any = null;
let isRevenueCatAvailable = false;

async function loadRevenueCat(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    const module = await import('react-native-purchases');
    Purchases = module.default ?? module;
    const apiKey = Platform.OS === 'android' ? ANDROID_API_KEY : IOS_API_KEY;
    if (apiKey && apiKey !== 'goog_api_key_buraya' && apiKey !== 'appl_api_key_buraya') {
      await Purchases.configure({ apiKey });
      isRevenueCatAvailable = true;
    }
  } catch {
    // react-native-purchases yüklü değil — asyncStorage fallback
  }
}

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
  await loadRevenueCat();
}

export async function buyPackage(planType: PlanType): Promise<PurchaseResult> {
  const planId = planType === 'lifetime' ? 'atolyem_lifetime' : 'atolyem_monthly';

  if (!isRevenueCatAvailable || !Purchases) {
    await setStoredStatus(true, planId);
    return { success: true, isPro: true, planId };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current;
    if (!offering) {
      await setStoredStatus(true, planId);
      return { success: true, isPro: true, planId };
    }

    const pkg = offering.availablePackages.find(
      (p: any) => p.identifier === planId || p.product.identifier === planId
    ) ?? offering.availablePackages[0];

    if (!pkg) {
      return { success: false, isPro: false, planId: null, error: 'Paket bulunamadı' };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const hasPro = customerInfo?.entitlements?.active?.['pro'] != null;
    await setStoredStatus(hasPro, hasPro ? planId : null);
    return { success: hasPro, isPro: hasPro, planId: hasPro ? planId : null };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { success: false, isPro: false, planId: null, error: 'Kullanıcı iptal etti' };
    }
    return { success: false, isPro: false, planId: null, error: e?.message ?? 'Satın alma hatası' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isRevenueCatAvailable || !Purchases) {
    const status = await getStoredStatus();
    if (status.isPro) {
      return { success: true, isPro: true, planId: status.planId };
    }
    return { success: false, isPro: false, planId: null, error: 'Geri yüklenecek satın alım bulunamadı' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasPro = customerInfo?.entitlements?.active?.['pro'] != null;
    const stored = await getStoredStatus();
    await setStoredStatus(hasPro, hasPro ? stored.planId : null);
    return { success: hasPro, isPro: hasPro, planId: hasPro ? stored.planId : null };
  } catch (e: any) {
    return { success: false, isPro: false, planId: null, error: e?.message ?? 'Geri yükleme hatası' };
  }
}

export async function checkProStatus(): Promise<{ isPro: boolean; planId: string | null }> {
  if (isRevenueCatAvailable && Purchases) {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPro = customerInfo?.entitlements?.active?.['pro'] != null;
      if (hasPro) {
        const stored = await getStoredStatus();
        await setStoredStatus(true, stored.planId);
        return { isPro: true, planId: stored.planId };
      }
    } catch {}
  }
  return getStoredStatus();
}
