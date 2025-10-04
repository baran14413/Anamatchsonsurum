'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';

// Mock data for matches - replace with real data later
const matches = [
  // This will be populated from Firestore later
];

const messages = [
  // This will be populated from Firestore later
];

export default function EslesmelerPage() {
  const t = langTr.eslesmeler;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
      {matches.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noChatsTitle}</h2>
            <p>{t.noChatsDescription}</p>
        </div>
      ) : (
        <>
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-background" />
                </div>
            </div>

            {/* New Matches Carousel */}
            <div className="p-4 border-b">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">Yeni Eşleşmeler</h2>
                <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                    {matches.map(match => (
                        <Link href={`/eslesmeler/${match.id}`} key={match.id} className="flex-shrink-0">
                            <div className="flex flex-col items-center space-y-1 w-20">
                                <Avatar className="h-16 w-16 border-2 border-pink-500">
                                    <AvatarImage src={match.profilePicture} />
                                    <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">{match.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y">
                {messages.map(message => (
                    <Link href={`/eslesmeler/${message.matchId}`} key={message.id}>
                        <div className="flex items-center p-4 hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={message.profilePicture} />
                                <AvatarFallback>{message.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{message.name}</h3>
                                    <p className="text-xs text-muted-foreground">{message.time}</p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{message.lastMessage}</p>
                            </div>
                        </div>
                    </Link>
                ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
}
