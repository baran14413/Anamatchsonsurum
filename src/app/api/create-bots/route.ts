
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { langTr } from '@/languages/tr';

// --- Data for Bot Generation ---
const femaleNames = ["Aslı", "Beren", "Ceyda", "Deniz", "Elif", "Feyza", "Gizem", "Hazal", "Irmak", "Jale", "Lale", "Melis", "Narin", "Pelin", "Selin", "Tuğçe", "Zeynep"];
const maleNames = ["Ahmet", "Berk", "Can", "Deniz", "Emre", "Fırat", "Giray", "Hakan", "İlker", "Kerem", "Levent", "Murat", "Ozan", "Polat", "Serkan", "Tarkan", "Umut"];
const lastNames = ["Yılmaz", "Kaya", "Demir", "Çelik", "Arslan", "Doğan", "Kurt", "Öztürk", "Aydın", "Özdemir"];
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
];

// Helper function to get a random item from an array
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper function to generate a random date of birth (18-40 years old)
const getRandomDob = (): Date => {
    const today = new Date();
    const maxAge = 40;
    const minAge = 18;
    const year = today.getFullYear() - (Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge);
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1; // Avoid month length issues
    return new Date(year, month, day);
};

// Helper function to generate random location around a central point (e.g., Istanbul)
const getRandomLocation = () => {
    const centerLat = 41.0082;
    const centerLon = 28.9784;
    const radius = 0.5; // Approx 50km radius in degrees
    return {
        latitude: centerLat + (Math.random() - 0.5) * radius * 2,
        longitude: centerLon + (Math.random() - 0.5) * radius * 2,
    };
};

export async function POST(req: NextRequest) {
    if (!db) {
        return NextResponse.json({ error: 'Sunucu hatası: Veritabanı başlatılamadı.' }, { status: 500 });
    }

    try {
        const { count, gender: requestedGender } = await req.json();

        if (!count || typeof count !== 'number' || count <= 0 || count > 100) {
            return NextResponse.json({ error: 'Geçersiz bot sayısı. 1 ile 100 arasında bir sayı girin.' }, { status: 400 });
        }
        
        const allInterests = langTr.signup.step11.categories.flatMap(c => c.options);
        const batch = db.batch();
        let createdCount = 0;

        for (let i = 0; i < count; i++) {
            const botId = db.collection('users').doc().id;
            const docRef = db.collection('users').doc(botId);

            let gender: 'male' | 'female';
            if (requestedGender === 'mixed') {
                gender = Math.random() > 0.5 ? 'female' : 'male';
            } else {
                gender = requestedGender;
            }

            const fullName = `${getRandomItem(gender === 'female' ? femaleNames : maleNames)} ${getRandomItem(lastNames)}`;
            const randomImage = getRandomItem(PlaceHolderImages);
            
            const botProfile = {
                uid: botId,
                fullName,
                email: `${fullName.toLowerCase().replace(/\s/g, '.')}@bot.bematch.app`,
                dateOfBirth: getRandomDob().toISOString(),
                gender,
                genderPreference: gender === 'female' ? 'male' : 'female', // Simple preference
                bio: getRandomItem(bios),
                interests: [...new Set(Array.from({ length: 10 }, () => getRandomItem(allInterests)))],
                images: [{ url: randomImage.imageUrl, public_id: `bot_${randomImage.id}` }],
                profilePicture: randomImage.imageUrl,
                location: getRandomLocation(),
                isBot: true, // Flag to identify bot users
                createdAt: new Date(),
                rulesAgreed: true,
                lookingFor: 'whatever',
                distancePreference: 50,
                ageRange: { min: 18, max: 45 },
            };

            batch.set(docRef, botProfile);
            createdCount++;
        }

        await batch.commit();

        return NextResponse.json({ message: `${createdCount} bot başarıyla oluşturuldu.`, createdCount });

    } catch (error: any) {
        console.error("Bot oluşturma hatası:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: `Botlar oluşturulurken bir hata oluştu: ${errorMessage}` }, { status: 500 });
    }
}
