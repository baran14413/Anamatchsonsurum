
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, MessageSquare, Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function BildirimlerPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Bildirim Ayarları
          </CardTitle>
          <CardDescription>
            Hangi durumlarda bildirim almak istediğini seç.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="new-messages" className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Yeni Mesajlar
              </Label>
              <p className="text-sm text-muted-foreground">
                Yeni bir mesaj aldığında anında haberdar ol.
              </p>
            </div>
            <Switch id="new-messages" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="new-matches" className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-muted-foreground" />
                Yeni Eşleşmeler
              </Label>
              <p className="text-sm text-muted-foreground">
                Biri seninle eşleştiğinde bildirim al.
              </p>
            </div>
            <Switch id="new-matches" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
