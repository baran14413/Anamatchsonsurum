"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Heart, Home, MessageSquare, User as UserIcon } from "lucide-react";

const navLinks = [
  { href: "/anasayfa", label: "Anasayfa", icon: Home },
  { href: "/eslesmeler", label: "Eşleşmeler", icon: Heart },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email[0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/anasayfa" className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="hidden text-xl font-bold text-foreground sm:inline-block">
            BeMatch
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-muted p-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              asChild
              variant={pathname === href ? "default" : "ghost"}
              className={cn("rounded-full", {
                "bg-primary text-primary-foreground": pathname === href,
              })}
            >
              <Link href={href} className="flex items-center gap-2 px-4 py-2">
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || "Kullanıcı"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profil">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-1 md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
                <Button key={href + "-mobile"} asChild variant={pathname === href ? "secondary" : "ghost"} size="sm">
                    <Link href={href} className="flex flex-col items-center h-14">
                        <Icon className="h-6 w-6" />
                        <span className="text-xs">{label}</span>
                    </Link>
                </Button>
            ))}
          </div>
      </nav>
    </header>
  );
}
