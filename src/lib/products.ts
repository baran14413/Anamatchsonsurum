
export interface Product {
  id: string;
  type: 'gold' | 'superlike';
  title: string;
  description: string;
  price: string;
}

export const products: Product[] = [
  // Gold Üyelik Paketi
  {
    id: 'aylikgold',
    type: 'gold',
    title: '1 Aylık Gold',
    description: 'Bir ay boyunca tüm Gold ayrıcalıklarının tadını çıkar.',
    price: '₺100.00',
  },
  // Super Like Paketi
  {
    id: '5listar',
    type: 'superlike',
    title: '5x Süperlike',
    description: 'Dikkatleri üzerine çekmek için küçük bir destek.',
    price: '₺10.00',
  },
];

export const getProductById = (productId: string): Product | undefined => {
  return products.find(p => p.id === productId);
}
