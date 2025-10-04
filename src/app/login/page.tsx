
'use client';

import LoginForm from "@/components/login-form";
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'en';
  return <LoginForm lang={lang} />;
}
