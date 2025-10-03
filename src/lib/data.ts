import type { UserProfile, Match } from './types';

export const mockProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Elif',
    age: 28,
    images: [
      'https://picsum.photos/seed/bematch1/600/800',
      'https://picsum.photos/seed/bematch1a/600/800',
    ],
    bio: 'Kahve ve seyahat tutkunu. Yeni yerler keşfetmeyi ve güzel anılar biriktirmeyi seviyorum.',
    interests: ['Seyahat', 'Fotoğrafçılık', 'Yoga'],
  },
  {
    id: '2',
    name: 'Can',
    age: 32,
    images: [
      'https://picsum.photos/seed/bematch2/600/800',
      'https://picsum.photos/seed/bematch2a/600/800',
    ],
    bio: 'Doğa yürüyüşleri ve kamp yapmaktan hoşlanan bir maceraperest. Hafta sonları genelde dağlardayım.',
    interests: ['Doğa Yürüyüşü', 'Kamp', 'Gitar'],
  },
  {
    id: '3',
    name: 'Selin',
    age: 25,
    images: [
      'https://picsum.photos/seed/bematch3/600/800',
      'https://picsum.photos/seed/bematch3a/600/800',
    ],
    bio: 'Sanat ve edebiyat aşığı. Boş zamanlarımda resim yapar, kitap okurum.',
    interests: ['Sanat', 'Kitaplar', 'Müze'],
  },
  {
    id: '4',
    name: 'Emre',
    age: 30,
    images: [
      'https://picsum.photos/seed/bematch4/600/800',
    ],
    bio: 'Teknoloji ve oyun meraklısı. Birlikte oynayabileceğimiz birini arıyorum.',
    interests: ['Oyun', 'Teknoloji', 'Sinema'],
  },
  {
    id: '5',
    name: 'Buse',
    age: 29,
    images: [
      'https://picsum.photos/seed/bematch5/600/800',
      'https://picsum.photos/seed/bematch5a/600/800',
      'https://picsum.photos/seed/bematch5b/600/800',
    ],
    bio: 'Hayvanları çok seviyorum, özellikle köpekleri. Sahilde uzun yürüyüşler favorim.',
    interests: ['Hayvanlar', 'Plaj', 'Yemek Yapmak'],
  },
];

export const mockMatches: Match[] = [
  {
    id: 'match1',
    userId: '1',
    name: 'Elif',
    avatarUrl: 'https://picsum.photos/seed/bematch1/100/100',
    lastMessage: 'Selam! Nasılsın?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 'match2',
    userId: '3',
    name: 'Selin',
    avatarUrl: 'https://picsum.photos/seed/bematch3/100/100',
    lastMessage: 'Bu hafta sonu bir planın var mı?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'match3',
    userId: '5',
    name: 'Buse',
    avatarUrl: 'https://picsum.photos/seed/bematch5/100/100',
    lastMessage: 'Fotoğrafların çok güzel :)',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];
