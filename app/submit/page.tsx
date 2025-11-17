'use client';

import CoffeeLinkForm from '@/components/CoffeeLinkForm';
import { Coffee, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

export default function SubmitPage() {
  const handleSendSuccess = () => {
    // Link sent successfully
  };

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

      {/* Main Content */}
      <PageTransition>
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                <Coffee className="w-10 h-10 text-amber-700" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Submit Coffee Link
              </h1>
              <p className="text-lg text-gray-600">
                Share Capital One coffee vouchers with subscribers
              </p>
            </div>

            {/* Coffee Link Form */}
            <CoffeeLinkForm onSendSuccess={handleSendSuccess} />
          </div>
      </PageTransition>

      <Footer />
    </div>
  );
}
