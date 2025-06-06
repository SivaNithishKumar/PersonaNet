import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shirt } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Shirt className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">StyleSnap</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
