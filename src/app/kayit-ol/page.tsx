
'use client';

import SignupForm from "@/components/signup-form";
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'en';

  return <SignupForm lang={lang} />;
}
