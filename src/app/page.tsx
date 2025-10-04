import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { MoveRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-red-500 via-purple-500 to-blue-500">
      <div className="relative z-10 flex flex-col items-center p-8 text-center">
        <div className="flex items-center gap-4 mb-6">
          <Icons.logo className="h-16 w-16 text-white sm:h-20 sm:w-20" />
          <h1 className="text-6xl font-bold tracking-tighter text-white sm:text-7xl">
            BeMatch
          </h1>
        </div>
        <p className="max-w-md text-base text-white/80 sm:text-lg md:text-xl">
          Yapay zeka destekli eşleştirme ile ruh eşini bulmaya hazır mısın?
          Aşkı Keşfet, Bağlantı Kur.
        </p>
        <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
          <Button asChild size="lg" className="h-14 rounded-full bg-white text-lg font-bold text-primary shadow-lg transition-transform hover:scale-105 active:scale-100">
            <Link href="/kayit-ol">
              <span>Hesap Oluştur</span>
              <MoveRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="link" className="text-white/90">
            <Link href="/login">Zaten üye misin? Giriş Yap</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
