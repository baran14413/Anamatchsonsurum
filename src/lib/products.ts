
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
  // Super Like Packages
  {
    id: '5listars',
    type: 'superlike',
    title: '5x Süperlike',
    description: 'Dikkatleri üzerine çekmek için küçük bir destek.',
    price: '₺25.00',
  },
];

export const getProductById = (productId: string): Product | undefined => {
  return products.find(p => p.id === productId);
}
