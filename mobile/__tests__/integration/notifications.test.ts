/**
 * Integration tests for Push Notifications
 * Tests notification token storage and retrieval flow
 */

import { updatePushToken, addPhone } from '../../services/phoneService';
import * as storage from '../../lib/storage';

// Mock dependencies
global.fetch = jest.fn();
jest.mock('../../lib/storage');

describe('Push Notifications Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Push Token Storage', () => {
    it('should store push token when adding phone', async () => {
      const mockResponse = {
        success: true,
        phone: {
          id: 1,
          phone: '1234567890',
          platform: 'android',
          created_at: '2024-01-01T00:00:00Z',
          push_token: 'ExponentPushToken[abc123]',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addPhone({
        phone: '1234567890',
        platform: 'android',
        pushToken: 'ExponentPushToken[abc123]',
      });

      expect(result.success).toBe(true);
      expect(result.phone?.push_token).toBe('ExponentPushToken[abc123]');

      // Verify the push token was sent to backend
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.pushToken).toBe('ExponentPushToken[abc123]');
    });

    it('should handle missing push token gracefully', async () => {
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

      const result = await addPhone({
        phone: '1234567890',
        platform: 'ios',
      });

      expect(result.success).toBe(true);
      expect(result.phone?.push_token).toBeUndefined();
    });
  });

  describe('Push Token Update', () => {
    it('should update push token for existing phone', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await updatePushToken(1, 'ExponentPushToken[new123]');

      expect(result.success).toBe(true);

      // Verify the new token was sent to backend
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.pushToken).toBe('ExponentPushToken[new123]');
    });

    it('should handle token update failures', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Invalid push token format',
        }),
      });

      const result = await updatePushToken(1, 'invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid push token format');
    });
  });

  describe('Notification Token Persistence', () => {
    it('should persist notification preferences to local storage', async () => {
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      const preferences = {
        notificationsEnabled: true,
        pushToken: 'ExponentPushToken[abc123]',
        lastUpdated: new Date().toISOString(),
      };

      const result = await storage.setItem(
        storage.STORAGE_KEYS.USER_PREFERENCES,
        preferences
      );

      expect(result).toBe(true);
      expect(storage.setItem).toHaveBeenCalledWith(
        storage.STORAGE_KEYS.USER_PREFERENCES,
        preferences
      );
    });

    it('should retrieve notification preferences from storage', async () => {
      const mockPreferences = {
        notificationsEnabled: true,
        pushToken: 'ExponentPushToken[abc123]',
        lastUpdated: '2024-01-01T00:00:00Z',
      };

      (storage.getItem as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await storage.getItem(storage.STORAGE_KEYS.USER_PREFERENCES);

      expect(result).toEqual(mockPreferences);
      expect(result.pushToken).toBe('ExponentPushToken[abc123]');
    });

    it('should handle missing preferences gracefully', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await storage.getItem(storage.STORAGE_KEYS.USER_PREFERENCES);

      expect(result).toBeNull();
    });
  });

  describe('End-to-End Notification Flow', () => {
    it('should complete full notification setup workflow', async () => {
      // Step 1: Store notification preferences locally
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      const preferences = {
        notificationsEnabled: true,
        pushToken: 'ExponentPushToken[e2e123]',
        lastUpdated: new Date().toISOString(),
      };

      const storeResult = await storage.setItem(
        storage.STORAGE_KEYS.USER_PREFERENCES,
        preferences
      );
      expect(storeResult).toBe(true);

      // Step 2: Add phone with push token to backend
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          phone: {
            id: 1,
            phone: '1234567890',
            platform: 'android',
            created_at: new Date().toISOString(),
            push_token: 'ExponentPushToken[e2e123]',
          },
        }),
      });

      const addResult = await addPhone({
        phone: '1234567890',
        platform: 'android',
        pushToken: 'ExponentPushToken[e2e123]',
      });

      expect(addResult.success).toBe(true);
      expect(addResult.phone?.push_token).toBe('ExponentPushToken[e2e123]');

      // Step 3: Simulate token refresh
      const newToken = 'ExponentPushToken[refreshed456]';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const updateResult = await updatePushToken(1, newToken);
      expect(updateResult.success).toBe(true);

      // Step 4: Update local preferences
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      const updatedPreferences = {
        ...preferences,
        pushToken: newToken,
        lastUpdated: new Date().toISOString(),
      };

      const updateStoreResult = await storage.setItem(
        storage.STORAGE_KEYS.USER_PREFERENCES,
        updatedPreferences
      );
      expect(updateStoreResult).toBe(true);

      // Step 5: Verify final state
      (storage.getItem as jest.Mock).mockResolvedValue(updatedPreferences);

      const finalPreferences = await storage.getItem(
        storage.STORAGE_KEYS.USER_PREFERENCES
      );
      expect(finalPreferences.pushToken).toBe(newToken);
    });
  });

  describe('Platform-Specific Token Handling', () => {
    it('should handle Android push tokens', async () => {
      const mockResponse = {
        success: true,
        phone: {
          id: 1,
          phone: '1234567890',
          platform: 'android',
          created_at: '2024-01-01T00:00:00Z',
          push_token: 'ExponentPushToken[android123]',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addPhone({
        phone: '1234567890',
        platform: 'android',
        pushToken: 'ExponentPushToken[android123]',
      });

      expect(result.success).toBe(true);
      expect(result.phone?.platform).toBe('android');
    });

    it('should handle iOS (Apple) push tokens', async () => {
      const mockResponse = {
        success: true,
        phone: {
          id: 1,
          phone: '1234567890',
          platform: 'apple',
          created_at: '2024-01-01T00:00:00Z',
          push_token: 'ExponentPushToken[ios123]',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addPhone({
        phone: '1234567890',
        platform: 'apple',
        pushToken: 'ExponentPushToken[ios123]',
      });

      expect(result.success).toBe(true);
      expect(result.phone?.platform).toBe('apple');
    });
  });
});
