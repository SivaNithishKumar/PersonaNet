"use client";

import { GenderSelector } from '@/components/GenderSelector';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 dark:from-background dark:to-secondary/10 p-4">
      <header className="text-center mb-12 mt-8">
        <h1 className="text-5xl md:text-6xl font-bold text-primary animate-fadeInUp">
          Welcome to StyleSnap
        </h1>
        <p className="mt-4 text-xl text-foreground/80 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          Discover your next look with AI-powered virtual try-on. Select a category to begin.
        </p>
      </header>

      <main className="container mx-auto px-4 py-8 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
        <GenderSelector />
      </main>

      <footer className="text-center py-12 text-foreground/60 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
        <p className="flex items-center justify-center">
          <Sparkles className="h-5 w-5 mr-2 text-accent" />
          Revolutionizing fashion with cutting-edge AI.
        </p>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
