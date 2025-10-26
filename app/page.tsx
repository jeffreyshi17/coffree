'use client';

import { useState } from 'react';
import CoffeeLinkForm from '@/components/CoffeeLinkForm';
import PhoneManager from '@/components/PhoneManager';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSendSuccess = () => {
    // Trigger a refresh of components
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-5xl">☕</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  FreeCoffee
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Capital One Coffee Redemption Automation
                </p>
              </div>
            </div>
            <Link
              href="/logs"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileText className="w-5 h-5" />
              View Logs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 space-y-8">
        {/* Coffee Link Form */}
        <section>
          <CoffeeLinkForm onSendSuccess={handleSendSuccess} />
        </section>

        {/* Phone Number Management */}
        <section>
          <PhoneManager refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
}
