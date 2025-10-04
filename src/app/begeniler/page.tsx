
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { langEn } from '@/languages/en';

export default function BegenilerPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:py-8 h-full flex flex-col">
       <h1 className="mb-6 text-3xl font-bold tracking-tight">{langEn.begeniler.title}</h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-20 flex flex-col items-center justify-center h-full text-muted-foreground">
            <Heart className="h-16 w-16 mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">{langEn.begeniler.noLikesTitle}</h2>
            <p>{langEn.begeniler.noLikesDescription}</p>
        </div>
      </div>
    </div>
  );
}

    