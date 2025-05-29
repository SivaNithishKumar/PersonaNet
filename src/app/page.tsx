
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Smile, Paperclip, Mic, Send, UserCircle } from 'lucide-react';
import Image from 'next/image';

export default function WhatsAppMockupPage() {
  const router = useRouter();

  const handleExploreCollection = () => {
    router.push('/all'); // Navigate to the main collection page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-800 font-sans">
      <div className="w-full max-w-md h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] md:max-h-[700px] bg-[#E5DDD5] dark:bg-[#0A1014] shadow-xl flex flex-col my-5 md:my-10 rounded-none md:rounded-lg overflow-hidden">
        {/* Chat Header */}
        <header className="bg-[#005E54] dark:bg-[#202C33] text-white p-3 flex items-center space-x-3">
          <ArrowLeft className="cursor-pointer" />
          <Image 
            src="https://placehold.co/40x40/78909C/FFFFFF?text=P&font=roboto" 
            alt="Pothys Textiles Profile" 
            width={40} 
            height={40} 
            className="rounded-full"
            data-ai-hint="logo initial"
          />
          <div className="flex-grow">
            <h1 className="font-semibold text-base">Pothys Textiles</h1>
            <p className="text-xs opacity-80">tap here for contact info</p>
          </div>
          <MoreVertical className="cursor-pointer" />
        </header>

        {/* Chat Area */}
        <main className="flex-grow overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-[#0B141A]">
          {/* Date Separator */}
          <div className="flex justify-center my-2">
            <span className="bg-[#E1F3FB] dark:bg-[#182229] text-[#5B88A5] dark:text-[#8696A0] text-xs px-2 py-1 rounded-md shadow">
              TODAY
            </span>
          </div>

          {/* Bot Message - Interactive Template */}
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#202C33] rounded-lg rounded-tl-none shadow p-3 max-w-xs md:max-w-sm relative">
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                🎉 Vanakkam! Welcome to Pothys! ✨
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                Discover our exquisite new collection of silks and jewelry, perfect for every occasion. Tap below to explore the latest arrivals and find your unique style!
              </p>
              
              <Button 
                onClick={handleExploreCollection}
                className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md transition-transform transform hover:scale-105"
              >
                🛍️ Explore Collection
              </Button>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                10:30 AM <span className="inline-block ml-1 text-blue-500 dark:text-sky-400">✓✓</span>
              </div>
               <div className="absolute left-[-8px] top-0 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-white dark:border-r-[#202C33] border-b-[0px] border-b-transparent"></div> {/* Tail */}
            </div>
          </div>
        </main>

        {/* Chat Input Footer */}
        <footer className="bg-gray-100 dark:bg-[#202C33] p-3 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700">
          <Smile className="text-gray-500 dark:text-gray-400 cursor-pointer h-6 w-6" />
          <input 
            type="text" 
            placeholder="Message (mockup)" 
            disabled 
            className="flex-grow p-2 rounded-full bg-white dark:bg-[#2A3942] border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:text-gray-200"
          />
          <Paperclip className="text-gray-500 dark:text-gray-400 cursor-pointer h-6 w-6 transform rotate-45" />
          {/* <Camera className="text-gray-500 dark:text-gray-400 cursor-pointer h-6 w-6" /> */}
          <button className="bg-green-500 dark:bg-emerald-500 text-white p-2.5 rounded-full shadow-md">
            <Mic className="h-5 w-5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
