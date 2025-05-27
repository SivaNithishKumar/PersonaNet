import { getProducts, Product } from '@/lib/products';
import { ProductCard } from '@/components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import { Package, Diamond } from 'lucide-react';

interface ProductCollectionPageProps {
  params: {
    gender: 'men' | 'women' | 'all';
  };
}

export async function generateMetadata({ params }: ProductCollectionPageProps) {
  const genderDisplay = params.gender === 'all' ? 'All' : params.gender.charAt(0).toUpperCase() + params.gender.slice(1);
  return {
    title: `${genderDisplay} Collection - StyleSnap`,
    description: `Browse our collection of clothing and jewelry for ${params.gender}.`,
  };
}

export default function ProductCollectionPage({ params }: ProductCollectionPageProps) {
  const gender = params.gender;
  const products = getProducts(gender);

  const clothingItems = products.filter(p => p.type === 'clothing');
  const jewelryItems = products.filter(p => p.type === 'jewelry');

  const genderDisplay = gender === 'all' ? 'Our' : `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s`;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2 text-center">
        {genderDisplay} Collection
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Explore the latest trends and timeless pieces.
      </p>

      <Tabs defaultValue="clothing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto mb-6">
          <TabsTrigger value="clothing" className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Clothing
          </TabsTrigger>
          <TabsTrigger value="jewelry" className="flex items-center gap-2">
            <Diamond className="h-5 w-5" /> Jewelry
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="clothing">
          {clothingItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {clothingItems.map((product) => (
                <ProductCard key={product.id} product={product} genderContext={gender} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No clothing items found for this selection.</p>
          )}
        </TabsContent>
        <TabsContent value="jewelry">
           {jewelryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {jewelryItems.map((product) => (
                <ProductCard key={product.id} product={product} genderContext={gender} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No jewelry items found for this selection.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
