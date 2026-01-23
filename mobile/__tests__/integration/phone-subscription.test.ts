/**
 * Integration tests for Phone Subscription API
 * Tests the integration between mobile app and backend for phone subscription operations
 */

import {
  getPhones,
  addPhone,
  deletePhone,
  updatePushToken,
} from '../../services/phoneService';

// Mock global fetch for integration tests
global.fetch = jest.fn();

describe('Phone Subscription API Integration', () => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPhones', () => {
    it('should integrate with phone list endpoint', async () => {
      const mockResponse = {
        phones: [
          {
            id: 1,
            phone: '1234567890',
            platform: 'android',
            created_at: '2024-01-01T00:00:00Z',
            push_token: 'test-token',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPhones();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/phone`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result.phones).toHaveLength(1);
      expect(result.phones[0].phone).toBe('1234567890');
    });

    it('should handle empty phone list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ phones: [] }),
      });

      const result = await getPhones();

      expect(result.phones).toEqual([]);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getPhones()).rejects.toThrow('Failed to fetch phone numbers');
    });
  });

  describe('addPhone', () => {
    it('should integrate with phone creation endpoint', async () => {
      const mockResponse = {
        success: true,
        phone: {
          id: 1,
          phone: '1234567890',
          platform: 'android',
          created_at: '2024-01-01T00:00:00Z',
          push_token: 'test-token',
        },
        message: 'Phone added successfully',
        sent: ['1234567890'],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addPhone({
        phone: '(123) 456-7890',
        platform: 'android',
        pushToken: 'test-token',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/phone`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('1234567890'),
        })
      );
      expect(result.success).toBe(true);
      expect(result.phone?.phone).toBe('1234567890');
    });

    it('should validate phone number before API call', async () => {
      const result = await addPhone({
        phone: '123',
        platform: 'android',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number must be 10 digits');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should normalize phone number before sending', async () => {
      const mockResponse = {
        success: true,
        phone: {
          id: 1,
          phone: '1234567890',
          platform: 'ios',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await addPhone({
        phone: '(123) 456-7890',
        platform: 'ios',
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.phone).toBe('1234567890');
    });

    it('should handle duplicate phone errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Phone number already exists',
        }),
      });

      const result = await addPhone({
        phone: '1234567890',
        platform: 'android',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number already exists');
    });
  });

  describe('deletePhone', () => {
    it('should integrate with phone deletion endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deletePhone(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/phone`,
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('"id":1'),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle phone not found errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Phone not found',
        }),
      });

      const result = await deletePhone(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone not found');
    });
  });

  describe('updatePushToken', () => {
    it('should integrate with push token update endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await updatePushToken(1, 'new-push-token');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/phone`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"pushToken":"new-push-token"'),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Phone not found',
        }),
      });

      const result = await updatePushToken(999, 'token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone not found');
    });
  });

  describe('End-to-End Subscription Flow', () => {
    it('should complete full subscription workflow', async () => {
      // Step 1: Add phone
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          phone: {
            id: 1,
            phone: '1234567890',
            platform: 'android',
            created_at: '2024-01-01T00:00:00Z',
            push_token: 'initial-token',
          },
        }),
      });

      const addResult = await addPhone({
        phone: '1234567890',
        platform: 'android',
        pushToken: 'initial-token',
      });

      expect(addResult.success).toBe(true);
      const phoneId = addResult.phone?.id;

      // Step 2: Update push token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const updateResult = await updatePushToken(phoneId!, 'updated-token');
      expect(updateResult.success).toBe(true);

      // Step 3: Get phones (verify it's in list)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          phones: [
            {
              id: phoneId,
              phone: '1234567890',
              platform: 'android',
              created_at: '2024-01-01T00:00:00Z',
              push_token: 'updated-token',
            },
          ],
        }),
      });

      const getResult = await getPhones();
      expect(getResult.phones).toHaveLength(1);
      expect(getResult.phones[0].push_token).toBe('updated-token');

      // Step 4: Delete phone
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const deleteResult = await deletePhone(phoneId!);
      expect(deleteResult.success).toBe(true);

      // Step 5: Verify deletion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ phones: [] }),
      });

      const finalResult = await getPhones();
      expect(finalResult.phones).toHaveLength(0);
    });
  });
});
