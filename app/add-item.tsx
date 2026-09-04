import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ScanLine, Save, Camera } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Category, UnitType } from '@/lib/supabase';

const UNITS: UnitType[] = ['Litre', 'Adet', 'Metre', 'Kg', 'Kutu', 'm²'];

export default function AddItemScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [maxQuantity, setMaxQuantity] = useState('100');
  const [unitType, setUnitType] = useState<UnitType>('Adet');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [criticalLevel, setCriticalLevel] = useState('10');
  const [barcodeValue, setBarcodeValue] = useState(barcode || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []));
  }, []);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Uyarı', 'Lütfen malzeme adı girin'); return; }
    setSaving(true);
    const { error } = await supabase.from('items').insert({
      name: name.trim(),
      quantity: parseFloat(quantity) || 0,
      max_quantity: parseFloat(maxQuantity) || 100,
      unit_type: unitType,
      category_id: categoryId,
      critical_level: parseFloat(criticalLevel) || 10,
      barcode_value: barcodeValue || null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) Alert.alert('Hata', error.message);
    else router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Malzeme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Malzeme Adı *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örn: Beyaz Duvar Boyası" />

        <Text style={styles.label}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity style={[styles.chip, !categoryId && styles.chipActive]} onPress={() => setCategoryId(null)}>
            <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>Kategorisiz</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              <View style={[styles.chipDot, { backgroundColor: c.color }]} />
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Birim Tipi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {UNITS.map(u => (
            <TouchableOpacity key={u} style={[styles.chip, unitType === u && styles.chipActive]} onPress={() => setUnitType(u)}>
              <Text style={[styles.chipText, unitType === u && styles.chipTextActive]}>{u}</Text>
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

        <Text style={styles.label}>Barkod / QR Kod</Text>
        <View style={styles.barcodeRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={barcodeValue} onChangeText={setBarcodeValue} placeholder="Barkod veya QR değeri" />
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scanner')}>
            <ScanLine color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notlar</Text>
        <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Eklemek istediğiniz notlar..." multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <>
            <Save color={Colors.white} size={20} />
            <Text style={styles.saveBtnText}>Malzeme Ekle</Text>
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
  label: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  chipScroll: { maxHeight: 44 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.neutral200, marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral600 },
  chipTextActive: { color: Colors.white },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  barcodeRow: { flexDirection: 'row', gap: 10 },
  scanBtn: {
    width: 48, backgroundColor: Colors.primary, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
  },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
});
