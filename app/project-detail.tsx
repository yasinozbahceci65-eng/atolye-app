import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Calculator, CheckCircle2, XCircle, ShoppingCart, Ruler, Plus, Trash2, Package, FileText, Send, Layers, WifiOff } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Item, Project, ProjectMaterial, UnitType } from '@/lib/supabase';
import { useProfile } from '@/lib/profile-context';
import { shareWhatsAppSummary, generatePdfQuote as exportPdfQuote } from '@/lib/pdf-share';
import { offlineSync } from '@/lib/offline-sync';

interface TradeTemplate {
  label: string;
  icon: string;
  materials: { name: string; coveragePerUnit: number; unit: UnitType; materialName: string }[];
  areaLabel: string;
  hasCoats: boolean;
}

const TRADE_TEMPLATES: TradeTemplate[] = [
  {
    label: 'Boyama',
    icon: 'paint',
    areaLabel: 'Boyama Alanı (m²)',
    hasCoats: true,
    materials: [
      { name: 'Boya', coveragePerUnit: 7, unit: 'Litre', materialName: 'Boya' },
    ],
  },
  {
    label: 'Fayans/Bahçe',
    icon: 'tile',
    areaLabel: 'Döşeme Alanı (m²)',
    hasCoats: false,
    materials: [
      { name: 'Fayans', coveragePerUnit: 1, unit: 'm²', materialName: 'Fayans' },
      { name: 'Harç', coveragePerUnit: 5, unit: 'Kg', materialName: 'Harç' },
    ],
  },
  {
    label: 'Seramik',
    icon: 'ceramic',
    areaLabel: 'Seramik Alanı (m²)',
    hasCoats: false,
    materials: [
      { name: 'Seramik', coveragePerUnit: 1, unit: 'm²', materialName: 'Seramik' },
      { name: 'Harç', coveragePerUnit: 5, unit: 'Kg', materialName: 'Harç' },
    ],
  },
  {
    label: 'Laminat Parke',
    icon: 'parquet',
    areaLabel: 'Parke Alanı (m²)',
    hasCoats: false,
    materials: [
      { name: 'Laminat', coveragePerUnit: 1, unit: 'm²', materialName: 'Laminat' },
      { name: 'Altlık', coveragePerUnit: 1, unit: 'm²', materialName: 'Altlık' },
    ],
  },
  {
    label: 'Tesisat',
    icon: 'pipe',
    areaLabel: 'Boru Uzunluğu (metre)',
    hasCoats: false,
    materials: [
      { name: 'Boru', coveragePerUnit: 1, unit: 'Metre', materialName: 'Boru' },
      { name: 'Dirsek', coveragePerUnit: 0.3, unit: 'Adet', materialName: 'Dirsek' },
      { name: 'Tee', coveragePerUnit: 0.2, unit: 'Adet', materialName: 'Tee' },
      { name: 'Vana', coveragePerUnit: 0.1, unit: 'Adet', materialName: 'Vana' },
    ],
  },
  {
    label: 'Alçıpan',
    icon: 'drywall',
    areaLabel: 'Duvar/Tavan Alanı (m²)',
    hasCoats: false,
    materials: [
      { name: 'Alçıpan Levha', coveragePerUnit: 1, unit: 'm²', materialName: 'Alçıpan Levha' },
      { name: 'Profil (CD)', coveragePerUnit: 2.5, unit: 'Metre', materialName: 'Profil CD' },
      { name: 'Profil (UD)', coveragePerUnit: 0.8, unit: 'Metre', materialName: 'Profil UD' },
      { name: 'Vida', coveragePerUnit: 12, unit: 'Adet', materialName: 'Vida' },
      { name: 'Alçı', coveragePerUnit: 0.5, unit: 'Kg', materialName: 'Alçı' },
    ],
  },
  {
    label: 'Marangoz',
    icon: 'wood',
    areaLabel: 'Çalışma Alanı (m²)',
    hasCoats: false,
    materials: [
      { name: 'Sunta/MDF Levha', coveragePerUnit: 1, unit: 'm²', materialName: 'Sunta/MDF' },
      { name: 'Ahşap Kiriş', coveragePerUnit: 1.5, unit: 'Metre', materialName: 'Kiriş' },
      { name: 'Vida', coveragePerUnit: 10, unit: 'Adet', materialName: 'Vida' },
      { name: 'Yapıştırcı', coveragePerUnit: 0.1, unit: 'Litre', materialName: 'Yapıştırcı' },
    ],
  },
];

