'use client';

import SearchTracker from '@/components/SearchTracker';
import { ArrowLeft, Coffee } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

export default function LogsPage() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/coffee-bg.png)',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/60" />

      {/* Main Content - Fixed Height with Internal Scrolling */}
      <PageTransition>
          <div className="max-w-3xl w-full flex flex-col">
            {/* Header - Fixed */}
            <div className="text-center mb-6 flex-shrink-0">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                <Coffee className="w-8 h-8 text-blue-700" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Logs
              </h1>
              <p className="text-base text-gray-600">
                View campaigns, history, and messages
              </p>
            </div>

            {/* Logs Content - Scrollable */}
            <div className="overflow-y-auto max-h-[600px]">
              <SearchTracker />
            </div>
          </div>
      </PageTransition>

      <Footer />
    </div>
  );
}
