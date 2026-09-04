import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ScanLine, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Item } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScannerScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [matchedItem, setMatchedItem] = useState<Item | null>(null);
  const [searching, setSearching] = useState(false);

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setSearching(true);
    const { data: item } = await supabase
      .from('items')
      .select('*, categories(*)')
      .eq('barcode_value', data)
      .maybeSingle();
    setSearching(false);
    if (item) {
      setMatchedItem(item);
    } else {
      Alert.alert(
        'Eşleşme Yok',
        'Bu barkod ile kayıtlı malzeme bulunamadı. Yeni malzeme olarak eklemek ister misiniz?',
        [
          { text: 'İptal', style: 'cancel', onPress: () => { setScanned(false); } },
          { text: 'Yeni Ekle', onPress: () => router.replace({ pathname: '/add-item', params: { barcode: data } }) },
        ]
      );
    }
  };

  const adjustQty = async (delta: number) => {
    if (!matchedItem) return;
    const newQty = Math.max(0, matchedItem.quantity + delta);
    const { data } = await supabase
      .from('items')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', matchedItem.id)
      .select()
      .single();
    if (data) setMatchedItem({ ...matchedItem, quantity: newQty });
  };

  const goToDetail = () => {
    if (matchedItem) router.replace({ pathname: '/item-detail', params: { id: matchedItem.id } });
  };

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Kamera izni gerekli</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X color={Colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barkod / QR Tarayıcı</Text>
        <View style={{ width: 40 }} />
      </View>

      {!scanned && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleScan}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <View style={styles.scanCornerTL} />
              <View style={styles.scanCornerTR} />
              <View style={styles.scanCornerBL} />
              <View style={styles.scanCornerBR} />
            </View>
            <Text style={styles.scanHint}>Barkodu veya QR kodu çerçeve içine getirin</Text>
          </View>
        </View>
      )}

      {scanned && (
        <View style={styles.resultContainer}>
          {searching ? (
            <View style={styles.resultCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.resultSearching}>Aranıyor...</Text>
            </View>
          ) : matchedItem ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <CheckCircle2 color={Colors.success} size={32} />
                <Text style={styles.resultTitle}>Malzeme Bulundu!</Text>
              </View>
              <Text style={styles.resultName}>{matchedItem.name}</Text>
              <Text style={styles.resultCategory}>{matchedItem.categories?.name || 'Kategorisiz'}</Text>
              <View style={styles.resultQtyRow}>
                <Text style={styles.resultQtyLabel}>Mevcut Miktar:</Text>
                <Text style={styles.resultQtyValue}>{matchedItem.quantity} {matchedItem.unit_type}</Text>
              </View>
              <View style={styles.resultActions}>
                <TouchableOpacity style={[styles.resultBtn, styles.resultBtnMinus]} onPress={() => adjustQty(-1)}>
                  <Text style={styles.resultBtnMinusText}>- 1 Azalt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resultBtn, styles.resultBtnPlus]} onPress={() => adjustQty(1)}>
                  <Text style={styles.resultBtnPlusText}>+ 1 Artır</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.detailBtn} onPress={goToDetail}>
                <Text style={styles.detailBtnText}>Detay Sayfasına Git</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setScanned(false); setMatchedItem(null); }}>
                <Text style={styles.scanAgainText}>Tekrar Tara</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral900 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.neutral900,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.neutral900 },
  permissionText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.white, marginBottom: 16 },
  permissionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permissionBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.white },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.white, borderTopLeftRadius: 12 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderColor: Colors.white, borderTopRightRadius: 12 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: Colors.white, borderBottomLeftRadius: 12 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderColor: Colors.white, borderBottomRightRadius: 12 },
  scanHint: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 24, textAlign: 'center' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  resultCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  resultTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.neutral800 },
  resultName: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral800, textAlign: 'center' },
  resultCategory: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400, marginTop: 4 },
  resultQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  resultQtyLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral600 },
  resultQtyValue: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.primary },
  resultActions: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  resultBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  resultBtnMinus: { backgroundColor: '#FEF2F2' },
  resultBtnPlus: { backgroundColor: '#DCFCE7' },
  resultBtnMinusText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.danger },
  resultBtnPlusText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.success },
  detailBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, width: '100%', alignItems: 'center' },
  detailBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  scanAgainBtn: { marginTop: 12, paddingVertical: 12 },
  scanAgainText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral400 },
  resultSearching: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral500, marginTop: 16 },
});
