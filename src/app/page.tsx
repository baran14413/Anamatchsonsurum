import Link from "next/link";
import { Icons } from "@/components/icons";
import LoginForm from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 p-4">
       <div className="relative z-10 flex flex-col items-center p-8 text-center text-white">
        <div className="flex items-center gap-4 mb-6">
          <Icons.logo className="h-16 w-16 text-white sm:h-20 sm:w-20" />
          <h1 className="text-5xl font-bold tracking-tighter text-white sm:text-6xl">
            BeMatch
          </h1>
        </div>
        <p className="max-w-md text-base text-white/80 sm:text-lg md:text-xl">
          Maceraya devam etmek için bilgilerini gir.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="shadow-2xl rounded-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/30 dark:border-black/30">
          <CardContent className="px-6 pb-8 pt-6 sm:px-8">
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
