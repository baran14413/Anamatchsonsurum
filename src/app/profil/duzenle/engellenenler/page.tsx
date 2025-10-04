
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ban, UserX } from 'lucide-react';

export default function EngellenenlerPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-6 w-6 text-primary" />
            Engellenen Kullanıcılar
          </CardTitle>
          <CardDescription>
            Burada engellediğin kullanıcıların listesini görebilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <UserX className="h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Henüz Kimseyi Engellemedin</h3>
            <p className="mt-1">Bir kullanıcıyı engellediğinde burada listelenir.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
