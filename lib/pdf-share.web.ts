import { Share, Platform } from 'react-native';

export async function shareWhatsAppSummary(msg: string): Promise<void> {
  try {
    await Share.share({ message: msg });
  } catch {}
}

export async function generatePdfQuote(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
