export interface AsyncStorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface NetInfoInterface {
  addEventListener(
    listener: (state: { isConnected: boolean | null }) => void
  ): () => void;
}

export const asyncStorage: AsyncStorageInterface;
export const netInfo: NetInfoInterface;
