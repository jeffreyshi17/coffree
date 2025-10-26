'use client';

import { useState } from 'react';
import MessageLogs from '@/components/MessageLogs';
import { ArrowLeft, Coffee } from 'lucide-react';
import Link from 'next/link';

export default function LogsPage() {
  const [refreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-4xl">☕</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Message Logs
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View all sent coffee links
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <MessageLogs refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
}