const UNITS: UnitType[] = ['Litre', 'Adet', 'Metre', 'Kg', 'Kutu', 'm²'];

const COAT_OPTIONS = [1, 2, 3, 4];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Boyama');
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState(2);
  const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [customUnit, setCustomUnit] = useState<UnitType>('Adet');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const fetch = useCallback(async () => {
    const itemsRes = await supabase.from('items').select('*, categories(*)').order('name');
    setItems(itemsRes.data ?? []);
    if (id) {
      const { data: proj } = await supabase
        .from('projects')
        .select('*, project_materials(*)')
        .eq('id', id)
        .maybeSingle();
      if (proj) {
        setProject(proj);
        setProjectName(proj.project_name);
        setProjectType(proj.project_type);
        setArea(proj.area_m2 ? String(proj.area_m2) : '');
        setMaterials(proj.project_materials ?? []);
        if (proj.project_materials && proj.project_materials.length > 0) setCalculated(true);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const unsub = offlineSync.onConnectivityChange(online => setIsOnline(online));
    return unsub;
  }, []);

  const calculate = () => {
    const areaNum = parseFloat(area);
    if (!areaNum || areaNum <= 0) { Alert.alert('Uyarı', 'Lütfen geçerli bir alan girin'); return; }
    const template = TRADE_TEMPLATES.find(t => t.label === projectType)!;
    const coatMultiplier = template.hasCoats ? coats : 1;

    const newMaterials: ProjectMaterial[] = template.materials.map((mat, idx) => {
      const required = Math.ceil((areaNum / mat.coveragePerUnit) * coatMultiplier * 10) / 10;
      const matchedItem = items.find(i =>
        i.name.toLowerCase().includes(mat.materialName.toLowerCase()) &&
        i.unit_type === mat.unit
      );
      const isSufficient = matchedItem ? matchedItem.quantity >= required : false;
      return {
        id: 'temp-' + Date.now() + '-' + idx,
        project_id: project?.id || '',
        item_id: matchedItem?.id || null,
        material_name: matchedItem?.name || `${mat.materialName} (${mat.unit})`,
        required_quantity: required,
        unit_type: mat.unit,
        is_sufficient: isSufficient,
      };
    });
    setMaterials(newMaterials);
    setCalculated(true);
  };

  const addManualMaterial = () => {
    if (!customName.trim() || !customQty.trim()) {
      Alert.alert('Uyarı', 'Malzeme adı ve miktar girin');
      return;
    }
    const qty = parseFloat(customQty);
    if (isNaN(qty) || qty <= 0) { Alert.alert('Uyarı', 'Geçerli miktar girin'); return; }

    let matchedItem: Item | undefined;
    let isSufficient = false;
    let materialName = customName.trim();

    if (selectedItemId) {
      matchedItem = items.find(i => i.id === selectedItemId);
      if (matchedItem) {
        materialName = matchedItem.name;
        isSufficient = matchedItem.quantity >= qty;
      }
    }

    const newMaterial: ProjectMaterial = {
      id: 'temp-' + Date.now(),
      project_id: project?.id || '',
      item_id: matchedItem?.id || null,
      material_name: materialName,
      required_quantity: qty,
      unit_type: customUnit,
      is_sufficient: isSufficient,
    };
    setMaterials([...materials, newMaterial]);
    setCustomName('');
    setCustomQty('');
    setSelectedItemId(null);
    setCustomUnit('Adet');
    setShowAddMaterial(false);
  };

  const removeMaterial = (idx: number) => {
    setMaterials(materials.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!projectName.trim()) { Alert.alert('Uyarı', 'Lütfen proje adı girin'); return; }
    setSaving(true);
    const projectData = {
      project_name: projectName.trim(),
      project_type: projectType,
      area_m2: parseFloat(area) || null,
      is_completed: false,
    };
    try {
      let projectId = project?.id;
      if (projectId) {
        await supabase.from('projects').update(projectData).eq('id', projectId);
        await supabase.from('project_materials').delete().eq('project_id', projectId);
      } else {
        const { data: newProj } = await supabase.from('projects').insert(projectData).select().single();
        projectId = newProj?.id;
      }
      if (projectId && materials.length > 0) {
        await supabase.from('project_materials').insert(
          materials.map(m => ({
            project_id: projectId,
            item_id: m.item_id,
            material_name: m.material_name,
            required_quantity: m.required_quantity,
            unit_type: m.unit_type,
            is_sufficient: m.is_sufficient,
          }))
        );
      }
    } catch {
      if (!isOnline) {
        await offlineSync.addPendingChange({
          table: 'projects',
          operation: project?.id ? 'update' : 'insert',
          recordId: project?.id ?? 'temp-' + Date.now(),
          data: { ...projectData, materials },
        });
        Alert.alert('Çevrimdışı Kaydedildi', 'İnternet bağlantısı geldiğinde senkronize edilecek.');
      } else {
        Alert.alert('Hata', 'Proje kaydedilemedi.');
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    router.back();
  };

  const generateWhatsAppSummary = async () => {
    if (materials.length === 0) { Alert.alert('Uyarı', 'Önce hesaplama yapın'); return; }
    const areaNum = parseFloat(area) || 0;
    const coatInfo = TRADE_TEMPLATES.find(t => t.label === projectType)?.hasCoats ? ` (${coats} kat)` : '';
    const insufficient = materials.filter(m => !m.is_sufficient);
    const userName = profile?.name ?? 'Atölye Kullanıcısı';

    let msg = `📋 *MALİYET TEKLİFİ*\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `👤 ${userName}\n`;
    msg += `🏠 ${projectName || 'Proje'}\n`;
    msg += `🔨 ${projectType}${coatInfo}\n`;
    msg += `📐 ${areaNum} m²\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `🧰 *GEREKLİ MALZEMELER:*\n`;
    materials.forEach((m, i) => {
      const matchedItem = items.find(it => it.id === m.item_id);
      const available = matchedItem?.quantity ?? 0;
      const status = m.is_sufficient ? '✅' : '❌';
      msg += `${i + 1}. ${m.material_name}: ${m.required_quantity} ${m.unit_type} ${status}\n`;
      if (!m.is_sufficient) {
        msg += `   ⚠️ Eksik: ${Math.max(0, m.required_quantity - available)} ${m.unit_type}\n`;
      }
    });
    if (insufficient.length > 0) {
      msg += `━━━━━━━━━━━━━━━\n`;
      msg += `🛒 *ALIŞVERİŞ LİSTESİ:*\n`;
      insufficient.forEach(m => {
        const matchedItem = items.find(it => it.id === m.item_id);
        const remaining = Math.max(0, m.required_quantity - (matchedItem?.quantity ?? 0));
        msg += `• ${m.material_name}: ${remaining} ${m.unit_type}\n`;
      });
    }
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `📱 Atölye Uygulaması ile oluşturuldu`;

    await shareWhatsAppSummary(msg);
  };

  const generatePdfQuote = async () => {
    if (materials.length === 0) { Alert.alert('Uyarı', 'Önce hesaplama yapın'); return; }
    setGeneratingPdf(true);
    try {
      const areaNum = parseFloat(area) || 0;
      const coatInfo = TRADE_TEMPLATES.find(t => t.label === projectType)?.hasCoats ? ` (${coats} Kat)` : '';
      const userName = profile?.name ?? 'Atölye Kullanıcısı';
      const userPhone = profile?.phone ?? '';
      const date = new Date().toLocaleDateString('tr-TR');
      const insufficient = materials.filter(m => !m.is_sufficient);

      let materialRows = '';
      materials.forEach((m, i) => {
        const matchedItem = items.find(it => it.id === m.item_id);
        const available = matchedItem?.quantity ?? 0;
        const remaining = Math.max(0, m.required_quantity - available);
        const status = m.is_sufficient
          ? '<span style="color:#22C55E;font-weight:bold;">Yeterli</span>'
          : `<span style="color:#EF4444;font-weight:bold;">${remaining} ${m.unit_type} eksik</span>`;
        materialRows += `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;">${i + 1}</td>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;font-weight:600;">${m.material_name}</td>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:center;">${m.required_quantity} ${m.unit_type}</td>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:center;">${available} ${m.unit_type}</td>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:center;">${status}</td>
          </tr>`;
      });

      let shoppingRows = '';
      if (insufficient.length > 0) {
        shoppingRows = `
          <h3 style="color:#F59E0B;margin-top:24px;">Alisveris Listesi</h3>
          <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            <thead>
              <tr style="background:#FFFBEB;">
                <th style="padding:10px;text-align:left;border-bottom:2px solid #F59E0B;">Malzeme</th>
                <th style="padding:10px;text-align:center;border-bottom:2px solid #F59E0B;">Eksik Miktar</th>
              </tr>
            </thead>
            <tbody>
              ${insufficient.map(m => {
                const matchedItem = items.find(it => it.id === m.item_id);
                const remaining = Math.max(0, m.required_quantity - (matchedItem?.quantity ?? 0));
                return `<tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;">${m.material_name}</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:center;color:#EF4444;font-weight:600;">${remaining} ${m.unit_type}</td></tr>`;
              }).join('')}
            </tbody>
          </table>`;
      }

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          body { margin: 0; padding: 40px; color: #1E293B; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1A6B8A; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #1A6B8A; }
          .subtitle { font-size: 12px; color: #94A3B8; margin-top: 4px; }
          .info-block { text-align: right; font-size: 13px; color: #64748B; }
          .info-block strong { color: #1E293B; }
          h2 { color: #1A6B8A; margin-top: 32px; }
          .project-info { background: #F8FAFC; border-radius: 12px; padding: 20px; margin-top: 16px; }
          .project-info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .project-info-label { color: #64748B; }
          .project-info-value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #1A6B8A; color: #fff; padding: 12px 10px; text-align: left; font-size: 13px; }
          td { font-size: 13px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Atolye Pro</div>
            <div class="subtitle">Malzeme & Maliyet Teklifi</div>
          </div>
          <div class="info-block">
            <div><strong>${date}</strong></div>
          </div>
        </div>

        <h2>Proje Bilgileri</h2>
        <div class="project-info">
          <div class="project-info-row"><span class="project-info-label">Hazirlayan:</span><span class="project-info-value">${userName}</span></div>
          ${userPhone ? `<div class="project-info-row"><span class="project-info-label">Telefon:</span><span class="project-info-value">${userPhone}</span></div>` : ''}
          <div class="project-info-row"><span class="project-info-label">Proje Adi:</span><span class="project-info-value">${projectName || '-'}</span></div>
          <div class="project-info-row"><span class="project-info-label">Proje Tipi:</span><span class="project-info-value">${projectType}${coatInfo}</span></div>
          <div class="project-info-row"><span class="project-info-label">Alan:</span><span class="project-info-value">${areaNum} m2</span></div>
        </div>

        <h2>Gerekli Malzemeler</h2>
        <table>
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>Malzeme</th>
              <th style="text-align:center;">Gerekli</th>
              <th style="text-align:center;">Mevcut</th>
              <th style="text-align:center;">Durum</th>
            </tr>
          </thead>
          <tbody>${materialRows}</tbody>
        </table>

        ${shoppingRows}

        <div class="footer">
          Bu teklif Atolye Pro uygulamas tarafindan otomatik olusturulmustur.<br/>
          ${date} - ${userName}
        </div>
      </body>
      </html>`;

      await exportPdfQuote(html);
    } catch (e: any) {
      Alert.alert('Hata', 'PDF olusturulamadi: ' + (e?.message ?? 'Bilinmeyen hata'));
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const insufficientCount = materials.filter(m => !m.is_sufficient).length;
  const currentTemplate = TRADE_TEMPLATES.find(t => t.label === projectType);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id ? 'Proje Detayı' : 'Yeni Proje'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Proje Adı *</Text>
        <TextInput style={styles.input} value={projectName} onChangeText={setProjectName} placeholder="Örn: Salon Boyama" />

        <Text style={styles.label}>Branş / Proje Tipi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {TRADE_TEMPLATES.map(t => (
            <TouchableOpacity
              key={t.label}
              style={[styles.chip, projectType === t.label && styles.chipActive]}
              onPress={() => { setProjectType(t.label); setCalculated(false); setMaterials([]); }}
            >
              <Text style={[styles.chipText, projectType === t.label && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{currentTemplate?.areaLabel ?? 'Alan (m²)'}</Text>
        <View style={styles.areaRow}>
          <View style={styles.areaInputWrap}>
            <Ruler color={Colors.neutral400} size={20} style={styles.areaIcon} />
            <TextInput style={styles.areaInput} value={area} onChangeText={setArea} keyboardType="numeric" placeholder="Örn: 35" />
            <Text style={styles.areaUnit}>{currentTemplate?.areaLabel.includes('metre') ? 'm' : 'm²'}</Text>
          </View>
          <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
            <Calculator color={Colors.white} size={20} />
            <Text style={styles.calcBtnText}>Hesapla</Text>
          </TouchableOpacity>
        </View>

        {currentTemplate?.hasCoats && (
          <View style={styles.coatsContainer}>
            <View style={styles.coatsLabelRow}>
              <Layers color={Colors.primary} size={18} />
              <Text style={styles.coatsLabel}>Kat Sayısı</Text>
            </View>
            <View style={styles.coatsRow}>
              {COAT_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.coatChip, coats === c && styles.coatChipActive]}
                  onPress={() => { setCoats(c); setCalculated(false); }}
                >
                  <Text style={[styles.coatChipText, coats === c && styles.coatChipTextActive]}>{c} Kat</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {calculated && materials.length > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Hesaplama Sonucu</Text>
              {insufficientCount === 0 ? (
                <View style={styles.resultBadgeOk}>
                  <CheckCircle2 color={Colors.success} size={16} />
                  <Text style={styles.resultBadgeOkText}>Yeterli</Text>
                </View>
              ) : (
                <View style={styles.resultBadgeFail}>
                  <XCircle color={Colors.danger} size={16} />
                  <Text style={styles.resultBadgeFailText}>{insufficientCount} Eksik</Text>
                </View>
              )}
            </View>

            {materials.map((m, idx) => {
              const matchedItem = items.find(i => i.id === m.item_id);
              const available = matchedItem?.quantity ?? 0;
              const remaining = Math.max(0, m.required_quantity - available);
              return (
                <View key={idx} style={styles.materialRow}>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{m.material_name}</Text>
                    <Text style={styles.materialDetail}>Gerekli: {m.required_quantity} {m.unit_type}</Text>
                    <Text style={styles.materialDetail}>Mevcut: {available} {m.unit_type}</Text>
                    {!m.is_sufficient && (
                      <Text style={styles.materialMissing}>Eksik: {remaining} {m.unit_type}</Text>
                    )}
                  </View>
                  <View style={styles.materialRight}>
                    {m.is_sufficient ? (
                      <View style={styles.sufficientTag}>
                        <CheckCircle2 color={Colors.success} size={14} />
                        <Text style={styles.sufficientText}>Yeterli</Text>
                      </View>
                    ) : (
                      <View style={styles.insufficientTag}>
                        <Text style={styles.insufficientText}>{remaining} {m.unit_type} eksik</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeMaterial(idx)}>
                      <Trash2 color={Colors.danger} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {insufficientCount > 0 && (
              <View style={styles.shoppingListCard}>
                <View style={styles.shoppingListHeader}>
                  <ShoppingCart color={Colors.secondary} size={18} />
                  <Text style={styles.shoppingListTitle}>Alışveriş Listesi</Text>
                </View>
                {materials.filter(m => !m.is_sufficient).map((m, idx) => {
                  const matchedItem = items.find(i => i.id === m.item_id);
                  const remaining = Math.max(0, m.required_quantity - (matchedItem?.quantity ?? 0));
                  return (
                    <View key={idx} style={styles.shoppingItem}>
                      <Text style={styles.shoppingItemText}>- {m.material_name}: {remaining} {m.unit_type}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Share buttons */}
            <View style={styles.shareRow}>
              <TouchableOpacity style={styles.pdfBtn} onPress={generatePdfQuote} disabled={generatingPdf}>
                {generatingPdf ? <ActivityIndicator color={Colors.white} size="small" /> : <>
                  <FileText color={Colors.white} size={18} />
                  <Text style={styles.pdfBtnText}>PDF Teklif</Text>
                </>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.whatsappBtn} onPress={generateWhatsAppSummary}>
                <Send color={Colors.white} size={18} />
                <Text style={styles.whatsappBtnText}>WhatsApp Özeti</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.addMaterialBtn} onPress={() => setShowAddMaterial(!showAddMaterial)}>
          <Plus color={Colors.primary} size={20} />
          <Text style={styles.addMaterialBtnText}>Manuel Malzeme Ekle</Text>
        </TouchableOpacity>

        {showAddMaterial && (
          <View style={styles.addMaterialCard}>
            <Text style={styles.subLabel}>Envanterden Seç (opsiyonel)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll}>
              <TouchableOpacity
                style={[styles.itemChip, !selectedItemId && styles.itemChipActive]}
                onPress={() => setSelectedItemId(null)}
              >
                <Text style={[styles.itemChipText, !selectedItemId && styles.itemChipTextActive]}>Yok</Text>
              </TouchableOpacity>
              {items.map(i => (
                <TouchableOpacity
                  key={i.id}
                  style={[styles.itemChip, selectedItemId === i.id && styles.itemChipActive]}
                  onPress={() => { setSelectedItemId(i.id); setCustomName(i.name); setCustomUnit(i.unit_type); }}
                >
                  <Text style={[styles.itemChipText, selectedItemId === i.id && styles.itemChipTextActive]}>{i.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.subLabel}>Malzeme Adı</Text>
            <TextInput style={styles.input} value={customName} onChangeText={setCustomName} placeholder="Malzeme adı" />

            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.subLabel}>Gerekli Miktar</Text>
                <TextInput style={styles.input} value={customQty} onChangeText={setCustomQty} keyboardType="numeric" placeholder="0" />
              </View>
              <View style={styles.col}>
                <Text style={styles.subLabel}>Birim</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {UNITS.map(u => (
                    <TouchableOpacity key={u} style={[styles.chip, customUnit === u && styles.chipActive]} onPress={() => setCustomUnit(u)}>
                      <Text style={[styles.chipText, customUnit === u && styles.chipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.addConfirmBtn} onPress={addManualMaterial}>
              <CheckCircle2 color={Colors.white} size={18} />
              <Text style={styles.addConfirmBtnText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <>
            <Save color={Colors.white} size={20} />
            <Text style={styles.saveBtnText}>Projeyi Kaydet</Text>
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
  label: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600, marginBottom: 8, marginTop: 16 },
  subLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral500, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  chipScroll: { maxHeight: 44 },
  chip: {
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.neutral200, marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral600 },
  chipTextActive: { color: Colors.white },
  areaRow: { flexDirection: 'row', gap: 10 },
  areaInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  areaIcon: { marginRight: 8 },
  areaInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800, paddingVertical: 12 },
  areaUnit: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral400 },
  calcBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  calcBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  coatsContainer: { marginTop: 16 },
  coatsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  coatsLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600 },
  coatsRow: { flexDirection: 'row', gap: 8 },
  coatChip: {
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.neutral200,
  },
  coatChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  coatChipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral600 },
  coatChipTextActive: { color: Colors.white },
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral800 },
  resultBadgeOk: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultBadgeOkText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.success },
  resultBadgeFail: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultBadgeFailText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.danger },
  materialRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.neutral100,
  },
  materialInfo: { flex: 1 },
  materialName: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral800 },
  materialDetail: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral500, marginTop: 2 },
  materialMissing: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.danger, marginTop: 2 },
  materialRight: { alignItems: 'flex-end', gap: 6 },
  sufficientTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sufficientText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.success },
  insufficientTag: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  insufficientText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.danger },
  removeBtn: { padding: 4 },
  shoppingListCard: {
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: Colors.secondaryLight,
  },
  shoppingListHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  shoppingListTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.secondary },
  shoppingItem: { paddingVertical: 4 },
  shoppingItemText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral700 },
  shareRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  pdfBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  pdfBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  whatsappBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: '#25D366', borderRadius: 12,
    paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  whatsappBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  addMaterialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 14, marginTop: 16,
    borderWidth: 1, borderColor: Colors.neutral200, borderStyle: 'dashed',
  },
  addMaterialBtnText: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.primary },
  addMaterialCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  itemScroll: { maxHeight: 44, marginBottom: 4 },
  itemChip: {
    backgroundColor: Colors.neutral50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.neutral200, marginRight: 6,
  },
  itemChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  itemChipText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral600 },
  itemChipTextActive: { color: Colors.white },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  addConfirmBtn: {
    flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: 12,
    paddingVertical: 12, justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12,
  },
  addConfirmBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
  saveBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
  },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
});
