"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Smile, Paperclip, Mic, Camera, CheckCircle, ExternalLink, ShoppingBag, Sparkles, Tag, Gift } from 'lucide-react'; // Added relevant icons
import Image from 'next/image';
import Link from 'next/link';

export default function WhatsAppMockupPage() {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/all'); // Navigate to a relevant Pothys collection page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 dark:bg-neutral-900 font-sans">
      <div className="w-full max-w-md h-[calc(100vh-20px)] md:h-[calc(100vh-40px)] md:max-h-[750px] bg-[#E5DDD5] dark:bg-[#0B141A] shadow-2xl flex flex-col my-2.5 md:my-5 rounded-none md:rounded-xl overflow-hidden">
        {/* Chat Header */}
        <header className="bg-[#005E54] dark:bg-[#1F2C34] text-white p-3 flex items-center space-x-3 shadow-sm">
          <ArrowLeft className="cursor-pointer h-6 w-6" onClick={() => router.back()} />
          {/* Placeholder for Pothys Logo - ideally replace with actual logo URL if available */}
          <Image
            src="https://via.placeholder.com/40x40/D94A2D/FFFFFF?Text=P" // Orange-red background, white text P
            alt="Pothys Profile"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="flex-grow">
            <div className="flex items-center space-x-1">
              <h1 className="font-semibold text-base">Pothys</h1>
              {/* Verified tick can be optional for a brand like Pothys, or added if they have it */}
              {/* <CheckCircle className="h-4 w-4 text-sky-400 fill-current" /> */}
            </div>
            <p className="text-xs opacity-80">Online Shopping</p>
          </div>
          <MoreVertical className="cursor-pointer h-6 w-6" />
        </header>

        {/* Chat Area */}
        <main className="flex-grow overflow-y-auto p-4 space-y-2 bg-[url('/whatsapp-bg-light.png')] dark:bg-[url('/whatsapp-bg-dark.png')] bg-repeat dark:bg-[#0B141A]">
          {/* Date Separator */}
          <div className="flex justify-center my-3">
            <span className="bg-[#E1F3FB] dark:bg-[#121B22] text-gray-600 dark:text-gray-400 text-xs px-2.5 py-1 rounded-lg shadow">
              TODAY
            </span>
          </div>

          {/* Bot Message - Pothys Welcome & Offer */}
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#202C33] rounded-lg rounded-tl-none shadow-md p-3 max-w-[90%] relative text-sm text-gray-800 dark:text-gray-200">
              <p className="font-semibold text-base mb-1 text-[#005E54] dark:text-emerald-400">Vanakkam from Pothys!</p>
              <p className="mb-2">
                Explore our exquisite collection of traditional sarees, stunning jewelry, and the latest fashion trends. 🛍️✨
              </p>
              
              {/* Optional: Placeholder for a promotional image if desired */}
              {/* <div className="my-3 rounded-md overflow-hidden border dark:border-gray-700">
                <Image 
                  src="https://via.placeholder.com/300x200/F0E68C/8B4513?text=Pothys+Saree+Collection" 
                  alt="Pothys Collection Highlight" 
                  width={300} 
                  height={200} 
                  className="object-cover w-full"
                />
              </div> */}
              
              <p className="my-2 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded-md border border-yellow-300 dark:border-yellow-700">
                <Gift className="inline-block h-4 w-4 mr-1.5 text-yellow-600 dark:text-yellow-400" />
                Special Welcome Offer! Use code <span className="font-semibold text-red-600 dark:text-red-400">WELCOME10</span> to get <span className="font-semibold">10% OFF</span> on your first order. *T&C apply.
              </p>

              <p className="my-2">
                Discover our new arrivals:
              </p>
              <ul className="list-none space-y-1 text-sm pl-1 mb-2">
                <li className="flex items-center"><Sparkles className="h-4 w-4 mr-2 text-pink-500"/> Kancheepuram Silk Sarees</li>
                <li className="flex items-center"><Sparkles className="h-4 w-4 mr-2 text-pink-500"/> Designer Jewelry Collection</li>
                <li className="flex items-center"><Sparkles className="h-4 w-4 mr-2 text-pink-500"/> Festive Wear for the whole family</li>
              </ul>
              
              <p className="mb-1">
                Tap below to start shopping! 👇
              </p>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                10:19 AM {/* Example timestamp */}
              </div>
              <div className="absolute left-[-8px] top-0 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-white dark:border-r-[#202C33] border-b-[0px] border-b-transparent"></div> {/* Tail */}
            </div>
          </div>

          {/* Interactive Buttons Section */}
          <div className="flex flex-col items-center mt-3 space-y-1.5">
            <Button
              onClick={handleNavigate}
              className="w-full max-w-[90%] bg-[#00A884] hover:bg-[#00876B] text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md flex items-center justify-center space-x-2 py-2.5"
            >
              <ShoppingBag className="h-4 w-4" /> 
              <span>Explore Collections</span>
            </Button>
             <div className="w-full max-w-[90%] flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 px-3 py-1 mt-1">
              <span>Reply STOP to Unsubscribe</span>
              {/* Timestamp for unsubscribe can be omitted or kept simple */}
            </div>
          </div>

        </main>

        {/* Chat Input Footer */}
        <footer className="bg-gray-100 dark:bg-[#1F2C34] p-2.5 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700">
          <Smile className="text-gray-500 dark:text-gray-400 cursor-pointer h-6 w-6" />
          <input
            type="text"
            placeholder="Message"
            disabled
            className="flex-grow p-2.5 rounded-full bg-white dark:bg-[#2A3942] border border-gray-300 dark:border-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <Paperclip className="text-gray-500 dark:text-gray-400 cursor-pointer h-6 w-6 transform -rotate-45" />
          <Camera className="text-gray-500 dark:text-gray-400 cursor-pointer h-6 w-6" />
          <button className="bg-[#008069] dark:bg-emerald-600 text-white p-2.5 rounded-full shadow-md">
            <Mic className="h-5 w-5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
