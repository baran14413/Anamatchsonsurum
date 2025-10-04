
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, EyeOff, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function GizlilikPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            Hesap Gizliliği
          </CardTitle>
          <CardDescription>
            Profilinin ve bilgilerinin nasıl görüneceğini yönet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="private-profile" className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Gizli Profil
              </Label>
              <p className="text-sm text-muted-foreground">
                Aktif edilirse profilin sadece eşleştiğin kişiler tarafından görülür.
              </p>
            </div>
            <Switch id="private-profile" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="show-activity" className="text-base flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
                Aktivite Durumunu Gizle
              </Label>
              <p className="text-sm text-muted-foreground">
                Aktif olup olmadığını diğer kullanıcılardan gizle.
              </p>
            </div>
            <Switch id="show-activity" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
