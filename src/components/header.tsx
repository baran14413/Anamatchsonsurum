
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { SlidersHorizontal, Shield, Zap } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/anasayfa" className="flex items-center gap-2">
          <Icons.tinder className="h-8 w-auto text-white" />
        </Link>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
             <SlidersHorizontal />
           </Button>
           <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
             <Shield />
           </Button>
           <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300">
             <Zap className="fill-current"/>
           </Button>
        </div>
      </div>
    </header>
  );
}
