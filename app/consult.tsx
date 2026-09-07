import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { ArrowLeft, Camera, Image as ImageIcon, Send, MessageCircle, X, Crown } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { usePro } from '@/lib/pro-context';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const WHATSAPP_NUMBER = '905537743488';

export default function ConsultScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { isPro } = usePro();
  const isUsta = type === 'usta';
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Fotoğraf seçmek için kamera erişim izni verin');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Galeri erişim izni verin');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, []);

  const send = async () => {
    if (!description.trim()) { Alert.alert('Uyarı', 'Lütfen açıklama yazın'); return; }
    if (!photo) { Alert.alert('Uyarı', 'Lütfen fotoğraf yükleyin'); return; }
    setSending(true);

    const prefix = isUsta ? 'Ustaya Danışma' : 'Mimara Danışma';
    const message = `${prefix}\n\n${description}`;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Hata', 'Paylaşım bu cihazda kullanılamıyor.');
        setSending(false);
        return;
      }

      await Sharing.shareAsync(photo, {
        mimeType: 'image/jpeg',
        dialogTitle: message,
      });

      setSending(false);
      Alert.alert('Bilgi', 'Fotoğraf paylaşım ekranı açıldı. WhatsApp seçerek fotoğrafı ve açıklamayı gönderin.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      setSending(false);
      Alert.alert('Hata', 'Paylaşım açılamadı: ' + (e?.message ?? 'Bilinmeyen hata'));
    }
  };

  if (!isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isUsta ? 'Ustaya Danış' : 'Mimara Danış'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.lockedBody}>
          <View style={styles.lockedIcon}>
            <Crown color={Colors.proGold} size={48} />
          </View>
          <Text style={styles.lockedTitle}>Pro Özellik</Text>
          <Text style={styles.lockedDesc}>
            {isUsta ? 'Ustaya Danışma' : 'Mimara Danışma'} özelliği Pro üyelik gerektirir. Pro'ya yükselterek uzmanlara soru sorma ve fotoğraf gönderme özelliğini açın.
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
        <Text style={styles.headerTitle}>{isUsta ? 'Ustaya Danış' : 'Mimara Danış'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: isUsta ? '#FEF3C7' : '#DBEAFE' }]}>
            <MessageCircle color={isUsta ? Colors.secondary : Colors.primary} size={24} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>{isUsta ? 'Usta ile İletişim' : 'Mimar ile İletişim'}</Text>
            <Text style={styles.infoDesc}>
              {isUsta
                ? 'Sorunlu bölgenin fotoğrafını yükleyin, altına açıklama yazın. Gönder butonuna bastığınızda paylaşım ekranı açılır, WhatsApp seçerek fotoğrafı gönderin.'
                : 'Proje veya tasarım sorularınızı fotoğraf ekleyerek mimara iletin. Paylaşım ekranından WhatsApp ile gönderilir.'}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Fotoğraf Yükle *</Text>
        {photo ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo }} style={styles.photoImage} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
              <X color={Colors.white} size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Camera color={Colors.primary} size={24} />
              <Text style={styles.photoBtnText}>Kamera ile Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
              <ImageIcon color={Colors.primary} size={24} />
              <Text style={styles.photoBtnText}>Galeriden Seç</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Sorunuzu veya sorununuzu detaylıca açıklayın..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
          {sending ? <ActivityIndicator color={Colors.white} /> : <>
            <Send color={Colors.white} size={20} />
            <Text style={styles.sendBtnText}>Gönder</Text>
          </>}
        </TouchableOpacity>

        <Text style={styles.note}>
          Not: Gönder butonu cihazınızın paylaşım ekranını açar. WhatsApp seçerek fotoğrafı doğrudan gönderebilirsiniz.
        </Text>
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
  infoCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  infoIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoBody: { flex: 1, marginLeft: 14 },
  infoTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral800 },
  infoDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral500, marginTop: 4, lineHeight: 18 },
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
  textArea: { minHeight: 120, paddingTop: 12 },
  sendBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
  },
  sendBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  note: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral400, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  lockedBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  lockedIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.proGoldLight, justifyContent: 'center', alignItems: 'center' },
  lockedTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.neutral800, marginTop: 20 },
  lockedDesc: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral500, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  upgradeBtn: { flexDirection: 'row', backgroundColor: Colors.proGold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', gap: 8, marginTop: 24 },
  upgradeBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
});
