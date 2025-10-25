
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
  // Gold Packages
  {
    id: 'gold.1month',
    type: 'gold',
    title: '1 Ay Gold',
    description: 'Bir ay boyunca tüm Gold ayrıcalıklarının keyfini çıkar.',
    price: '₺99.99',
  },
  {
    id: 'gold.6months',
    type: 'gold',
    title: '6 Ay Gold',
    description: 'En popüler seçenekle uzun süreli avantajlar.',
    price: '₺299.99',
  },
  {
    id: 'gold.12months',
    type: 'gold',
    title: '1 Yıl Gold',
    description: 'En ekonomik paketle bir yıl boyunca sınırsız deneyim.',
    price: '₺499.99',
  },
  // Super Like Packages
  {
    id: 'superlike.5',
    type: 'superlike',
    title: '5x Süper Beğeni',
    description: 'Dikkatleri üzerine çekmek için küçük bir destek.',
    price: '₺24.99',
  },
  {
    id: 'superlike.25',
    type: 'superlike',
    title: '25x Süper Beğeni',
    description: 'Eşleşme şansını anında artır.',
    price: '₺99.99',
  },
  {
    id: 'superlike.60',
    type: 'superlike',
    title: '60x Süper Beğeni',
    description: 'En avantajlı paketle farkını ortaya koy.',
    price: '₺199.99',
  },
];

export const getProductById = (productId: string): Product | undefined => {
  return products.find(p => p.id === productId);
}
