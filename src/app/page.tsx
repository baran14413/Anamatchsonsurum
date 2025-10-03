import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icons } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/70 to-background dark:from-primary dark:via-primary/90 dark:to-background"></div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="flex flex-col items-center space-y-6">
          <Icons.logo className="h-24 w-24 text-white" />
          <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
            BeMatch
          </h1>
          <p className="max-w-2xl text-lg text-white/80 md:text-xl">
            Yapay zeka destekli eşleştirme ile ruh eşini bulmaya hazır mısın?
            Aşkı Keşfet, Bağlantı Kur.
          </p>
          <div className="flex flex-col gap-4 pt-6 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 transform transition-transform hover:scale-105"
            >
              <Link href="/kayit-ol">Hemen Başla</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="transform transition-transform hover:scale-105"
            >
              <Link href="/login">Giriş Yap</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
