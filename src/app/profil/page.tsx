import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import Image from "next/image";

const mockUser = {
  name: "Sen",
  email: "sen@ornek.com",
  age: 29,
  avatar: "https://picsum.photos/seed/currentuser/200/200",
  bio: "Macerayı seven, yeni şeyler denemekten korkmayan biriyim. Seninle tanışmak için sabırsızlanıyorum!",
  interests: ["Müzik", "Sinema", "Yazılım", "Spor"],
  images: [
    "https://picsum.photos/seed/myprofile1/400/500",
    "https://picsum.photos/seed/myprofile2/400/500",
    "https://picsum.photos/seed/myprofile3/400/500",
  ],
};

export default function ProfilPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profilim</h1>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Profili Düzenle
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={mockUser.avatar} alt={mockUser.name} data-ai-hint="person avatar" />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {mockUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold">{mockUser.name}, {mockUser.age}</h2>
              <p className="text-muted-foreground">{mockUser.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hakkımda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{mockUser.bio}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>İlgi Alanları</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {mockUser.interests.map((interest) => (
                <Badge key={interest} variant="secondary">{interest}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Fotoğraflarım</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {mockUser.images.map((src, index) => (
                  <div key={index} className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden relative shadow-md">
                    <Image src={src} alt={`User image ${index + 1}`} fill className="object-cover" data-ai-hint="person lifestyle"/>
                  </div>
                ))}
                <div className="aspect-w-3 aspect-h-4 rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center">
                  <Button variant="ghost" className="flex flex-col h-full w-full">
                    <Edit className="h-8 w-8 text-muted-foreground"/>
                    <span className="mt-2 text-sm text-muted-foreground">Fotoğraf Ekle</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
