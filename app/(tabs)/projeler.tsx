import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { Plus, Calculator, CheckCircle2, Circle, ArrowRight, Ruler, Package, WifiOff } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Project } from '@/lib/supabase';
import { BannerAd } from '@/components/BannerAd';
import { offlineSync } from '@/lib/offline-sync';

export default function ProjelerScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*, project_materials(*)')
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setProjects(data);
      await offlineSync.cacheProjects(data);
    } else {
      const cached = await offlineSync.getCachedProjects();
      setProjects(cached);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  useEffect(() => {
    const unsub = offlineSync.onConnectivityChange(online => {
      setIsOnline(online);
      if (online) fetch();
    });
    return unsub;
  }, [fetch]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Akıllı Hesaplayıcı</Text>
          <Text style={styles.title}>Projelerim</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/project-detail')}
        >
          <Plus color={Colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Calculator color={Colors.primary} size={20} />
        <Text style={styles.infoText}>
          Yeni proje oluşturun, sistem elinizdeki envanteri kontrol edip eksik malzemeleri hesaplasın.
        </Text>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff color={Colors.white} size={16} />
          <Text style={styles.offlineText}>Çevrimdışı - Önbelleğe alınmış projeler gösteriliyor</Text>
        </View>
      )}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Calculator color={Colors.neutral300} size={48} />
            <Text style={styles.emptyTitle}>Henüz proje yok</Text>
            <Text style={styles.emptyDesc}>+ butonuna basarak ilk projenizi oluşturun</Text>
          </View>
        ) : (
          projects.map((project) => {
            const materials = project.project_materials ?? [];
            const insufficient = materials.filter(m => !m.is_sufficient).length;
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => router.push({ pathname: '/project-detail', params: { id: project.id } })}
              >
                <View style={styles.projectHeader}>
                  <View style={styles.projectLeft}>
                    {project.is_completed ? (
                      <CheckCircle2 color={Colors.success} size={22} />
                    ) : (
                      <Circle color={Colors.neutral300} size={22} />
                    )}
                    <View>
                      <Text style={styles.projectName}>{project.project_name}</Text>
                      <Text style={styles.projectType}>{project.project_type}</Text>
                    </View>
                  </View>
                  <ArrowRight color={Colors.neutral300} size={18} />
                </View>
                <View style={styles.projectMeta}>
                  {project.area_m2 != null && (
                    <View style={styles.metaChip}>
                      <Ruler color={Colors.neutral500} size={14} />
                      <Text style={styles.metaText}>{project.area_m2} m²</Text>
                    </View>
                  )}
                  <View style={styles.metaChip}>
                    <Package color={Colors.neutral500} size={14} />
                    <Text style={styles.metaText}>{materials.length} malzeme</Text>
                  </View>
                  {insufficient > 0 && !project.is_completed && (
                    <View style={[styles.metaChip, styles.metaChipDanger]}>
                      <Text style={styles.metaTextDanger}>{insufficient} eksik</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
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
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  title: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.white },
  addButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, marginHorizontal: 20, marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  infoText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral600 },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.neutral700, marginHorizontal: 20, marginTop: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  offlineText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.white, flex: 1 },
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingTop: 12, paddingBottom: 100 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral500, marginTop: 12 },
  emptyDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400, marginTop: 4 },
  projectCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral800 },
  projectType: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, marginTop: 2 },
  projectMeta: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.neutral100, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  metaText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral600 },
  metaChipDanger: { backgroundColor: '#FEF2F2' },
  metaTextDanger: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.danger },
});
