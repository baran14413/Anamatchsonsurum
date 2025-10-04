
"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { useDoc } from '@/firebase/firestore/use-doc';
import { collection, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Loader2, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { langEn } from "@/languages/en";

function MatchItem({ match }: { match: any }) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const otherUserId = match.user1Id === currentUser?.uid ? match.user2Id : match.user1Id;

  const otherUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !otherUserId) return null;
    return doc(firestore, `users/${otherUserId}`);
  }, [firestore, otherUserId]);

  const { data: otherUserProfile, isLoading: isProfileLoading } = useDoc(otherUserProfileRef);

  return (
    <Link href={`/sohbet/${match.id}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4 flex items-center gap-4">
          {isProfileLoading ? (
            <Skeleton className="h-16 w-16 rounded-full" />
          ) : (
            <Image
              src={otherUserProfile?.profilePicture || `https://picsum.photos/seed/${otherUserId}/100/100`}
              alt="Match Avatar"
              width={64}
              height={64}
              className="rounded-full object-cover"
              data-ai-hint="person avatar"
            />
          )}
          <div className="flex-1">
            <div className="flex justify-between">
              {isProfileLoading ? (
                 <Skeleton className="h-6 w-32" />
              ) : (
                <h2 className="font-semibold text-lg">{otherUserProfile?.fullName || langEn.eslesmeler.user}</h2>
              )}
              {match.matchDate?.seconds && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(match.matchDate.seconds * 1000), { addSuffix: true, locale: enUS })}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {langEn.eslesmeler.defaultMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EslesmelerPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const matchesCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/matches`);
  }, [user, firestore]);

  const { data: matches, isLoading } = useCollection(matchesCollectionRef);

  return (
    <div className="container mx-auto max-w-2xl p-4 md:py-8 h-full flex flex-col">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{langEn.eslesmeler.title}</h1>
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && matches && matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchItem key={match.id} match={match} />
            ))}
          </div>
        )}

        {!isLoading && (!matches || matches.length === 0) && (
          <div className="text-center py-20 flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">{langEn.eslesmeler.noChatsTitle}</h2>
            <p>{langEn.eslesmeler.noChatsDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
}

    