import { useState, useEffect, useCallback } from 'react';
import { getCampaigns, type Campaign } from '../services/campaignService';
import { getCachedItem, setCachedItem, STORAGE_KEYS } from '../lib/storage';

interface UseCampaignsReturn {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch campaigns list with offline-first cache strategy
 * Returns list of valid, non-expired campaigns
 *
 * Cache-first strategy:
 * 1. Load from cache immediately (instant data)
 * 2. Fetch fresh data from network in background
 * 3. Update cache and state with fresh data
 * 4. If network fails but cache exists, continue showing cached data
 */
export function useCampaigns(): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Load from cache first (instant display)
      const cachedCampaigns = await getCachedItem<Campaign[]>(STORAGE_KEYS.CAMPAIGNS);
      if (cachedCampaigns && cachedCampaigns.length > 0) {
        setCampaigns(cachedCampaigns);
        setLoading(false);
      }

      // Step 2: Fetch fresh data from network
      const freshCampaigns = await getCampaigns();

      // Step 3: Update cache and state with fresh data
      await setCachedItem(STORAGE_KEYS.CAMPAIGNS, freshCampaigns);
      setCampaigns(freshCampaigns);
      setError(null);
    } catch (err) {
      // Step 4: Handle errors gracefully
      // If we have cached data, don't show error (offline mode)
      const cachedCampaigns = await getCachedItem<Campaign[]>(STORAGE_KEYS.CAMPAIGNS);
      if (cachedCampaigns && cachedCampaigns.length > 0) {
        setCampaigns(cachedCampaigns);
        setError(null);
      } else {
        // No cache available, show error
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
        setCampaigns([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchData,
  };
}
