declare module 'react-native-purchases' {
  export interface PurchasesOffering {
    availablePackages: PurchasesPackage[];
  }
  export interface PurchasesPackage {
    identifier: string;
    product: { identifier: string };
  }
  export interface PurchasesCustomerInfo {
    entitlements: { active: Record<string, unknown> };
  }
  export interface PurchasesOfferings {
    current: PurchasesOffering | null;
  }
  const Purchases: {
    configure(opts: { apiKey: string }): Promise<void>;
    getOfferings(): Promise<PurchasesOfferings>;
    purchasePackage(pkg: PurchasesPackage): Promise<{ customerInfo: PurchasesCustomerInfo }>;
    restorePurchases(): Promise<PurchasesCustomerInfo>;
    getCustomerInfo(): Promise<PurchasesCustomerInfo>;
  };
  export default Purchases;
}
