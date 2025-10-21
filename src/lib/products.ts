
export interface Product {
  id: string;
  type: 'gold' | 'superlike';
  title: string;
  description: string;
  price: string;
}

// Product IDs updated to follow a more standard convention like 'app.type.duration_or_amount'
// This helps prevent potential conflicts and makes management in the Play Console easier.
export const products: Product[] = [
  // Gold Membership Packages
  {
    id: 'bematch.gold.1month',
    type: 'gold',
    title: '1 Aylık Gold',
    description: 'Bir ay boyunca tüm Gold ayrıcalıklarının tadını çıkar.',
    price: '₺100.00',
  },
  {
    id: 'bematch.gold.6months',
    type: 'gold',
    title: '6 Aylık Gold',
    description: '6 ay boyunca Gold üye ol, tasarruf et.',
    price: '₺450.00',
  },
  {
    id: 'bematch.gold.1year',
    type: 'gold',
    title: '1 Yıllık Gold',
    description: 'Tam bir yıl boyunca sınırsız deneyim.',
    price: '₺700.00',
  },
  // Super Like Packages
  {
    id: '5listars',
    type: 'superlike',
    title: '5x Süperlike',
    description: 'Dikkatleri üzerine çekmek için küçük bir destek.',
    price: '₺25.00',
  },
    {
    id: 'bematch.superlike.25',
    type: 'superlike',
    title: '25x Süperlike',
    description: 'Eşleşme şansını ciddi şekilde artır.',
    price: '₺100.00',
  },
    {
    id: 'bematch.superlike.60',
    type: 'superlike',
    title: '60x Süperlike',
    description: 'En popüler paketle oyunun kurallarını değiştir.',
    price: '₺200.00',
  },
];

export const getProductById = (productId: string): Product | undefined => {
  return products.find(p => p.id === productId);
}
