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
  { id: 'm-cloth-1', name: 'Classic Denim Jacket', gender: 'men', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1604272832934-fd899370e00c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'A timeless denim jacket for a rugged look.', price: '$79.99', hint: 'denim jacket' },
  { id: 'm-cloth-2', name: 'Tailored Chinos', gender: 'men', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1594600382102-588031daddc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Versatile chinos for smart-casual occasions.', price: '$59.99', hint: 'mens pants' },
  { id: 'm-cloth-3', name: 'Graphic Print T-Shirt', gender: 'men', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Comfortable cotton t-shirt with a cool graphic.', price: '$29.99', hint: 'mens t-shirt' },
  
  // Men's Jewelry
  { id: 'm-jewel-1', name: 'Silver Link Bracelet', gender: 'men', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1620656099484-0c1a06019d59?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Sleek silver bracelet to complement any outfit.', price: '$120.00', hint: 'mens bracelet' },
  { id: 'm-jewel-2', name: 'Minimalist Steel Ring', gender: 'men', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1560114954-0d9f30402474?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'A subtle yet stylish steel ring.', price: '$45.00', hint: 'mens ring' },

  // Women's Clothing
  { id: 'w-cloth-1', name: 'Floral Maxi Dress', gender: 'women', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1595231712730-93f650065810?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Elegant floral maxi dress for sunny days.', price: '$89.99', hint: 'womens dress' },
  { id: 'w-cloth-2', name: 'High-Waisted Jeans', gender: 'women', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Flattering high-waisted jeans for a modern silhouette.', price: '$69.99', hint: 'womens jeans' },
  { id: 'w-cloth-3', name: 'Silk Blouse', gender: 'women', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1589465885857-44ed4705ff18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Luxurious silk blouse for a touch of sophistication.', price: '$99.99', hint: 'womens blouse' },

  // Women's Jewelry
  { id: 'w-jewel-1', name: 'Pearl Drop Earrings', gender: 'women', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1610173828108-58038dd892a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Classic pearl drop earrings for timeless elegance.', price: '$75.00', hint: 'earrings' },
  { id: 'w-jewel-2', name: 'Gold Pendant Necklace', gender: 'women', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1599643477877-53a86a66e837?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Delicate gold pendant necklace, perfect for layering.', price: '$150.00', hint: 'necklace' },

  // Unisex items
  { id: 'u-cloth-1', name: 'Basic Hoodie', gender: 'unisex', type: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a6375bd8b01?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Comfortable and versatile basic hoodie.', price: '$49.99', hint: 'hoodie' },
  { id: 'u-jewel-1', name: 'Leather Cord Necklace', gender: 'unisex', type: 'jewelry', imageUrl: 'https://images.unsplash.com/photo-1619119447029-28f1f798358c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', description: 'Simple leather cord necklace for a casual style.', price: '$30.00', hint: 'pendant necklace' },
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
