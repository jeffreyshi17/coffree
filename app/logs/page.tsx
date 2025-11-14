'use client';

import SearchTracker from '@/components/SearchTracker';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-md transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-4xl">☕</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Logs
                </h1>
                <p className="text-sm text-gray-600">
                  View campaigns, history, and messages
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <SearchTracker />
      </main>
    </div>
  );
}
