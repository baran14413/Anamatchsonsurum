
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Heart, MessageSquare, Bot } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { langTr } from '@/languages/tr';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- Data for Bot Generation ---
const femaleNames = ["Aslı", "Beren", "Ceyda", "Deniz", "Elif", "Feyza", "Gizem", "Hazal", "Irmak", "Jale", "Lale", "Melis", "Narin", "Pelin", "Selin", "Tuğçe", "Zeynep", "Bahar", "Damla", "Eylül", "Fulya", "Gamze"];
const maleNames = ["Ahmet", "Berk", "Can", "Deniz", "Emre", "Fırat", "Giray", "Hakan", "İlker", "Kerem", "Levent", "Murat", "Ozan", "Polat", "Serkan", "Tarkan", "Umut", "Barış", "Cem", "Doruk", "Ege"];
const lastNames = ["Yılmaz", "Kaya", "Demir", "Çelik", "Arslan", "Doğan", "Kurt", "Öztürk", "Aydın", "Özdemir", "Şahin", "Turan", "Güneş", "Aksoy"];
const bios = [
    "Hayatı dolu dolu yaşamayı seven biriyim. Yeni yerler keşfetmek, yeni tatlar denemek en büyük tutkum.",
    "İyi bir kahve ve güzel bir sohbet günümü güzelleştirir.",
    "Sanat galerilerini gezmek, film eleştirileri okumak ve kedimle vakit geçirmek en büyük keyfim.",
    "Müziğin ritmiyle yaşarım. Konserlere gitmek ve yeni gruplar keşfetmek vazgeçilmezim.",
    "Sporsuz bir hayat düşünemiyorum. Doğa yürüyüşleri ve kamp yapmayı çok severim.",
    "Yazılım geliştiriyorum ve teknolojiye dair her şeye meraklıyım.",
    "Sakin bir akşamda iyi bir kitap okumak gibisi yok.",
    "Hayvanları çok seviyorum, özellikle köpekleri. Sahilde uzun yürüyüşler favorim.",
    "Yaratıcı bir ruhum var. Resim yapmak, en büyük hobim.",
    "Felsefe ve psikolojiye meraklıyım. Derin sohbetler tam benlik.",
    "Yıldızları izlemeyi ve evren hakkında düşünmeyi severim.",
    "Hafta sonları yeni tarifler denemeyi seviyorum. Mutfakta olmak beni rahatlatıyor.",
    "Biraz adrenalin tutkunuyum, yamaç paraşütü favorim.",
    "Sadece bir sırt çantası ve bir harita ile dünyayı dolaşmak hayalim.",
];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
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
    // Spread bots across a wider area in Turkey
    const centerLat = 39.9255; // Ankara
    const centerLon = 32.8663;
    const radius = 5.0; // ~500km radius
    return {
        latitude: centerLat + (Math.random() - 0.5) * radius * 2,
        longitude: centerLon + (Math.random() - 0.5) * radius * 2,
    };
};

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [isCreatingBots, setIsCreatingBots] = useState(false);
  const [botCount, setBotCount] = useState(10);
  const [botGender, setBotGender] = useState('mixed');

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('isBot', '!=', true)) : null),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersCollectionRef);

  const matchesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'matches') : null),
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection(matchesCollectionRef);

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
    let imageIndex = Math.floor(Math.random() * PlaceHolderImages.length); // Start from a random index

    try {
        for (let i = 0; i < botCount; i++) {
            const gender: 'male' | 'female' = botGender === 'mixed'
                ? (Math.random() > 0.5 ? 'female' : 'male')
                : botGender as 'male' | 'female';

            const fullName = `${getRandomItem(gender === 'female' ? femaleNames : maleNames)} ${getRandomItem(lastNames)}`;
            const email = `bot_${fullName.toLowerCase().replace(/\s/g, '_')}_${Date.now()}@bematch.app`;
            const password = Math.random().toString(36).slice(-8);

            // Cycle through placeholder images
            const randomImage = PlaceHolderImages[imageIndex % PlaceHolderImages.length];
            imageIndex++;


            // 1. Create user in Firebase Auth
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
                botPassword: password, // Store password for admin login
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


  return (
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Genel Bakış</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : users?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Sistemdeki toplam gerçek kullanıcı sayısı.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Eşleşme
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {isLoadingMatches ? <Icons.logo className="h-6 w-6 animate-pulse" /> : matches?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Gerçekleşen toplam eşleşme sayısı.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Sohbetler</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingMatches ? <Icons.logo className="h-6 w-6 animate-pulse" /> : matches?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Devam eden sohbetlerin sayısı.
                </p>
            </CardContent>
            </Card>
        </div>

        <div className="pt-4 grid md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Bot Yönetimi
                    </CardTitle>
                    <CardDescription>
                        Uygulamaya test veya başlangıç amacıyla sahte kullanıcı profilleri (bot) ekleyin. Bu işlem doğrudan tarayıcınız üzerinden yapılır.
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
                                max="100"
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
        </div>
        </div>
  );
}
