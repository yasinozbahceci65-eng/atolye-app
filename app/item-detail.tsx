import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, ScanLine, AlertTriangle, Save } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Item, Category, UnitType } from '@/lib/supabase';

const UNITS: UnitType[] = ['Litre', 'Adet', 'Metre', 'Kg', 'Kutu', 'm²'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [maxQuantity, setMaxQuantity] = useState('100');
  const [unitType, setUnitType] = useState<UnitType>('Adet');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [criticalLevel, setCriticalLevel] = useState('10');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [notes, setNotes] = useState('');

  const fetch = useCallback(async () => {
    const [itemRes, catRes] = await Promise.all([
      supabase.from('items').select('*, categories(*)').eq('id', id).maybeSingle(),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (itemRes.data) {
      const it = itemRes.data;
      setItem(it);
      setName(it.name);
      setQuantity(String(it.quantity));
      setMaxQuantity(String(it.max_quantity));
      setUnitType(it.unit_type);
      setCategoryId(it.category_id);
      setCriticalLevel(String(it.critical_level));
      setBarcodeValue(it.barcode_value || '');
      setNotes(it.notes || '');
    }
    setCategories(catRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const adjustQty = (delta: number) => {
    const newQty = Math.max(0, parseFloat(quantity || '0') + delta);
    setQuantity(String(newQty));
  };

  const save = async () => {
    if (!item) return;
    setSaving(true);
    const { error } = await supabase
      .from('items')
      .update({
        name,
        quantity: parseFloat(quantity) || 0,
        max_quantity: parseFloat(maxQuantity) || 100,
        unit_type: unitType,
        category_id: categoryId,
        critical_level: parseFloat(criticalLevel) || 10,
        barcode_value: barcodeValue || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);
    setSaving(false);
    if (error) Alert.alert('Hata', error.message);
    else router.back();
  };

  const remove = () => {
    Alert.alert('Sil', 'Bu malzemeyi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await supabase.from('items').delete().eq('id', item!.id);
          router.back();
        }
      }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!item) return <View style={styles.center}><Text style={styles.emptyText}>Malzeme bulunamadı</Text></View>;

  const isCritical = (parseFloat(quantity) || 0) <= (parseFloat(criticalLevel) || 0);
  const progress = (parseFloat(maxQuantity) || 0) > 0 ? Math.min(100, (parseFloat(quantity) / parseFloat(maxQuantity)) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Malzeme Detayı</Text>
        <TouchableOpacity onPress={remove} style={styles.backBtn}>
          <Trash2 color={Colors.dangerLight} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quickAdjustCard}>
          <Text style={styles.quickAdjustLabel}>Hızlı Miktar Ayarı</Text>
          <View style={styles.quickAdjustRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(-1)}>
              <Minus color={Colors.danger} size={24} />
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <Text style={styles.qtyUnit}>{unitType}</Text>
            </View>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPlus]} onPress={() => adjustQty(1)}>
              <Plus color={Colors.accent} size={24} />
            </TouchableOpacity>
          </View>
          {isCritical && (
            <View style={styles.criticalRow}>
              <AlertTriangle color={Colors.danger} size={14} />
              <Text style={styles.criticalText}>Kritik seviyenin altında!</Text>
            </View>
          )}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: isCritical ? Colors.danger : Colors.accent }]} />
          </View>
        </View>

        <Text style={styles.label}>Malzeme Adı</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Malzeme adı" />

        <Text style={styles.label}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.catChip, !categoryId && styles.catChipActive]}
            onPress={() => setCategoryId(null)}
          >
            <Text style={[styles.catChipText, !categoryId && styles.catChipTextActive]}>Kategorisiz</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              <View style={[styles.catChipDot, { backgroundColor: c.color }]} />
              <Text style={[styles.catChipText, categoryId === c.id && styles.catChipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Birim Tipi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {UNITS.map(u => (
            <TouchableOpacity
              key={u}
              style={[styles.catChip, unitType === u && styles.catChipActive]}
              onPress={() => setUnitType(u)}
            >
              <Text style={[styles.catChipText, unitType === u && styles.catChipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Mevcut Miktar</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Maksimum Miktar</Text>
            <TextInput style={styles.input} value={maxQuantity} onChangeText={setMaxQuantity} keyboardType="numeric" />
          </View>
        </View>

        <Text style={styles.label}>Kritik Seviye</Text>
        <TextInput style={styles.input} value={criticalLevel} onChangeText={setCriticalLevel} keyboardType="numeric" />

        <Text style={styles.label}>Barkod / QR</Text>
        <View style={styles.barcodeRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={barcodeValue} onChangeText={setBarcodeValue} placeholder="Barkod değeri" />
          <TouchableOpacity style={styles.scanIconBtn} onPress={() => router.push({ pathname: '/scanner', params: { itemId: item.id } })}>
            <ScanLine color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notlar</Text>
        <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Eklemek istediğiniz notlar..." multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <>
            <Save color={Colors.white} size={20} />
            <Text style={styles.saveBtnText}>Kaydet</Text>
          </>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral500 },
  quickAdjustCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickAdjustLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral500, marginBottom: 12 },
  quickAdjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  qtyBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnPlus: { backgroundColor: '#DCFCE7' },
  qtyDisplay: { alignItems: 'center' },
  qtyValue: { fontFamily: 'Inter-Bold', fontSize: 32, color: Colors.neutral800 },
  qtyUnit: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral400, marginTop: 2 },
  criticalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 10 },
  criticalText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.danger },
  progressBg: { height: 8, backgroundColor: Colors.neutral100, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  categoryScroll: { maxHeight: 44, marginVertical: 0 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.neutral200, marginRight: 8,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipDot: { width: 8, height: 8, borderRadius: 4 },
  catChipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral600 },
  catChipTextActive: { color: Colors.white },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  barcodeRow: { flexDirection: 'row', gap: 10 },
  scanIconBtn: {
    width: 48, backgroundColor: Colors.primary, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
  },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
});
