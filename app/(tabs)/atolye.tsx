import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Search, Plus, ScanLine, AlertTriangle, Filter, WifiOff } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Item, Category } from '@/lib/supabase';
import { BannerAd } from '@/components/BannerAd';
import { offlineSync } from '@/lib/offline-sync';
import { useEffect } from 'react';

export default function AtolyeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes] = await Promise.all([
        supabase.from('items').select('*, categories(*)').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (itemsRes.data && itemsRes.data.length > 0) {
        setItems(itemsRes.data);
        await offlineSync.cacheItems(itemsRes.data);
      } else {
        const cached = await offlineSync.getCachedItems();
        setItems(cached);
      }
      setCategories(catRes.data ?? []);
    } catch {
      const cached = await offlineSync.getCachedItems();
      setItems(cached);
    }
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

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || i.category_id === activeCategory;
    return matchSearch && matchCat;
  });

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
        <Text style={styles.title}>Atölyem</Text>
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

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff color={Colors.white} size={16} />
          <Text style={styles.offlineText}>Çevrimdışı - Önbelleğe alınmış veriler gösteriliyor</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>Tümü</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          >
            <View style={[styles.categoryChipDot, { backgroundColor: cat.color }]} />
            <Text style={[styles.categoryChipText, activeCategory === cat.id && styles.categoryChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Filter color={Colors.neutral300} size={48} />
            <Text style={styles.emptyTitle}>Malzeme bulunamadı</Text>
            <Text style={styles.emptyDesc}>Filtreleri değiştirin veya yeni malzeme ekleyin</Text>
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
                  <View style={[styles.categoryDot, { backgroundColor: item.categories?.color || Colors.neutral300 }]} />
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
                    <View style={[styles.progressFill, { width: `${getProgress(item)}%`, backgroundColor: getProgressColor(item) }]} />
                  </View>
                </View>
                <Text style={styles.quantityText}>{item.quantity} / {item.max_quantity} {item.unit_type}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <BannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  title: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.white },
  scanButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.primary },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 12, marginRight: 12, height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800 },
  addButton: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  categoryScroll: { maxHeight: 44, backgroundColor: Colors.primary },
  categoryScrollContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  categoryChipActive: { backgroundColor: Colors.white },
  categoryChipDot: { width: 8, height: 8, borderRadius: 4 },
  categoryChipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  categoryChipTextActive: { color: Colors.primary },
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingTop: 12, paddingBottom: 100 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral500, marginTop: 12 },
  emptyDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400, marginTop: 4 },
  itemCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  itemName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral800 },
  itemCategory: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, marginTop: 2 },
  criticalBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4,
  },
  criticalText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.danger },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressContainer: { flex: 1 },
  progressBg: { height: 8, backgroundColor: Colors.neutral100, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  quantityText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral600 },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.neutral700, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 20, marginTop: 8, borderRadius: 10,
  },
  offlineText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.white, flex: 1 },
});
