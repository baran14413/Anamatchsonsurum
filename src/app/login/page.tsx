import Link from "next/link";
import { Icons } from "@/components/icons";
import LoginForm from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <Icons.logo className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold tracking-tight">
              BeMatch'e Hoş Geldin!
            </CardTitle>
            <CardDescription>
              Devam etmek için giriş yap.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-4 text-center text-sm">
              Hesabın yok mu?{" "}
              <Link href="/kayit-ol" className="font-semibold text-primary underline-offset-4 hover:underline">
                Kayıt Ol
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
