/**
 * Integration tests for Campaign API
 * Tests the integration between mobile app and Supabase backend for campaign operations
 */

import { getCampaigns, getCampaignCount, sendCoffee } from '../../services/campaignService';

// Mock global fetch for integration tests
global.fetch = jest.fn();

describe('Campaign API Integration', () => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('should integrate with campaigns endpoint', async () => {
      const mockResponse = {
        campaigns: [
          {
            id: 1,
            campaign_id: 'TEST123',
            marketing_channel: 'email',
            full_link: 'https://coffree.capitalone.com/sms/?cid=TEST123&mc=email',
            is_valid: true,
            is_expired: false,
            first_seen_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const campaigns = await getCampaigns();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/campaigns?is_valid=true&is_expired=false`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].campaign_id).toBe('TEST123');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getCampaigns()).rejects.toThrow('Failed to fetch campaigns');
    });

    it('should handle network errors with retry', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaigns: [] }),
        });

      const campaigns = await getCampaigns();

      // Should have retried 3 times total
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(campaigns).toEqual([]);
    });
  });

  describe('getCampaignCount', () => {
    it('should integrate with campaign count endpoint', async () => {
      const mockResponse = {
        count: 5,
        distributed: 10,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const count = await getCampaignCount();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/campaigns/count`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(count.count).toBe(5);
      expect(count.distributed).toBe(10);
    });

    it('should provide defaults for missing data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const count = await getCampaignCount();

      expect(count.count).toBe(0);
      expect(count.distributed).toBe(0);
    });
  });

  describe('sendCoffee', () => {
    it('should integrate with send-coffee endpoint', async () => {
      const mockResponse = {
        success: true,
        sent: ['1234567890'],
        failed: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendCoffee({
        link: 'https://coffree.capitalone.com/sms/?cid=TEST123&mc=email',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/send-coffee`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.sent).toEqual(['1234567890']);
    });

    it('should handle invalid link errors', async () => {
      const mockResponse = {
        error: 'Invalid campaign link',
        type: 'invalid',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await sendCoffee({
        link: 'invalid-link',
      });

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Invalid campaign link');
      expect(result.type).toBe('invalid');
    });

    it('should handle phone override parameter', async () => {
      const mockResponse = {
        success: true,
        sent: ['9876543210'],
        failed: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendCoffee({
        link: 'https://coffree.capitalone.com/sms/?cid=TEST123&mc=email',
        phoneOverride: '9876543210',
      });

      expect(result.success).toBe(true);
      expect(result.sent).toEqual(['9876543210']);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.phoneOverride).toBe('9876543210');
    });
  });

  describe('End-to-End Campaign Flow', () => {
    it('should complete full campaign workflow', async () => {
      // Step 1: Fetch campaigns
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          campaigns: [
            {
              id: 1,
              campaign_id: 'E2E_TEST',
              marketing_channel: 'email',
              full_link: 'https://coffree.capitalone.com/sms/?cid=E2E_TEST&mc=email',
              is_valid: true,
              is_expired: false,
              first_seen_at: new Date().toISOString(),
            },
          ],
        }),
      });

      const campaigns = await getCampaigns();
      expect(campaigns).toHaveLength(1);

      // Step 2: Get campaign count
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 1, distributed: 0 }),
      });

      const count = await getCampaignCount();
      expect(count.count).toBe(1);

      // Step 3: Send coffee using fetched campaign
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sent: ['1234567890'],
          failed: [],
        }),
      });

      const sendResult = await sendCoffee({
        link: campaigns[0].full_link,
      });

      expect(sendResult.success).toBe(true);
      expect(sendResult.sent).toHaveLength(1);
    });
  });
});
