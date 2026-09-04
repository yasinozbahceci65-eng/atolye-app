import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, ProSubscription } from '@/lib/supabase';
import { initPurchases, checkProStatus, buyPackage as rcBuyPackage, restorePurchases as rcRestore, PlanType } from '@/lib/purchase-service';

interface ProState {
  isPro: boolean;
  planId: string | null;
  loading: boolean;
  purchase: (planType: PlanType) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; error?: string }>;
  cancelPro: () => Promise<void>;
}

const ProContext = createContext<ProState>({
  isPro: false,
  planId: null,
  loading: true,
  purchase: async () => ({ success: false }),
  restore: async () => ({ success: false }),
  cancelPro: async () => {},
});

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPro = useCallback(async () => {
    await initPurchases();
    const rcStatus = await checkProStatus();

    if (rcStatus.isPro) {
      setIsPro(true);
      setPlanId(rcStatus.planId);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('id', 1)
      .maybeSingle<ProSubscription>();

    if (data) {
      setIsPro(data.is_pro);
      setPlanId(data.plan_id);
    } else {
      await supabase.from('pro_subscriptions').insert({ id: 1, is_pro: false });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPro();
  }, [loadPro]);

  const purchase = useCallback(async (planType: PlanType): Promise<{ success: boolean; error?: string }> => {
    const result = await rcBuyPackage(planType);
    if (result.success && result.isPro) {
      setIsPro(true);
      setPlanId(result.planId);
      const now = new Date();
      const expires = new Date();
      if (planType === 'lifetime') expires.setFullYear(expires.getFullYear() + 100);
      else expires.setMonth(expires.getMonth() + 1);

      await supabase
        .from('pro_subscriptions')
        .update({
          is_pro: true,
          plan_id: result.planId,
          purchased_at: now.toISOString(),
          expires_at: expires.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', 1);
    }
    return { success: result.success, error: result.error };
  }, []);

  const restore = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const result = await rcRestore();
    if (result.success && result.isPro) {
      setIsPro(true);
      setPlanId(result.planId);
      await supabase
        .from('pro_subscriptions')
        .update({ is_pro: true, plan_id: result.planId, updated_at: new Date().toISOString() })
        .eq('id', 1);
    }
    return { success: result.success, error: result.error };
  }, []);

  const cancelPro = useCallback(async () => {
    await supabase
      .from('pro_subscriptions')
      .update({ is_pro: false, plan_id: null, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setIsPro(false);
    setPlanId(null);
  }, []);

  return (
    <ProContext.Provider value={{ isPro, planId, loading, purchase, restore, cancelPro }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() { return useContext(ProContext); }
