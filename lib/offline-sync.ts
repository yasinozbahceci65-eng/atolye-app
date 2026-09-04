import { asyncStorage, netInfo } from './platform-storage';
import { supabase, Item, Project } from './supabase';

const CACHE_KEYS = {
  items: 'offline_items',
  projects: 'offline_projects',
  pendingChanges: 'offline_pending_changes',
  lastSync: 'offline_last_sync',
};

interface PendingChange {
  id: string;
  table: 'items' | 'projects';
  operation: 'insert' | 'update' | 'delete';
  recordId: string;
  data: any;
  timestamp: number;
}

class OfflineSync {
  private listeners: ((isOnline: boolean) => void)[] = [];
  private isOnline = true;
  private unsubscribe: (() => void) | null = null;

  init() {
    this.unsubscribe = netInfo.addEventListener((state: any) => {
      const online = !!state.isConnected;
      if (online !== this.isOnline) {
        this.isOnline = online;
        this.listeners.forEach(l => l(online));
        if (online) this.syncPendingChanges();
      }
    });
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  getOnlineStatus() { return this.isOnline; }

  onConnectivityChange(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async cacheItems(items: Item[]) {
    await asyncStorage.setItem(CACHE_KEYS.items, JSON.stringify(items));
  }

  async getCachedItems(): Promise<Item[]> {
    const data = await asyncStorage.getItem(CACHE_KEYS.items);
    return data ? JSON.parse(data) : [];
  }

  async cacheProjects(projects: Project[]) {
    await asyncStorage.setItem(CACHE_KEYS.projects, JSON.stringify(projects));
  }

  async getCachedProjects(): Promise<Project[]> {
    const data = await asyncStorage.getItem(CACHE_KEYS.projects);
    return data ? JSON.parse(data) : [];
  }

  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>) {
    const pending = await this.getPendingChanges();
    pending.push({ ...change, id: `pc-${Date.now()}-${Math.random()}`, timestamp: Date.now() });
    await asyncStorage.setItem(CACHE_KEYS.pendingChanges, JSON.stringify(pending));
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    const data = await asyncStorage.getItem(CACHE_KEYS.pendingChanges);
    return data ? JSON.parse(data) : [];
  }

  async clearPendingChanges() {
    await asyncStorage.setItem(CACHE_KEYS.pendingChanges, '[]');
  }

  async setLastSync() {
    await asyncStorage.setItem(CACHE_KEYS.lastSync, new Date().toISOString());
  }

  async getLastSync(): Promise<string | null> {
    return asyncStorage.getItem(CACHE_KEYS.lastSync);
  }

  async syncPendingChanges(): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingChanges();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: PendingChange[] = [];

    for (const change of pending) {
      try {
        if (change.table === 'items') {
          if (change.operation === 'insert') {
            await supabase.from('items').insert(change.data);
          } else if (change.operation === 'update') {
            await supabase.from('items').update(change.data).eq('id', change.recordId);
          } else if (change.operation === 'delete') {
            await supabase.from('items').delete().eq('id', change.recordId);
          }
        } else if (change.table === 'projects') {
          const { materials, ...projectData } = change.data;
          if (change.operation === 'insert') {
            const { data: createdProject, error } = await supabase
              .from('projects')
              .insert(projectData)
              .select('id')
              .single();
            if (error) throw error;
            if (materials?.length && createdProject) {
              const { error: materialsError } = await supabase.from('project_materials').insert(
                materials.map((material: any) => ({ ...material, project_id: createdProject.id }))
              );
              if (materialsError) throw materialsError;
            }
          } else if (change.operation === 'update') {
            const { error } = await supabase.from('projects').update(projectData).eq('id', change.recordId);
            if (error) throw error;
            if (materials) {
              const { error: deleteError } = await supabase.from('project_materials').delete().eq('project_id', change.recordId);
              if (deleteError) throw deleteError;
              if (materials.length) {
                const { error: materialsError } = await supabase.from('project_materials').insert(
                  materials.map((material: any) => ({ ...material, project_id: change.recordId }))
                );
                if (materialsError) throw materialsError;
              }
            }
          } else if (change.operation === 'delete') {
            const { error } = await supabase.from('projects').delete().eq('id', change.recordId);
            if (error) throw error;
          }
        }
        synced++;
      } catch {
        failed++;
        remaining.push(change);
      }
    }

    await asyncStorage.setItem(CACHE_KEYS.pendingChanges, JSON.stringify(remaining));
    await this.setLastSync();
    return { synced, failed };
  }

  async hasPendingChanges(): Promise<boolean> {
    const pending = await this.getPendingChanges();
    return pending.length > 0;
  }
}

export const offlineSync = new OfflineSync();
