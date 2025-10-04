
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/admin';
import type { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

const mockProfiles: Omit<UserProfile, 'id'>[] = [
    { fullName: 'Aslı', dateOfBirth: '1998-05-22', images: ['https://picsum.photos/seed/asli1/600/800', 'https://picsum.photos/seed/asli2/600/800'], interests: ['Yoga', 'Kitaplar', 'Seyahat'], bio: 'Hayatı dolu dolu yaşamayı seven biriyim.' },
    { fullName: 'Burak', dateOfBirth: '1995-02-10', images: ['https://picsum.photos/seed/burak1/600/800'], interests: ['Spor', 'Sinema', 'Teknoloji'], bio: 'Hafta sonları yeni yerler keşfetmeyi severim.' },
    { fullName: 'Ceren', dateOfBirth: '2000-11-15', images: ['https://picsum.photos/seed/ceren1/600/800', 'https://picsum.photos/seed/ceren2/600/800', 'https://picsum.photos/seed/ceren3/600/800'], interests: ['Müzik', 'Sanat', 'Dans'], bio: 'Konserlere gitmek en büyük tutkum.' },
    { fullName: 'Deniz', dateOfBirth: '1997-09-03', images: ['https://picsum.photos/seed/deniz1/600/800'], interests: ['Yüzme', 'Fotoğrafçılık', 'Doğa'], bio: 'Sakin ve huzurlu anların peşindeyim.' },
    { fullName: 'Ege', dateOfBirt