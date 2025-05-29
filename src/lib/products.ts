
export interface Product {
  id: string;
  name: string;
  gender: 'men' | 'women' | 'unisex';
  type: 'clothing' | 'jewelry';
  imageUrl: string;
  description: string;
  price: string;
  hint: string;
}

const products: Product[] = [
  // Men's Clothing
  { id: 'm-cloth-1', name: 'Classic Denim Jacket', gender: 'men', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d34?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'A timeless denim jacket for a rugged look.', price: '$79.99', hint: 'denim jacket' },
  { id: 'm-cloth-2', name: 'Tailored Chinos', gender: 'men', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1604176354204-926873782855?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Versatile chinos for smart-casual occasions.', price: '$59.99', hint: 'mens pants' },
  { id: 'm-cloth-3', name: 'Graphic Print T-Shirt', gender: 'men', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Comfortable cotton t-shirt with a cool graphic.', price: '$29.99', hint: 'mens t-shirt' },
  
  // Men's Jewelry
  { id: 'm-jewel-1', name: 'Silver Link Bracelet', gender: 'men', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1611085725151-8390351f4675?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Sleek silver bracelet to complement any outfit.', price: '$120.00', hint: 'mens bracelet' },
  { id: 'm-jewel-2', name: 'Minimalist Steel Ring', gender: 'men', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1627292934211-92054a703852?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'A subtle yet stylish steel ring.', price: '$45.00', hint: 'mens ring' },

  // Women's Clothing
  { id: 'w-cloth-1', name: 'Floral Maxi Dress', gender: 'women', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Elegant floral maxi dress for sunny days.', price: '$89.99', hint: 'womens dress' },
  { id: 'w-cloth-2', name: 'High-Waisted Jeans', gender: 'women', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Flattering high-waisted jeans for a modern silhouette.', price: '$69.99', hint: 'womens jeans' },
  { id: 'w-cloth-3', name: 'Silk Blouse', gender: 'women', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1552422525-069af5374155?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Luxurious silk blouse for a touch of sophistication.', price: '$99.99', hint: 'womens blouse' },

  // Women's Jewelry
  { id: 'w-jewel-1', name: 'Pearl Drop Earrings', gender: 'women', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784f5723003?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Classic pearl drop earrings for timeless elegance.', price: '$75.00', hint: 'earrings' },
  { id: 'w-jewel-2', name: 'Gold Pendant Necklace', gender: 'women', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1617038220319-c6aba0bcf3f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Delicate gold pendant necklace, perfect for layering.', price: '$150.00', hint: 'necklace' },

  // Unisex items
  { id: 'u-cloth-1', name: 'Basic Hoodie', gender: 'unisex', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Comfortable and versatile basic hoodie.', price: '$49.99', hint: 'hoodie' },
  { id: 'u-jewel-1', name: 'Leather Cord Necklace', gender: 'unisex', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1508909397440-ea1669407c18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Simple leather cord necklace for a casual style.', price: '$30.00', hint: 'pendant necklace' },
];

export function getProducts(genderFilter?: 'men' | 'women' | 'all'): Product[] {
  if (!genderFilter || genderFilter === 'all') {
    return products;
  }
  return products.filter(p => p.gender === genderFilter || p.gender === 'unisex');
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}
