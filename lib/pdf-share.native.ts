import { Share, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function shareWhatsAppSummary(msg: string): Promise<void> {
  try {
    await Share.share({ message: msg });
  } catch {}
}

export async function generatePdfQuote(html: string): Promise<void> {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Teklif PDF' });
    } else {
      Alert.alert('Bilgi', 'PDF oluşturuldu: ' + uri);
    }
  } catch (e: any) {
    Alert.alert('Hata', 'PDF oluşturulamadı: ' + (e?.message ?? 'Bilinmeyen hata'));
  }
}
