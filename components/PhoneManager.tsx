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
  const [isLoadingPhones, setIsLoadingPhones] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);

  const fetchPhones = async () => {
    setIsLoadingPhones(true);
    try {
      const response = await fetch('/api/phone');
      const data = await response.json();
      if (response.ok) {
        setPhones(data.phones);
      }
    } catch (err) {
      console.error('Failed to fetch phones:', err);
    } finally {
      setIsLoadingPhones(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Add Subscriber */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Phone className="w-8 h-8 text-blue-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Phone Subscribers</h2>
            {isLoadingPhones ? (
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-sm text-gray-600">{phones.length} active subscriber{phones.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition"
                disabled={loading}
              />
            </div>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'android' | 'apple')}
              className="w-full sm:w-auto px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 transition"
              disabled={loading}
            >
              <option value="android">Android</option>
              <option value="apple">Apple</option>
            </select>
            <button
              type="submit"
              disabled={loading || !newPhone}
              className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-700">{error}</p>
          )}
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoadingPhones ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-md animate-pulse"
                >
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : phones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No subscribers yet. Add a phone number to get started!</p>
            </div>
          ) : (
            phones.map((phone) => (
              <div
                key={phone.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  {phone.platform === 'android' ? (
                    <Smartphone className="w-5 h-5 text-green-600" />
                  ) : (
                    <Apple className="w-5 h-5 text-gray-700" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {anonymizePhone(phone.phone)}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {phone.platform}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Added {formatDateTime(phone.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Self-Service Unsubscribe */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-lg">
            <UserMinus className="w-8 h-8 text-red-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Unsubscribe</h2>
            <p className="text-sm text-gray-600">Remove your number from the mailing list</p>
          </div>
        </div>

        <form onSubmit={handleRemove} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="tel"
                value={removePhone}
                onChange={(e) => setRemovePhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition"
                disabled={removeLoading}
              />
            </div>
            <button
              type="submit"
              disabled={removeLoading || !removePhone}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserMinus className="w-5 h-5" />
              Unsubscribe
            </button>
          </div>

          {removeError && (
            <p className="text-sm text-red-700">{removeError}</p>
          )}

          {removeSuccess && (
            <p className="text-sm text-green-700">{removeSuccess}</p>
          )}
        </form>
      </div>
    </div>
  );
}
