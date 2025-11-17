'use client';

import { useState } from 'react';
import { Coffee, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SendResult {
  success: boolean;
  message: string;
  results?: Array<{
    phone: string;
    success: boolean;
    error?: string;
  }>;
  campaignId?: string;
  marketingChannel?: string;
}

export default function CoffeeLinkForm({ onSendSuccess }: { onSendSuccess: () => void }) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/send-coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send coffee link');
      } else {
        setResult(data);
        setLink('');
        onSendSuccess();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
              Capital One Coffee Link
            </label>
            <input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy"
              className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !link}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send to All Subscribers
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Success!</p>
                <p className="text-sm text-green-700">{result.message}</p>
                {result.campaignId && (
                  <div className="mt-2 text-xs text-green-700">
                    Campaign: {result.campaignId} | Channel: {result.marketingChannel}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
