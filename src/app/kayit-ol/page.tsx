import Link from "next/link";
import { Icons } from "@/components/icons";
import SignupForm from "@/components/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <Icons.logo className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold tracking-tight">
              Hesap Oluştur
            </CardTitle>
            <CardDescription>
              Aramıza katılmak için bilgilerinizi girin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="mt-4 text-center text-sm">
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
