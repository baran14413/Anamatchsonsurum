
"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { mockPosts } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function KesfetPage() {
  return (
    <div className="bg-muted/20 dark:bg-black h-full overflow-y-auto">
      <div className="container mx-auto max-w-xl py-4 sm:py-8">
        <div className="space-y-6">
          {mockPosts.map((post) => (
            <Card key={post.id} className="rounded-xl overflow-hidden shadow-md dark:border-gray-800">
              <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={post.userAvatar} alt={post.username} data-ai-hint="person avatar" />
                  <AvatarFallback>{post.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{post.username}</p>
                   <p className="text-xs text-muted-foreground">
                       {formatDistanceToNow(post.timestamp, { addSuffix: true, locale: tr })}
                    </p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={post.imageUrl}
                    alt="Post image"
                    fill
                    className="object-cover"
                    data-ai-hint="lifestyle social media"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-start p-4">
                <div className="flex w-full items-center">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="group">
                      <Heart className="h-6 w-6 group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Send className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 w-full text-sm">
                  <p className="font-semibold">{post.likes.toLocaleString('tr-TR')} beğenme</p>
                  <p className="mt-1">
                    <span className="font-semibold">{post.username}</span>
                    <span className="text-muted-foreground ml-1">{post.caption}</span>
                  </p>
                  <p className="text-muted-foreground mt-1 cursor-pointer hover:underline">
                    {post.comments} yorumun tümünü gör
                  </p>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
