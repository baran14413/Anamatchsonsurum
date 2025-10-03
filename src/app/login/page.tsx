import Link from "next/link";
import { Icons } from "@/components/icons";
import LoginForm from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-pink-100/50 to-background dark:from-background dark:via-pink-900/20 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-lg border-white/30 dark:border-black/30">
          <CardHeader className="text-center">
            <Icons.logo className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Tekrar Hoş Geldin!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Maceraya devam etmek için giriş yap.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Hesabın yok mu?{" "}
              <Link href="/kayit-ol" className="font-semibold text-primary underline-offset-4 hover:underline">
                Hemen Kayıt Ol
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
