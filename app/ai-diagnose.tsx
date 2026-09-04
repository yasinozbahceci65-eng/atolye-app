import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { ArrowLeft, Camera, Image as ImageIcon, Sparkles, Crown, X } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { usePro } from '@/lib/pro-context';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Read file as base64 - works on both native platforms
async function fileToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    return base64;
  } catch {
    return '';
  }
}

export default function AiDiagnoseScreen() {
  const router = useRouter();
  const { isPro } = usePro();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin gerekli', 'Kamera izni verin'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 ?? null);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin gerekli', 'Galeri izni verin'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 ?? null);
    }
  }, []);

  const analyze = async () => {
    if (!photo) { Alert.alert('Uyarı', 'Lütfen önce fotoğraf yükleyin'); return; }
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let base64Data = photoBase64;

      // If base64 wasn't returned by the picker, read from file system
      if (!base64Data && photo) {
        base64Data = await fileToBase64(photo);
      }

      const { data, error: fnError } = await supabase.functions.invoke('ai-diagnose', {
        body: JSON.stringify({ description, photoBase64: base64Data }),
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResult(data.diagnosis || 'Teşhis yapılamadı. Lütfen tekrar deneyin.');
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yapay Zeka Teşhisi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.lockedBody}>
          <View style={styles.lockedIcon}>
            <Crown color={Colors.proGold} size={48} />
          </View>
          <Text style={styles.lockedTitle}>Pro Özellik</Text>
          <Text style={styles.lockedDesc}>
            Yapay zeka teşhisi Pro üyelik gerektirir. Sorunlu bölgenin fotoğrafını yükleyin, yapay zeka size gerekli işlemi söylesin.
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/pro-upgrade')}>
            <Crown color={Colors.white} size={20} />
            <Text style={styles.upgradeBtnText}>Pro'ya Yükselt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yapay Zeka Teşhisi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.aiCard}>
          <View style={styles.aiIcon}>
            <Sparkles color={Colors.proGold} size={28} />
          </View>
          <View style={styles.aiBody}>
            <Text style={styles.aiTitle}>AI Teşhis</Text>
            <Text style={styles.aiDesc}>Sorunlu bölgenin fotoğrafını yükleyin, yapay zeka fotoğrafı analiz ederek gerekli işlemi söylesin.</Text>
          </View>
        </View>

        <Text style={styles.label}>Fotoğraf Yükle</Text>
        {photo ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo }} style={styles.photoImage} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => { setPhoto(null); setPhotoBase64(null); setResult(null); setError(null); }}>
              <X color={Colors.white} size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Camera color={Colors.primary} size={24} />
              <Text style={styles.photoBtnText}>Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
              <ImageIcon color={Colors.primary} size={24} />
              <Text style={styles.photoBtnText}>Galeri</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Ek Açıklama (opsiyonel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Sorunla ilgili ek detaylar... (Örn: duvarda boya kabarması, su sızıntısı, çatlak)"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.analyzeBtn} onPress={analyze} disabled={analyzing || !photo}>
          {analyzing ? <>
            <ActivityIndicator color={Colors.white} />
            <Text style={styles.analyzeBtnText}>Analiz ediliyor...</Text>
          </> : <>
            <Sparkles color={Colors.white} size={20} />
            <Text style={styles.analyzeBtnText}>Teşhis Et</Text>
          </>}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={analyze} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Sparkles color={Colors.proGold} size={20} />
              <Text style={styles.resultTitle}>Teşhis Raporu</Text>
            </View>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
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
  lockedBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  lockedIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.proGoldLight, justifyContent: 'center', alignItems: 'center' },
  lockedTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.neutral800, marginTop: 20 },
  lockedDesc: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral500, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  upgradeBtn: { flexDirection: 'row', backgroundColor: Colors.proGold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', gap: 8, marginTop: 24 },
  upgradeBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },
  aiCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: Colors.proGoldLight,
  },
  aiIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.proGoldLight, justifyContent: 'center', alignItems: 'center' },
  aiBody: { flex: 1, marginLeft: 14 },
  aiTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral800 },
  aiDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral500, marginTop: 4, lineHeight: 18 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600, marginBottom: 8, marginTop: 16 },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 24,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.neutral200, borderStyle: 'dashed',
  },
  photoBtnText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral600 },
  photoPreview: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  photoImage: { width: '100%', height: 200, borderRadius: 14 },
  photoRemove: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  analyzeBtn: {
    flexDirection: 'row', backgroundColor: Colors.proGold, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
  },
  analyzeBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  errorCard: {
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: Colors.dangerLight,
  },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.danger, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.danger, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  retryBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: Colors.proGoldLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral800 },
  resultText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral700, lineHeight: 22 },
});
