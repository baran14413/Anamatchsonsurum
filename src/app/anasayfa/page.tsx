"use client";

import { langTr } from "@/languages/tr";

export default function AnasayfaPage() {
  const t = langTr;

  return (
    <div className="container mx-auto flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Hoşgeldiniz!</h1>
        <p className="text-lg text-muted-foreground mt-2">Giriş işlemi başarılı.</p>
      </div>
    </div>
  );
}
