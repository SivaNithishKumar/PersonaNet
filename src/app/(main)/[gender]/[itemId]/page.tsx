
import { getProductById } from '@/lib/products';
import { TryOnClient } from '@/components/TryOnClient';

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

export default function TryOnPage({ params }: TryOnPageProps) {
  // This page is now a Server Component.
  // It will render the TryOnClient component, which handles client-side logic.
  return <TryOnClient params={params} />;
}
