
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockPosts } from '@/lib/data';
import { Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { langTr } from '@/languages/tr';
import { Translation } from '@/components/translation';

export default function KesfetPage() {
  const t = langTr.kesfet;
  
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-md mx-auto py-4 space-y-6">
        {mockPosts.map((post) => (
          <Card key={post.id} className="rounded-xl overflow-hidden shadow-none border-0">
            {/* Post Header */}
            <div className="flex items-center p-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={post.userAvatar} alt={post.username} />
                <AvatarFallback>{post.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="ml-3 font-semibold text-sm">{post.username}</span>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                <MoreHorizontal size={20} />
              </Button>
            </div>

            {/* Post Content */}
            {post.imageUrl ? (
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={post.imageUrl}
                  alt={post.caption}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={post.id === 'post1'}
                />
              </div>
            ) : (
                <div className="px-4 pb-2">
                     <p className="text-sm">
                        <Translation text={post.caption} sourceLanguage={post.language} />
                     </p>
                </div>
            )}
            

            {/* Post Actions */}
            <div className="flex items-center px-2 py-2">
              <Button variant="ghost" size="icon">
                <Heart size={24} />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle size={24} />
              </Button>
              <Button variant="ghost" size="icon">
                <Send size={24} />
              </Button>
            </div>
            
            {/* Likes and Caption */}
            <CardContent className="px-4 pt-0 pb-4">
                <p className="text-sm font-semibold">{t.likes.replace('{count}', post.likes.toLocaleString('tr-TR'))}</p>
                {post.imageUrl && (
                     <p className="text-sm mt-1">
                        <span className="font-semibold mr-1">{post.username}</span>
                        <Translation text={post.caption} sourceLanguage={post.language} />
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 cursor-pointer hover:underline">
                    {t.viewAllComments.replace('{count}', post.comments.toString())}
                </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
