"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { MessageCircle, Settings2, Zap } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/anasayfa" className="flex items-center gap-2">
          <Icons.tinder className="h-8 w-auto text-[#FD5068]" />
        </Link>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="text-muted-foreground">
             <MessageCircle />
           </Button>
           <Button variant="ghost" size="icon" className="text-muted-foreground">
             <Settings2 />
           </Button>
           <Button variant="ghost" size="icon" className="text-purple-500">
             <Zap />
           </Button>
        </div>
      </div>
    </header>
  );
}
