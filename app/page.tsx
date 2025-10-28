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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-5xl">☕</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Coffree
                </h1>
                <p className="text-sm text-gray-600">
                  Capital One Coffee Redemption Automation
                </p>
              </div>
            </div>
            <Link
              href="/logs"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
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
