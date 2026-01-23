import { renderHook, waitFor } from '@testing-library/react-native';
import { useCampaigns } from '../useCampaigns';
import * as campaignService from '../../services/campaignService';
import * as storage from '../../lib/storage';

jest.mock('../../services/campaignService');
jest.mock('../../lib/storage');

describe('useCampaigns', () => {
  const mockCampaigns = [
    {
      id: 1,
      campaign_id: 'test123',
      marketing_channel: 'email',
      full_link: 'https://coffree.capitalone.com/sms/?cid=test123&mc=email',
      is_valid: true,
      is_expired: false,
      first_seen_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load cached campaigns immediately', async () => {
    (storage.getCachedItem as jest.Mock).mockResolvedValue(mockCampaigns);
    (campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);

    const { result } = renderHook(() => useCampaigns());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.campaigns).toEqual([]);

    // Wait for cache to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.campaigns).toEqual(mockCampaigns);
    expect(result.current.error).toBeNull();
  });

  it('should fetch fresh data and update state', async () => {
    const cachedCampaigns = [mockCampaigns[0]];
    const freshCampaigns = [...mockCampaigns, { ...mockCampaigns[0], id: 2 }];

    (storage.getCachedItem as jest.Mock).mockResolvedValue(cachedCampaigns);
    (campaignService.getCampaigns as jest.Mock).mockResolvedValue(freshCampaigns);
    (storage.setCachedItem as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCampaigns());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have fresh campaigns
    expect(result.current.campaigns).toEqual(freshCampaigns);
    expect(storage.setCachedItem).toHaveBeenCalledWith(
      storage.STORAGE_KEYS.CAMPAIGNS,
      freshCampaigns
    );
  });

  it('should handle error gracefully with cached data', async () => {
    (storage.getCachedItem as jest.Mock).mockResolvedValue(mockCampaigns);
    (campaignService.getCampaigns as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useCampaigns());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should show cached campaigns despite network error
    expect(result.current.campaigns).toEqual(mockCampaigns);
    expect(result.current.error).toBeNull();
  });

  it('should show error when no cache and network fails', async () => {
    (storage.getCachedItem as jest.Mock).mockResolvedValue(null);
    (campaignService.getCampaigns as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useCampaigns());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.campaigns).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should refetch campaigns when refetch is called', async () => {
    (storage.getCachedItem as jest.Mock).mockResolvedValue(mockCampaigns);
    (campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (storage.setCachedItem as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCampaigns());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock to track refetch call
    jest.clearAllMocks();
    (storage.getCachedItem as jest.Mock).mockResolvedValue(mockCampaigns);
    (campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (storage.setCachedItem as jest.Mock).mockResolvedValue(undefined);

    // Call refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(campaignService.getCampaigns).toHaveBeenCalled();
    });
  });

  it('should handle empty cached campaigns', async () => {
    (storage.getCachedItem as jest.Mock).mockResolvedValue([]);
    (campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (storage.setCachedItem as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCampaigns());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should load from network
    expect(result.current.campaigns).toEqual(mockCampaigns);
  });
});
