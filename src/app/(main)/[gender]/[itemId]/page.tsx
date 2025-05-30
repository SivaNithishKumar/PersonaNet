
import { getProductById, type Product } from '@/lib/products';
import { TryOnClient } from '@/components/TryOnClient';
import { notFound } from 'next/navigation';

// Define TryOnPageProps here
export interface TryOnPageProps {
  params: {
    gender: 'men' | 'women' | 'all';
    itemId: string;
  };
}

export async function generateMetadata({ params }: TryOnPageProps) {
  const product = getProductById(params.itemId);
  if (!product) {
    return {
      title: "Product Not Found - StyleSnap",
    };
  }
  return {
    title: `Try On ${product.name} - StyleSnap`,
    description: `Virtually try on ${product.name}. Upload your photo and see how it looks!`,
  };
}

export default async function TryOnPage({ params }: TryOnPageProps) {
  const product = getProductById(params.itemId);

  if (!product) {
    notFound();
  }

  // Product is guaranteed to exist here
  return <TryOnClient params={params} product={product} />;
}
