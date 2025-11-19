'use client';

import { useState, useEffect } from 'react';
import { Coffee, Smartphone, Apple, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';
import PageTransition from './PageTransition';

export default function SimpleLanding() {
  const [phone, setPhone] = useState('');
  const [platform, setPlatform] = useState<'android' | 'apple'>('android');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ phone: string; campaignCount: number } | null>(null);
  const [validCampaignCount, setValidCampaignCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [displayCount, setDisplayCount] = useState<number>(0);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  useEffect(() => {
    fetchValidCampaignCount();
  }, []);

  useEffect(() => {
    // Animate random numbers while loading
    if (loadingCount) {
      const interval = setInterval(() => {
        setDisplayCount(Math.floor(Math.random() * 10));
      }, 100);
      return () => clearInterval(interval);
    } else {
      // When loading is done, settle on the actual count
      setDisplayCount(validCampaignCount);
    }
  }, [loadingCount, validCampaignCount]);

  const fetchValidCampaignCount = async () => {
    try {
      const response = await fetch('/api/campaigns/count');
      if (response.ok) {
        const data = await response.json();
        setValidCampaignCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch campaign count:', err);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Add the phone number - backend will automatically send all campaigns
      const response = await fetch('/api/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, platform }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add phone number');
        setLoading(false);
        return;
      }

      // Backend returns the number of campaigns sent
      const sentCount = data.sent ? data.sent.length : 0;

      setSuccess({ phone, campaignCount: sentCount });
      setPhone('');
      fetchValidCampaignCount(); // Refresh count
    } catch (err) {
      setError('Failed to add phone number. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
              <Coffee className="w-10 h-10 text-amber-700" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Coffree
            </h1>
            {loadingCount ? (
              <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
            ) : (
              <p className="text-lg text-gray-600">
                Add your phone number to receive{' '}
                <span className="font-bold text-amber-700">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={displayCount}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="inline-block"
                    >
                      {displayCount}
                    </motion.span>
                  </AnimatePresence>
                  {' '}free Capital One drink voucher{displayCount !== 1 ? 's' : ''}
                </span>
                {' '}now and join the mailing list
              </p>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlatform('android')}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                      platform === 'android'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="font-medium">Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('apple')}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                      platform === 'apple'
                        ? 'border-gray-700 bg-gray-50 text-gray-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Apple className="w-5 h-5" />
                    <span className="font-medium">Apple</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !phone || loadingCount}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {validCampaignCount > 0 ? 'Sending your free coffee texts...' : 'Adding to the mailing list...'}
                  </>
                ) : (
                  <>
                    <Coffee className="w-5 h-5" />
                    Get Free Coffee
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-900">Success!</p>
                    {success.campaignCount > 0 ? (
                      <>
                        <p className="text-sm text-green-700">
                          You should have received <span className="font-semibold">{success.campaignCount} text message{success.campaignCount !== 1 ? 's' : ''}</span> with free coffee vouchers!
                        </p>
                        <p className="text-sm text-green-700">
                          Check your texts and make sure to add {success.campaignCount !== 1 ? 'them' : 'it'} to your {platform === 'apple' ? 'Apple' : 'Google'} Wallet.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-green-700">
                        Phone number added! You'll receive vouchers as they become available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Text */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By adding your number, you agree to receive SMS messages with Capital One coffee vouchers.
            </p>
          </div>
        </div>
      </PageTransition>

      <Footer />
    </div>
  );
}
