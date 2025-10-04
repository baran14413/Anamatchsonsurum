import Link from "next/link";
import { Icons } from "@/components/icons";
import SignupForm from "@/components/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl rounded-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/30 dark:border-black/30">
          <CardHeader className="text-center space-y-4 pt-8">
            <Icons.logo className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Aramıza Katıl
            </CardTitle>
            <CardDescription className="text-muted-foreground px-4">
              Aşkı bulmak için ilk adımı at. Güvenli bir başlangıç için bilgilerini gir.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-6 sm:px-8">
            <SignupForm />
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Zaten bir hesabın var mı?{" "}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Giriş Yap
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
