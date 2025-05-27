"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Users, Sparkles } from 'lucide-react';

interface GenderOption {
  id: 'men' | 'women' | 'all';
  label: string;
  icon: React.ElementType;
  description: string;
}

const genderOptions: GenderOption[] = [
  { id: 'men', label: 'For Men', icon: User, description: 'Explore styles curated for men.' },
  { id: 'women', label: 'For Women', icon: User, description: 'Discover fashion trends for women.' },
  { id: 'all', label: 'Discover All', icon: Users, description: 'Browse our entire collection.' },
];

export function GenderSelector() {
  const router = useRouter();

  const handleSelectGender = (gender: 'men' | 'women' | 'all') => {
    router.push(`/${gender}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {genderOptions.map((option) => (
        <Card 
          key={option.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 bg-card"
          onClick={() => handleSelectGender(option.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSelectGender(option.id)}
          aria-label={`Select ${option.label}`}
        >
          <CardHeader className="items-center text-center">
            <option.icon className="w-12 h-12 mb-4 text-primary" />
            <CardTitle className="text-2xl">{option.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>{option.description}</CardDescription>
            <Button variant="default" className="mt-6 w-full bg-primary hover:bg-primary/90">
              Explore Now <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
