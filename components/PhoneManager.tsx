'use client';

import { useState, useEffect } from 'react';
import { Phone, Plus, UserMinus, Smartphone, Apple } from 'lucide-react';

interface PhoneNumber {
  id: number;
  phone: string;
  platform: 'android' | 'apple';
  created_at: string;
}

export default function PhoneManager({ refreshTrigger }: { refreshTrigger: number }) {
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [platform, setPlatform] = useState<'android' | 'apple'>('android');
  const [removePhone, setRemovePhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);

  const fetchPhones = async () => {
    try {
      const response = await fetch('/api/phone');
      const data = await response.json();
      if (response.ok) {
        setPhones(data.phones);
      }
    } catch (err) {
      console.error('Failed to fetch phones:', err);
    }
  };

  useEffect(() => {
    fetchPhones();
  }, [refreshTrigger]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, platform }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        setNewPhone('');
        fetchPhones();
      }
    } catch (err) {
      setError('Failed to add phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemoveLoading(true);
    setRemoveError(null);
    setRemoveSuccess(null);

    try {
      const response = await fetch(`/api/phone?phone=${encodeURIComponent(removePhone)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setRemoveSuccess('Successfully unsubscribed from the mailing list!');
        setRemovePhone('');
        fetchPhones();
      } else {
        setRemoveError(data.error || 'Phone number not found');
      }
    } catch (err) {
      setRemoveError('Failed to remove phone number');
    } finally {
      setRemoveLoading(false);
    }
  };

  const anonymizePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      const last4 = cleaned.slice(-4);
      return `(***) ***-${last4}`;
    }
    return '****';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Add Subscriber */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Phone Subscribers</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{phones.length} active subscriber{phones.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'android' | 'apple')}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              disabled={loading}
            >
              <option value="android">Android</option>
              <option value="apple">Apple</option>
            </select>
            <button
              type="submit"
              disabled={loading || !newPhone}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {phones.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No subscribers yet. Add a phone number to get started!</p>
            </div>
          ) : (
            phones.map((phone) => (
              <div
                key={phone.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {phone.platform === 'android' ? (
                    <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Apple className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {anonymizePhone(phone.phone)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {phone.platform}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Self-Service Unsubscribe */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
            <UserMinus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Unsubscribe</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Remove your number from the mailing list</p>
          </div>
        </div>

        <form onSubmit={handleRemove} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="tel"
                value={removePhone}
                onChange={(e) => setRemovePhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                disabled={removeLoading}
              />
            </div>
            <button
              type="submit"
              disabled={removeLoading || !removePhone}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <UserMinus className="w-5 h-5" />
              Unsubscribe
            </button>
          </div>

          {removeError && (
            <p className="text-sm text-red-600 dark:text-red-400">{removeError}</p>
          )}

          {removeSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">{removeSuccess}</p>
          )}
        </form>
      </div>
    </div>
  );
}
