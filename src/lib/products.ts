
export interface Product {
  id: string;
  type: 'gold' | 'superlike';
  title: string;
  description: string;
  price: string;
}

export const products: Product[] = [
  // Gold Üyelik Paketleri
  {
    id: 'bematch_gold_1_month',
    type: 'gold',
    title: '1 Aylık Gold',
    description: 'Bir ay boyunca tüm Gold ayrıcalıklarının tadını çıkar.',
    price: '₺49.99',
  },
  {
    id: 'bematch_gold_6_months',
    type: 'gold',
    title: '6 Aylık Gold',
    description: 'Daha uzun süreli erişim, daha fazla avantaj.',
    price: '₺249.99',
  },
  {
    id: 'bematch_gold_1_year',
    type: 'gold',
    title: '1 Yıllık Gold',
    description: 'Tüm yıl boyunca sınırsız BeMatch deneyimi.',
    price: '₺399.99',
  },
  // Super Like Paketleri
  {
    id: 'bematch_superlike_5',
    type: 'superlike',
    title: '5 Super Like',
    description: 'Dikkatleri üzerine çekmek için küçük bir destek.',
    price: '₺19.99',
  },
  {
    id: 'bematch_superlike_25',
    type: 'superlike',
    title: '25 Super Like',
    description: 'Eşleşme şansını anında artır.',
    price: '₺79.99',
  },
  {
    id: 'bematch_superlike_60',
    type: 'superlike',
    title: '60 Super Like',
    description: 'En popüler paketle şansını en üst düzeye çıkar.',
    price: '₺149.99',
  },
];

export const getProductById = (productId: string): Product | undefined => {
  return products.find(p => p.id === productId);
}
