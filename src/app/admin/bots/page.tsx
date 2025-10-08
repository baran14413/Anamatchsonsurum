'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, deleteDoc, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Bot, Copy, LogIn, Trash2, User, ImageIcon, MessagesSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { langTr } from '@/languages/tr';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { femaleNames, maleNames, lastNames, bios, BOT_GREETINGS } from '@/lib/bot-data';

// --- Helper Functions from Dashboard ---
const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDob = (): Date => {
    const today = new Date();
    const maxAge = 40;
    const minAge = 18;
    const year = today.getFullYear() - (Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge);
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    return new Date(year, month, day);
};
const getRandomLocation = () => {
    const centerLat = 39.9255; // Ankara
    const centerLon = 32.8663;
    const radius = 5.0; // ~500km radius
    return {
        latitude: centerLat + (Math.random() - 0.5) * radius * 2,
        longitude: centerLon + (Math.random() - 0.5) * radius * 2,
    };
};

export default function AdminBotsPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [botToDelete, setBotToDelete] = useState<UserProfile | null>(null);
  const [botToLogin, setBotToLogin] = useState<UserProfile | null>(null);

  const [isCreatingBots, setIsCreatingBots] = useState(false);
  const [botCount, setBotCount] = useState(10);
  const [botGender, setBotGender] = useState('mixed');

  const botsCollectionRef = useMemo(
    () => (firestore ? query(collection(firestore, 'users'), where('isBot', '==', true)) : null),
    [firestore]
  );
  const { data: bots, isLoading } = useCollection<UserProfile>(botsCollectionRef);

  const handleDeleteBot = async () => {
    if (!firestore || !botToDelete) return;
    try {
        await deleteDoc(doc(firestore, 'users', botToDelete.id));
        toast({
            title: 'Bot Silindi',
            description: `${botToDelete.fullName} adlı bot başarıyla sistemden silindi.`
        });
    } catch(error: any) {
         toast({
            title: 'Hata',
            description: `Bot silinirken bir hata oluştu: ${error.message}`,
            variant: 'destructive',
        });
    } finally {
        setBotToDelete(null);
    }
  }

  const handleLoginAsBot = async () => {
      if (!auth || !botToLogin) return;
      
      const email = botToLogin.email;
      const password = botToLogin.botPassword;

      if (!email || !password) {
        toast({
            title: 'Hata',
            description: 'Bu botun giriş bilgileri bulunamadı. Lütfen botu silip yeniden oluşturun.',
            variant: 'destructive'
        });
        return;
      }
      await signOut(auth);
      router.push('/');
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Kopyalandı!",
        description: "Giriş bilgileri panoya kopyalandı."
    })
  }

  const handleCreateBots = async () => {
    if (!auth || !firestore) {
      toast({
        title: 'Hata',
        description: 'Firebase servisleri başlatılamadı.',
        variant: 'destructive',
      });
      return;
    }
    if (botCount <= 0) {
        toast({
            title: 'Hata',
            description: 'Bot sayısı 0\'dan büyük olmalıdır.',
            variant: 'destructive',
        });
        return;
    }
    setIsCreatingBots(true);

    let createdCount = 0;
    const allInterests = langTr.signup.step11.categories.flatMap(c => c.options);
    
    const availableFemaleImages = [...PlaceHolderImages.filter(img => img.gender === 'female')].sort(() => Math.random() - 0.5);
    const availableMaleImages = [...PlaceHolderImages.filter(img => img.gender === 'male')].sort(() => Math.random() - 0.5);

    try {
        for (let i = 0; i < botCount; i++) {
            const gender: 'male' | 'female' = botGender === 'mixed'
                ? (Math.random() > 0.5 ? 'female' : 'male')
                : botGender as 'male' | 'female';

            const fullName = `${getRandomItem(gender === 'female' ? femaleNames : maleNames)} ${getRandomItem(lastNames)}`;
            const email = `bot_${fullName.toLowerCase().replace(/\s/g, '_')}_${Date.now()}@bematch.app`;
            const password = Math.random().toString(36).slice(-8);

            let randomImage;
            if (gender === 'female') {
                randomImage = availableFemaleImages.pop();
            } else {
                randomImage = availableMaleImages.pop();
            }
            
            if (!randomImage) {
                 throw new Error(`${gender === 'female' ? 'Kadın' : 'Erkek'} cinsiyeti için kullanılabilir benzersiz resim kalmadı. Lütfen daha az bot oluşturmayı deneyin veya resim kütüphanesini genişletin.`);
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: fullName,
                photoURL: randomImage.imageUrl,
            });
            
            const botId = user.uid;
            const docRef = doc(firestore, 'users', botId);
            
            const botProfile = {
                uid: botId,
                fullName,
                email,
                botPassword: password,
                dateOfBirth: getRandomDob().toISOString(),
                gender,
                genderPreference: gender === 'female' ? 'male' : 'female',
                bio: getRandomItem(bios),
                interests: [...new Set(Array.from({ length: 10 }, () => getRandomItem(allInterests)))],
                images: [{ url: randomImage.imageUrl, public_id: `bot_${randomImage.id}` }],
                profilePicture: randomImage.imageUrl,
                location: getRandomLocation(),
                isBot: true,
                createdAt: serverTimestamp(),
                rulesAgreed: true,
                lookingFor: 'whatever',
                distancePreference: 160,
                ageRange: { min: 18, max: 80 },
                isOnline: true,
            };

            await setDoc(docRef, botProfile);
            createdCount++;
        }

        toast({
            title: 'Botlar Oluşturuldu',
            description: `${createdCount} adet yeni bot başarıyla oluşturuldu.`,
        });

    } catch (error: any) {
        console.error("Bot oluşturma hatası:", error);
        toast({
            title: 'Hata',
            description: `Botlar oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen bir hata oluştu.'}`,
            variant: 'destructive',
        });
    } finally {
        setIsCreatingBots(false);
    }
  };


  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }
  
  const maleImagesCount = PlaceHolderImages.filter(img => img.gender === 'male').length;
  const femaleImagesCount = PlaceHolderImages.filter(img => img.gender === 'female').length;

  return (
     <AlertDialog>
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Bot Yönetim Merkezi</h1>

        {/* Deck Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Kadın Resim Havuzu</CardTitle>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{femaleImagesCount}</div>
                    <p className="text-xs text-muted-foreground">Kullanılabilir benzersiz resim</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Erkek Resim Havuzu</CardTitle>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{maleImagesCount}</div>
                    <p className="text-xs text-muted-foreground">Kullanılabilir benzersiz resim</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">İsim Havuzu</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{femaleNames.length + maleNames.length}</div>
                    <p className="text-xs text-muted-foreground">K: {femaleNames.length}, E: {maleNames.length}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sohbet Kütüphanesi</CardTitle>
                    <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{BOT_GREETINGS.length}</div>
                    <p className="text-xs text-muted-foreground">Benzersiz otomatik mesaj</p>
                </CardContent>
            </Card>
        </div>
        
        {/* Bot Creation and List */}
        <div className="pt-4 grid md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Bot Jeneratörü
                    </CardTitle>
                    <CardDescription>
                        Uygulamaya test veya başlangıç amacıyla sahte kullanıcı profilleri (bot) ekleyin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="bot-count">Bot Sayısı</Label>
                            <Input 
                                id="bot-count"
                                type="number"
                                value={botCount}
                                onChange={(e) => setBotCount(parseInt(e.target.value))}
                                min="1"
                                max={Math.min(femaleImagesCount, maleImagesCount)}
                                disabled={isCreatingBots}
                             />
                        </div>
                         <div className="space-y-2 flex-1">
                            <Label htmlFor="bot-gender">Cinsiyet</Label>
                            <Select 
                                value={botGender}
                                onValueChange={setBotGender}
                                disabled={isCreatingBots}
                            >
                                <SelectTrigger id="bot-gender">
                                    <SelectValue placeholder="Seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mixed">Karışık</SelectItem>
                                    <SelectItem value="female">Kadın</SelectItem>
                                    <SelectItem value="male">Erkek</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <Button onClick={handleCreateBots} disabled={isCreatingBots}>
                        {isCreatingBots ? (
                            <><Icons.logo className='h-4 w-4 animate-pulse mr-2'/> Oluşturuluyor...</>
                        ) : (
                            <><Bot className='mr-2 h-4 w-4'/> Botları Oluştur</>
                        )}
                    </Button>
                </CardContent>
            </Card>
            <Card className='md:col-span-2'>
                <CardHeader>
                    <CardTitle>Oluşturulan Botlar ({bots?.length || 0})</CardTitle>
                    <CardDescription>Sistemde aktif olan tüm botların listesi.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>İsim</TableHead>
                            <TableHead>E-posta & Şifre</TableHead>
                            <TableHead>Oluşturulma Tarihi</TableHead>
                            <TableHead className='text-right'>Eylemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bots && bots.map((bot) => (
                            <TableRow key={bot.id}>
                                <TableCell>
                                <Avatar>
                                    <AvatarImage src={bot.profilePicture} />
                                    <AvatarFallback>{bot.fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{bot.fullName}</TableCell>
                                <TableCell>
                                    <div className="text-sm relative group w-fit">
                                        <p><strong>E:</strong> {bot.email}</p>
                                        <p><strong>Ş:</strong> {bot.botPassword}</p>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute -top-1 -right-8 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => copyToClipboard(`E-posta: ${bot.email}\nŞifre: ${bot.botPassword}`)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                {bot.createdAt ? format(bot.createdAt.toDate(), 'd MMMM yyyy', { locale: tr }) : '-'}
                                </TableCell>
                                <TableCell className='text-right'>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant='ghost' size='icon'>
                                                <MoreHorizontal className='h-4 w-4'/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onClick={() => setBotToLogin(bot)}>
                                                    <LogIn className='mr-2 h-4 w-4'/>
                                                    <span>Giriş Yap</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className='text-red-500 focus:text-red-500' onClick={() => { setBotToDelete(bot); setBotToLogin(null); }}>
                                                    <Trash2 className='mr-2 h-4 w-4'/>
                                                    <span>Botu Sil</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                            {(!bots || bots.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                    Bot bulunamadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        </div>
        {botToDelete && (
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Botu Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bu işlem geri alınamaz. {botToDelete?.fullName} adlı botun hesabı ve tüm verileri kalıcı olarak silinecektir.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBotToDelete(null)}>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBot} className='bg-destructive hover:bg-destructive/90'>Sil</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        )}
         {botToLogin && (
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Bot Olarak Giriş Yap</AlertDialogTitle>
                <AlertDialogDescription>
                    Mevcut oturumunuz kapatılacak ve giriş sayfasına yönlendirileceksiniz. Kopyalanan bilgileri kullanarak bot hesabına giriş yapabilirsiniz.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBotToLogin(null)}>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleLoginAsBot}>Evet, Çıkış Yap ve Yönlendir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        )}
     </AlertDialog>
  );
}
