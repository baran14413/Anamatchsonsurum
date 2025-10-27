
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

interface AppSettings {
  id: string;
  botAutoMessageEnabled?: boolean;
}

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const settingsDocRef = doc(firestore, 'app_settings', 'global');
    
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          setSettings({ id: docSnap.id, ...docSnap.data() } as AppSettings);
        } else {
          // Default settings if not exist
          setSettings({ id: 'global', botAutoMessageEnabled: true });
        }
      } catch (error) {
        console.error("Error fetching app settings:", error);
        toast({ title: 'Hata', description: 'Ayarlar getirilirken bir sorun oluştu.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [firestore, toast]);
  
  const handleSave = async () => {
      if (!firestore || !settings) return;
      setIsSaving(true);
      const settingsDocRef = doc(firestore, 'app_settings', 'global');
      try {
          await setDoc(settingsDocRef, { botAutoMessageEnabled: settings.botAutoMessageEnabled }, { merge: true });
          toast({ title: 'Kaydedildi', description: 'Uygulama ayarları başarıyla güncellendi.' });
      } catch (error: any) {
           toast({ title: 'Hata', description: `Ayarlar kaydedilirken bir hata oluştu: ${error.message}`, variant: 'destructive' });
      } finally {
          setIsSaving(false);
      }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Uygulama Ayarları</h1>
      
      <Card>
          <CardHeader>
              <CardTitle>Bot Ayarları</CardTitle>
              <CardDescription>Uygulamadaki botların davranışlarını ve otomatik etkileşimlerini yönetin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="bot-auto-message" className="text-base">
                        Otomatik Bot Mesajı
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Aktif edildiğinde, botlar bir kullanıcıyla eşleştiğinde otomatik olarak ilk mesajı gönderir.
                    </p>
                </div>
                 <Switch
                    id="bot-auto-message"
                    checked={settings?.botAutoMessageEnabled ?? true}
                    onCheckedChange={(checked) => setSettings(s => s ? {...s, botAutoMessageEnabled: checked} : null)}
                 />
            </div>
             <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><Icons.logo className="mr-2 h-4 w-4 animate-pulse" /> Kaydediliyor...</> : "Ayarları Kaydet"}
             </Button>
          </CardContent>
      </Card>
    </div>
  );
}
