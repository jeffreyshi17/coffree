import { useState, useEffect, useCallback } from 'react';
import {
  getPhones,
  addPhone,
  deletePhone,
  updatePushToken,
  type PhoneNumber,
  type AddPhoneRequest,
} from '../services/phoneService';

interface UseSubscriptionReturn {
  phones: PhoneNumber[];
  loading: boolean;
  error: string | null;
  addSubscription: (request: AddPhoneRequest) => Promise<{ success: boolean; error?: string; sent?: string[] }>;
  removeSubscription: (phoneId: number) => Promise<{ success: boolean; error?: string }>;
  updateToken: (phoneId: number, pushToken: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage phone number subscriptions
 * Provides methods to add, remove, and update subscriptions
 */
export function useSubscription(): UseSubscriptionReturn {
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPhones();
      setPhones(result.phones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
      setPhones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhones();
  }, [fetchPhones]);

  const addSubscription = useCallback(
    async (request: AddPhoneRequest): Promise<{ success: boolean; error?: string; sent?: string[] }> => {
      try {
        const result = await addPhone(request);
        if (result.success) {
          await fetchPhones();
          return { success: true, sent: result.sent };
        }
        return { success: false, error: result.error };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to add subscription',
        };
      }
    },
    [fetchPhones]
  );

  const removeSubscription = useCallback(
    async (phoneId: number): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await deletePhone(phoneId);
        if (result.success) {
          await fetchPhones();
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to remove subscription',
        };
      }
    },
    [fetchPhones]
  );

  const updateToken = useCallback(
    async (phoneId: number, pushToken: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await updatePushToken(phoneId, pushToken);
        if (result.success) {
          await fetchPhones();
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update push token',
        };
      }
    },
    [fetchPhones]
  );

  return {
    phones,
    loading,
    error,
    addSubscription,
    removeSubscription,
    updateToken,
    refetch: fetchPhones,
  };
}
