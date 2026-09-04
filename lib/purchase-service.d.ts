export type PlanType = 'lifetime' | 'monthly';

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  planId: string | null;
  error?: string;
}

export function initPurchases(): Promise<void>;
export function buyPackage(planType: PlanType): Promise<PurchaseResult>;
export function restorePurchases(): Promise<PurchaseResult>;
export function checkProStatus(): Promise<{ isPro: boolean; planId: string | null }>;
