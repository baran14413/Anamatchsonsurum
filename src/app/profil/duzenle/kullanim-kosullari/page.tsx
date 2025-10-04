
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { langTr } from '@/languages/tr';

export default function KullanimKosullariPage() {
  const t = langTr.ayarlarKullanim;
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription>
            {t.lastUpdated}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              {t.sections.map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-foreground">{section.title}</h4>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
