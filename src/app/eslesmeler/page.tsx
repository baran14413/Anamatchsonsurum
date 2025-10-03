import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { mockMatches } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function EslesmelerPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Mesajlar</h1>
      <div className="space-y-4">
        {mockMatches.length > 0 ? (
          mockMatches.map((match) => (
            <Link href={`/sohbet/${match.id}`} key={match.id} className="block">
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <Image
                    src={match.avatarUrl}
                    alt={match.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                    data-ai-hint="person avatar"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h2 className="font-semibold text-lg">{match.name}</h2>
                      {match.lastMessageTimestamp && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(match.lastMessageTimestamp, { addSuffix: true, locale: tr })}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {match.lastMessage}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Henüz hiç eşleşmen yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
