import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { MoveRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-pink-100 via-white to-purple-100 dark:from-gray-900 dark:via-black dark:to-purple-900/50" />
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center gap-4 mb-6">
          <Icons.logo className="h-20 w-20 text-primary" />
          <h1 className="text-7xl font-bold tracking-tighter text-gray-800 dark:text-white">
            BeMatch
          </h1>
        </div>
        <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
          Yapay zeka destekli eşleştirme ile ruh eşini bulmaya hazır mısın?
          Aşkı Keşfet, Bağlantı Kur.
        </p>
        <div className="mt-10 flex w-full max-w-sm flex-col gap-4">
          <Button asChild size="lg" className="h-14 rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105">
            <Link href="/kayit-ol">
              <span>Hesap Oluştur</span>
              <MoveRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="link" className="text-muted-foreground">
            <Link href="/login">Zaten üye misin? Giriş Yap</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
