"use client";

import { langTr } from "@/languages/tr";

export default function AnasayfaPage() {
  const t = langTr;

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Hoşgeldiniz!</h1>
        <p className="text-lg text-muted-foreground mt-2">Giriş işlemi başarılı.</p>
      </div>
    </div>
  );
}
