import { useState, useEffect, useCallback } from 'react';
import { getCampaignCount, type CampaignCount } from '../services/campaignService';

interface UseCampaignsReturn {
  data: CampaignCount | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch campaign count data
 * Returns campaign count and distributed voucher count
 */
export function useCampaigns(): UseCampaignsReturn {
  const [data, setData] = useState<CampaignCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCampaignCount();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign count');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
