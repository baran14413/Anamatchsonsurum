
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/admin';
import type { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

const mockProfiles: Omit<UserProfile, 'id'>[] = [
    { fullName: 'Aslı', dateOfBirth: '1998-05-22', images: ['https://picsum.photos/seed/asli1/600/800', 'https://picsum.photos/seed/asli2/600/800'], interests: ['Yoga', 'Kitaplar', 'Seyahat'], bio: 'Hayatı dolu dolu yaşamayı seven biriyim.' },
    { fullName: 'Burak', dateOfBirth: '1995-02-10', images: ['https://picsum.photos/seed/burak1/600/800'], interests: ['Spor', 'Sinema', 'Teknoloji'], bio: 'Hafta sonları yeni yerler keşfetmeyi severim.' },
    { fullName: 'Ceren', dateOfBirth: '2000-11-15', images: ['https://picsum.photos/seed/ceren1/600/800', 'https://picsum.photos/seed/ceren2/600/800', 'https://picsum.photos/seed/ceren3/600/800'], interests: ['Müzik', 'Sanat', 'Dans'], bio: 'Konserlere gitmek en büyük tutkum.' },
    { fullName: 'Deniz', dateOfBirth: '1997-09-03', images: ['https://picsum.photos/seed/deniz1/600/800'], interests: ['Yüzme', 'Fotoğrafçılık', 'Doğa'], bio: 'Sakin ve huzurlu anların peşindeyim.' },
    { fullName: 'Ege', dateOfBirth: '1999-07-20', images: ['https://picsum.photos/seed/ege1/600/800', 'https://picsum.photos/seed/ege2/600/800'], interests: ['Video Oyunları', 'Yazılım', 'Anime'], bio: 'Bir sonraki büyük projemin peşindeyim.' },
    { fullName: 'Feyza', dateOfBirth: '1996-03-12', images: ['https://picsum.photos/seed/feyza1/600/800'], interests: ['Moda', 'Gurme Yemekler', 'Tiyatro'], bio: 'Estetik ve lezzet benim için her şey.' },
    { fullName: 'Gizem', dateOfBirth: '2001-01-05', images: ['https://picsum.photos/seed/gizem1/600/800', 'https://picsum.photos/seed/gizem2/600/800'], interests: ['Hayvanlar', 'Gönüllülük', 'Belgeseller'], bio: 'Daha iyi bir dünya için küçük adımlar.' },
    { fullName: 'Hakan', dateOfBirth: '1994-08-30', images: ['https://picsum.photos/seed/hakan1/600/800'], interests: ['Finans', 'Golf', 'Klasik Müzik'], bio: 'Disiplin ve odaklanma başarının anahtarıdır.' }
];


export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real scenario, we'd use the current user's data to filter these.
    // For now, we'll just return the mock profiles as is for testing.
    
    // Add unique IDs to the mock profiles
    const profilesWithIds = mockProfiles.map((profile, index) => ({
        ...profile,
        id: `mock_user_${index + 1}`
    }));

    return NextResponse.json(profilesWithIds);
}
