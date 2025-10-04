

'use client';
import {
  ChevronRight,
  User,
  MapPin,
  Bell,
  Lock,
  Ban,
  HeartHandshake,
  FileText,
  LogOut,
  ShieldQuestion,
  Camera,
  Loader2,
  Images // Galeri için yeni ikon
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMemoFirebase } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DuzenlePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading, error } = useDoc(userProfileRef);

    const handleIconClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            
            const { url } = await response.json();

            if (userProfileRef) {
                await updateDoc(userProfileRef, { profilePicture: url });
                toast({
                    title: "Profil Resmi Güncellendi",
                    description: "Yeni profil resminiz başarıyla kaydedildi.",
                });
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast({
                title: "Yükleme Başarısız",
                description: `Resim yüklenirken bir hata oluştu: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = async () => {
      try {
        if (auth) {
          await signOut(auth);
          router.push('/login');
          toast({
            title: 'Çıkış Yapıldı',
            description: 'Başarıyla çıkış yaptınız.',
          });
        }
      } catch (error) {
        toast({
          title: 'Hata',
          description: 'Çıkış yapılırken bir hata oluştu.',
          variant: 'destructive',
        });
      }
    };
    
    const settingsGroups = [
      {
        title: 'Hesap Ayarları',
        items: [
          {
            icon: User,
            label: 'Kişisel Bilgiler',
            href: '/profil/duzenle/kisisel-bilgiler',
            bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
          },
          {
            icon: Images,
            label: 'Galeri Yönetimi',
            href: '/profil/duzenle/galeri',
            bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
          },
          {
            icon: MapPin,
            label: 'Konum',
            href: '/profil/duzenle/konum',
            bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
          },
          {
            icon: Bell,
            label: 'Bildirim Ayarları',
            href: '/profil/duzenle/bildirimler',
            bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
          },
        ],
      },
      {
        title: 'Gizlilik ve Güvenlik',
        items: [
          {
            icon: Lock,
            label: 'Hesap Gizliliği',
            href: '/profil/duzenle/gizlilik',
            bgColor: 'bg-gradient-to-br from-gray-500 to-gray-700',
          },
          {
            icon: Ban,
            label: 'Engellenen Kullanıcılar',
            href: '/profil/duzenle/engellenenler',
            bgColor: 'bg-gradient-to-br from-red-500 to-red-700',
          },
        ],
      },
      {
        title: 'Destek ve Hakkında',
        items: [
          {
            icon: ShieldQuestion,
            label: 'Yardım Merkezi',
            href: '/profil/duzenle/yardim',
            bgColor: 'bg-gradient-to-br from-teal-400 to-teal-600',
          },
          {
            icon: HeartHandshake,
            label: 'Topluluk Kuralları',
            href: '/profil/duzenle/topluluk-kurallari',
            bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
          },
          {
            icon: FileText,
            label: 'Kullanım Koşulları',
            href: '/profil/duzenle/kullanim-kosullari',
            bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600',
          },
        ],
      },
    ];

  return (
    <AlertDialog>
      <div className="p-4 space-y-8 pb-12">
          <div className="flex items-center flex-col gap-4 my-4">
               <div className="relative w-32 h-32">
                  <Image
                      src={userProfile?.profilePicture || 'https://picsum.photos/seed/placeholder/200/200'}
                      alt="Profil Resmi"
                      width={128}
                      height={128}
                      className="rounded-full object-cover w-32 h-32 border-4 border-white"
                  />
                   <button
                      onClick={handleIconClick}
                      className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-blue-500 text-white shadow-md transition-transform hover:scale-110"
                      disabled={isUploading}
                  >
                      {isUploading ? <Loader2 className="animate-spin" /> : <Camera className="h-5 w-5" />}
                  </button>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                  />
              </div>
              <h2 className="text-2xl font-bold">{userProfile?.fullName || 'Kullanıcı'}</h2>
              <Link href="/profil/duzenle/kisisel-bilgiler">
                <Button variant="outline" className="rounded-full">
                    Profili Düzenle
                </Button>
              </Link>
          </div>


        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="px-4 pb-2 text-lg font-semibold text-muted-foreground">
              {group.title}
            </h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              {group.items.map((item, index) => (
                <Link href={item.href} key={item.label}>
                  <div
                    className={`flex items-center p-4 ${
                      index < group.items.length - 1 ? 'border-b' : ''
                    } active:bg-muted/50`}
                  >
                    <div
                      className={`mr-4 flex h-8 w-8 items-center justify-center rounded-lg text-white ${item.bgColor}`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div>
            <h2 className="px-4 pb-2 text-lg font-semibold text-muted-foreground">
              Uygulamadan Çık
            </h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <AlertDialogTrigger asChild>
                  <button className="flex w-full items-center p-4 active:bg-muted/50 text-red-500">
                     <div
                      className={`mr-4 flex h-8 w-8 items-center justify-center rounded-lg text-white bg-gradient-to-br from-red-500 to-red-700`}
                    >
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span className="flex-1 font-medium text-left">Çıkış Yap</span>
                 </button>
                </AlertDialogTrigger>
            </div>
        </div>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Çıkış Yapmak İstediğinizden Emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem sizi mevcut oturumunuzdan çıkaracaktır. Tekrar erişmek için giriş yapmanız gerekecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">Çıkış Yap</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    