import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  genderContext: 'men' | 'women' | 'all';
}

export function ProductCard({ product, genderContext }: ProductCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <Link href={`/${genderContext}/${product.id}`} aria-label={`View details for ${product.name}`}>
        <CardHeader className="p-0">
          <div className="aspect-[3/4] relative w-full">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={product.hint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-semibold truncate">{product.name}</CardTitle>
          <p className="text-sm text-muted-foreground capitalize">{product.type}</p>
          <p className="text-lg font-bold text-primary mt-1">{product.price}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/${genderContext}/${product.id}`}>
            Try On <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
