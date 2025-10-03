import type { UserProfile, Match, Post } from './types';

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


export const mockPosts: Post[] = [
    {
      id: 'post1',
      username: 'Elif',
      userAvatar: 'https://picsum.photos/seed/bematch1/100/100',
      imageUrl: 'https://picsum.photos/seed/post1/600/700',
      caption: 'Paris\'te harika bir gün! Eiffel Kulesi\'ni görmek inanılmazdı. 🗼 #seyahat #paris #tbt',
      likes: 1245,
      comments: 89,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: 'post-text-1',
      username: 'Emre',
      userAvatar: 'https://picsum.photos/seed/bematch4/100/100',
      caption: 'Yazılım geliştirirken doğru müzik listesini bulmak, verimliliği en az %50 artırıyor. Sizin favori "kodlama" çalma listeniz hangisi? 👨‍💻🎶',
      likes: 312,
      comments: 54,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      id: 'post2',
      username: 'Can',
      userAvatar: 'https://picsum.photos/seed/bematch2/100/100',
      imageUrl: 'https://picsum.photos/seed/post2/600/600',
      caption: 'Bu haftasonu kamp ateşi ve yıldızlar... Başka bir şeye gerek yok. 🏕️🔥',
      likes: 832,
      comments: 45,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
    },
     {
      id: 'post3',
      username: 'Selin',
      userAvatar: 'https://picsum.photos/seed/bematch3/100/100',
      imageUrl: 'https://picsum.photos/seed/post3/600/750',
      caption: 'Yeni tablom sonunda bitti. Renklerle oynamayı seviyorum. 🎨 #sanat #resim #yağlıboya',
      likes: 2400,
      comments: 212,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50),
    },
    {
      id: 'post-text-2',
      username: 'Ayşe',
      userAvatar: 'https://picsum.photos/seed/ayse/100/100',
      caption: 'Bir pazar sabahı klasiği: sıcacık bir kahve, güzel bir kitap ve fonda çalan hafif bir müzik. Bazen mutluluk bu kadar basit. ☕️📖',
      likes: 950,
      comments: 130,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 60),
    },
     {
      id: 'post4',
      username: 'Buse',
      userAvatar: 'https://picsum.photos/seed/bematch5/100/100',
      imageUrl: 'https://picsum.photos/seed/post4/600/600',
      caption: 'Sahilde köpeğimle sabah yürüyüşü gibisi yok. 🐾❤️',
      likes: 987,
      comments: 61,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    }
]
