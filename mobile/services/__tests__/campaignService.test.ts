import {
  getCampaigns,
  getCampaignCount,
  sendCoffee,
  parseCoffeeLink,
  formatTimeAgo,
  Campaign,
  CampaignCount,
  SendCoffeeRequest,
  SendCoffeeResponse,
} from '../campaignService';

// Mock global fetch
global.fetch = jest.fn();

describe('campaignService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCampaigns', () => {
    it('should fetch campaigns successfully', async () => {
      const mockCampaigns: Campaign[] = [
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: mockCampaigns }),
      });

      const result = await getCampaigns();

      expect(result).toEqual(mockCampaigns);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/campaigns?is_valid=true&is_expired=false'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return empty array when no campaigns', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getCampaigns();

      expect(result).toEqual([]);
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(getCampaigns()).rejects.toThrow('Failed to fetch campaigns');
    });

    it('should retry on network failure', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaigns: [] }),
        });

      const resultPromise = getCampaigns();

      // Fast-forward timers to complete retry delay
      await jest.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCampaignCount', () => {
    it('should fetch campaign count successfully', async () => {
      const mockCount: CampaignCount = { count: 5, distributed: 10 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCount,
      });

      const result = await getCampaignCount();

      expect(result).toEqual(mockCount);
    });

    it('should return default values when response is empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getCampaignCount();

      expect(result).toEqual({ count: 0, distributed: 0 });
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(getCampaignCount()).rejects.toThrow('Failed to fetch campaign count');
    });
  });

  describe('sendCoffee', () => {
    it('should send coffee successfully', async () => {
      const request: SendCoffeeRequest = {
        link: 'https://coffree.capitalone.com/sms/?cid=test&mc=email',
      };

      const mockResponse: SendCoffeeResponse = {
        success: true,
        sent: ['1234567890'],
        failed: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendCoffee(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/send-coffee'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );
    });

    it('should handle send coffee errors', async () => {
      const request: SendCoffeeRequest = {
        link: 'invalid-link',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid link', type: 'invalid' }),
      });

      const result = await sendCoffee(request);

      expect(result.error).toBe('Invalid link');
      expect(result.type).toBe('invalid');
      expect(result.success).toBeUndefined();
    });
  });

  describe('parseCoffeeLink', () => {
    it('should parse valid coffee link', () => {
      const url = 'https://coffree.capitalone.com/sms/?cid=ABC123&mc=email';
      const result = parseCoffeeLink(url);

      expect(result).toEqual({
        cid: 'ABC123',
        mc: 'email',
      });
    });

    it('should sanitize marketing channel to letters only', () => {
      const url = 'https://coffree.capitalone.com/sms/?cid=ABC123&mc=email123!@#';
      const result = parseCoffeeLink(url);

      expect(result).toEqual({
        cid: 'ABC123',
        mc: 'email',
      });
    });

    it('should return null for invalid domain', () => {
      const url = 'https://invalid-domain.com/sms/?cid=ABC123&mc=email';
      const result = parseCoffeeLink(url);

      expect(result).toBeNull();
    });

    it('should return null for missing cid', () => {
      const url = 'https://coffree.capitalone.com/sms/?mc=email';
      const result = parseCoffeeLink(url);

      expect(result).toBeNull();
    });

    it('should return null for missing mc', () => {
      const url = 'https://coffree.capitalone.com/sms/?cid=ABC123';
      const result = parseCoffeeLink(url);

      expect(result).toBeNull();
    });

    it('should return null for empty mc after sanitization', () => {
      const url = 'https://coffree.capitalone.com/sms/?cid=ABC123&mc=123!@#';
      const result = parseCoffeeLink(url);

      expect(result).toBeNull();
    });

    it('should return null for invalid URL', () => {
      const result = parseCoffeeLink('not-a-url');

      expect(result).toBeNull();
    });
  });

  describe('formatTimeAgo', () => {
    it('should format "just now" for recent dates', () => {
      const now = new Date();
      const result = formatTimeAgo(now);

      expect(result).toBe('just now');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = formatTimeAgo(date);

      expect(result).toBe('5 minutes ago');
    });

    it('should format single minute ago', () => {
      const date = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      const result = formatTimeAgo(date);

      expect(result).toBe('1 minute ago');
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const result = formatTimeAgo(date);

      expect(result).toBe('3 hours ago');
    });

    it('should format single hour ago', () => {
      const date = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const result = formatTimeAgo(date);

      expect(result).toBe('1 hour ago');
    });

    it('should format "yesterday"', () => {
      const date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const result = formatTimeAgo(date);

      expect(result).toBe('yesterday');
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const result = formatTimeAgo(date);

      expect(result).toBe('3 days ago');
    });

    it('should format date for older than a week', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const result = formatTimeAgo(date);

      expect(result).toBe(date.toLocaleDateString());
    });
  });
});
