
"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, MoreHorizontal, Repeat } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { mockPosts } from "@/lib/data";
import type { Post } from "@/lib/types";
import { Translation } from "@/components/translation";

// Mock comments for the sheet with different languages
const mockCommentsData = [
  { id: 1, user: "Ahmet", text: "Harika bir paylaşım!", language: 'tr' },
  { id: 2, user: "Zeynep", text: "Kesinlikle katılıyorum.", language: 'tr' },
  { id: 3, user: "Maria", text: "¡Qué foto tan increíble!", language: 'es' },
  { id: 4, user: "John", text: "Wow, this looks amazing. Where was this taken?", language: 'en' },
  { id: 5, user: "Ayşe", text: "Çok ilham verici! ✨", language: 'tr' },
  { id: 6, user: "Pierre", text: "C'est magnifique!", language: 'fr' },
];

export default function KesfetPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <div className="bg-muted/20 dark:bg-black h-full overflow-y-auto">
      <Sheet open={!!selectedPost} onOpenChange={(isOpen) => !isOpen && setSelectedPost(null)}>
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

                <CardContent className="p-4 pt-0">
                  <div className="text-foreground/90 whitespace-pre-wrap">
                     <Translation text={post.caption} sourceLanguage={post.language} />
                  </div>
                </CardContent>

                {post.imageUrl && (
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
                )}

                <CardFooter className="flex flex-col items-start p-4">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-3">
                      <Button variant="ghost" size="icon" className="group">
                        <Heart className="h-6 w-6 group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
                      </Button>
                      <SheetTrigger asChild onClick={() => setSelectedPost(post)}>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-6 w-6" />
                        </Button>
                      </SheetTrigger>
                      {!post.imageUrl && ( // Only show repost for text posts
                        <Button variant="ghost" size="icon">
                          <Repeat className="h-6 w-6" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <Send className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 w-full text-sm">
                    <p className="font-semibold">{post.likes.toLocaleString('tr-TR')} beğenme</p>
                    <SheetTrigger asChild onClick={() => setSelectedPost(post)}>
                       <p className="text-muted-foreground mt-1 cursor-pointer hover:underline">
                         {post.comments} yorumun tümünü gör
                       </p>
                    </SheetTrigger>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
        <SheetContent side="bottom" className="h-[80%] rounded-t-2xl flex flex-col">
            <SheetHeader className="text-center pt-2">
              <SheetTitle>Yorumlar</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Post owner's caption */}
              {selectedPost && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={selectedPost.userAvatar} alt={selectedPost.username} />
                      <AvatarFallback>{selectedPost.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-semibold">{selectedPost.username}</span>{' '}
                      <span className="text-foreground/90">
                        <Translation text={selectedPost.caption} sourceLanguage={selectedPost.language} />
                      </span>
                    </div>
                </div>
              )}
              <hr className="border-border"/>
              {/* Comments */}
              {mockCommentsData.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                   <Avatar className="h-8 w-8">
                     <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div className="text-sm">
                     <span className="font-semibold">{comment.user}</span>{' '}
                     <span className="text-foreground/90">
                       <Translation text={comment.text} sourceLanguage={comment.language} />
                     </span>
                   </div>
                </div>
              ))}
            </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
