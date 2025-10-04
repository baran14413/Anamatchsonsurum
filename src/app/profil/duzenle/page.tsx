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
} from 'lucide-react';
import Link from 'next/link';

const settingsGroups = [
  {
    title: 'Hesap Ayarları',
    items: [
      {
        icon: User,
        label: 'Kişisel Bilgiler',
        href: '#',
        bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
      },
      {
        icon: MapPin,
        label: 'Konum',
        href: '#',
        bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
      },
      {
        icon: Bell,
        label: 'Bildirim Ayarları',
        href: '#',
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
        href: '#',
        bgColor: 'bg-gradient-to-br from-gray-500 to-gray-700',
      },
      {
        icon: Ban,
        label: 'Engellenen Kullanıcılar',
        href '#',
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
        href: '#',
        bgColor: 'bg-gradient-to-br from-teal-400 to-teal-600',
      },
      {
        icon: HeartHandshake,
        label: 'Topluluk Kuralları',
        href: '#',
        bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
      },
      {
        icon: FileText,
        label: 'Kullanım Koşulları',
        href: '#',
        bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600',
      },
    ],
  },
];

export default function DuzenlePage() {
  return (
    <div className="p-4 space-y-8">
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
       <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
           <button className="flex w-full items-center p-4 active:bg-muted/50 text-red-500">
               <div
                className={`mr-4 flex h-8 w-8 items-center justify-center rounded-lg text-white bg-gradient-to-br from-red-500 to-red-700`}
              >
                <LogOut className="h-5 w-5" />
              </div>
              <span className="flex-1 font-medium text-left">Çıkış Yap</span>
           </button>
      </div>
    </div>
  );
}
