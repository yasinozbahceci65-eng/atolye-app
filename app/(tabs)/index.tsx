import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { Search, Plus, ScanLine, AlertTriangle, Package, TrendingDown, Boxes, ArrowRight, WifiOff, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Item } from '@/lib/supabase';
import { BannerAd } from '@/components/BannerAd';
import { offlineSync } from '@/lib/offline-sync';

export default function DashboardScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('items')
      .select('*, categories(*)')
      .order('name');
    if (data && data.length > 0) {
      setItems(data);
      await offlineSync.cacheItems(data);
    } else {
      const cached = await offlineSync.getCachedItems();
      setItems(cached);
    }
    const pending = await offlineSync.getPendingChanges();
    setPendingCount(pending.length);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  useEffect(() => {
    const unsub = offlineSync.onConnectivityChange(online => {
      setIsOnline(online);
      if (online) fetchData();
    });
    return unsub;
  }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await offlineSync.syncPendingChanges();
    setSyncing(false);
    if (result.synced > 0) {
      Alert.alert('Senkronize Edildi', `${result.synced} değişiklik senkronize edildi.`);
      fetchData();
    } else if (result.failed > 0) {
      Alert.alert('Uyarı', `${result.failed} değişiklik senkronize edilemedi, tekrar denenecek.`);
    } else {
      Alert.alert('Bilgi', 'Senkronize edilecek değişiklik yok.');
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const criticalItems = items.filter(i => i.quantity <= i.critical_level);
  const totalItems = items.length;
  const lowStock = criticalItems.length;

  const getProgress = (item: Item) => {
    if (item.max_quantity === 0) return 0;
    return Math.min(100, (item.quantity / item.max_quantity) * 100);
  };

  const getProgressColor = (item: Item) => {
    if (item.quantity <= item.critical_level) return Colors.danger;
    if (item.quantity <= item.critical_level * 2) return Colors.warning;
    return Colors.accent;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Atölyenize Hoş Geldiniz</Text>
          <Text style={styles.title}>Envanter Paneli</Text>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/scanner')}
        >
          <ScanLine color={Colors.white} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search color={Colors.neutral400} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Malzeme ara..."
            placeholderTextColor={Colors.neutral400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-item')}
        >
          <Plus color={Colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Boxes color={Colors.primary} size={24} />
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statCard}>
          <Package color={Colors.accent} size={24} />
          <Text style={styles.statValue}>{totalItems - lowStock}</Text>
          <Text style={styles.statLabel}>Yeterli</Text>
        </View>
        <View style={[styles.statCard, lowStock > 0 && styles.statCardDanger]}>
          <TrendingDown color={lowStock > 0 ? Colors.danger : Colors.neutral400} size={24} />
          <Text style={[styles.statValue, lowStock > 0 && styles.statValueDanger]}>{lowStock}</Text>
          <Text style={styles.statLabel}>Kritik</Text>
        </View>
      </View>

      {lowStock > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle color={Colors.danger} size={18} />
          <Text style={styles.alertText}>{lowStock} malzeme kritik seviyenin altında!</Text>
        </View>
      )}

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff color={Colors.white} size={16} />
          <Text style={styles.offlineText}>Çevrimdışı - Veriler cihazda saklanıyor</Text>
          {pendingCount > 0 && <Text style={styles.offlinePending}>{pendingCount} bekleyen değişiklik</Text>}
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={handleSync} disabled={syncing}>
          <RefreshCw color={Colors.primary} size={16} />
          <Text style={styles.syncText}>{pendingCount} değişiklik senkronize edilmeyi bekliyor</Text>
          <Text style={styles.syncBtn}>{syncing ? '...' : 'Senkronize Et'}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Package color={Colors.neutral300} size={48} />
            <Text style={styles.emptyTitle}>Henüz malzeme yok</Text>
            <Text style={styles.emptyDesc}>+ butonuna basarak ilk malzemenizi ekleyin</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemLeft}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: item.categories?.color || Colors.neutral300 }]}
                  />
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.categories?.name || 'Kategorisiz'}</Text>
                  </View>
                </View>
                {item.quantity <= item.critical_level && (
                  <View style={styles.criticalBadge}>
                    <AlertTriangle color={Colors.danger} size={12} />
                    <Text style={styles.criticalText}>Kritik</Text>
                  </View>
                )}
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgress(item)}%`, backgroundColor: getProgressColor(item) },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.quantityText}>
                  {item.quantity} / {item.max_quantity} {item.unit_type}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <BannerAd />
    </View>
  );}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: Colors.primary,
  },
  greeting: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  title: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.white },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.primary },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: Colors.primary, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statCardDanger: { backgroundColor: 'rgba(239,68,68,0.2)' },
  statValue: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.white, marginTop: 4 },
  statValueDanger: { color: Colors.dangerLight },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  alertText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.danger, flex: 1 },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.neutral700, marginHorizontal: 20, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  offlineText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.white, flex: 1 },
  offlinePending: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.secondary },
  syncBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#DBEAFE', marginHorizontal: 20, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  syncText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.primary, flex: 1 },
  syncBtn: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.primary },
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingTop: 12, paddingBottom: 100 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral500, marginTop: 12 },
  emptyDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400, marginTop: 4 },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  itemName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral800 },
  itemCategory: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, marginTop: 2 },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  criticalText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.danger },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressContainer: { flex: 1 },
  progressBg: { height: 8, backgroundColor: Colors.neutral100, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  quantityText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral600 },
});
