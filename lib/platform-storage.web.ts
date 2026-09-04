const memoryStore: Record<string, string> = {};

export const asyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return memoryStore[key] ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;
  },
  async removeItem(key: string): Promise<void> {
    delete memoryStore[key];
  },
};

export const netInfo = {
  addEventListener(listener: (state: { isConnected: boolean }) => void): () => void {
    listener({ isConnected: true });
    return () => {};
  },
};
