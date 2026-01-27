import NetInfo from '@react-native-community/netinfo';
import {
  initializeNetworkSync,
  addNetworkListener,
  getNetworkStatus,
  isOnline,
  performBackgroundSync,
  queueSyncOperation,
  manualSync,
  clearPendingSyncOperations,
  getPendingSyncCount,
} from '../networkSync';
import * as campaignService from '../../services/campaignService';
import * as storage from '../storage';

jest.mock('@react-native-community/netinfo');
jest.mock('../../services/campaignService');
jest.mock('../storage');

describe('networkSync', () => {
  const mockNetInfoState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeNetworkSync', () => {
    it('should subscribe to network changes', () => {
      const mockUnsubscribe = jest.fn();
      (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);
      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      const unsubscribe = initializeNetworkSync();

      expect(NetInfo.addEventListener).toHaveBeenCalled();
      expect(NetInfo.fetch).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('addNetworkListener', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = jest.fn();

      const unsubscribe = addNetworkListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener when added', () => {
      const listener = jest.fn();
      addNetworkListener(listener);

      // The listener is added to internal array but won't be called until network change
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getNetworkStatus', () => {
    it('should return current network status', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      const status = await getNetworkStatus();

      expect(status).toEqual({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
    });

    it('should handle null isConnected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        ...mockNetInfoState,
        isConnected: null,
      });

      const status = await getNetworkStatus();

      expect(status.isConnected).toBe(false);
    });
  });

  describe('isOnline', () => {
    it('should return true when connected and reachable', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      const result = await isOnline();

      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: null,
        type: 'none',
      });

      const result = await isOnline();

      expect(result).toBe(false);
    });

    it('should return false when internet not reachable', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
      });

      const result = await isOnline();

      expect(result).toBe(false);
    });
  });

  describe('performBackgroundSync', () => {
    it('should sync when online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);
      (campaignService.getCampaigns as jest.Mock).mockResolvedValue([]);
      (storage.setCachedItem as jest.Mock).mockResolvedValue(true);
      (storage.getItem as jest.Mock).mockResolvedValue([]);
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      await performBackgroundSync();

      expect(campaignService.getCampaigns).toHaveBeenCalled();
      expect(storage.setCachedItem).toHaveBeenCalled();
    });

    it('should not sync when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: null,
        type: 'none',
      });

      await performBackgroundSync();

      expect(campaignService.getCampaigns).not.toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);
      (campaignService.getCampaigns as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      (storage.getItem as jest.Mock).mockResolvedValue([]);
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await performBackgroundSync();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('queueSyncOperation', () => {
    it('should add operation to queue', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue([]);
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      await queueSyncOperation({
        type: 'campaign_refresh',
        data: { foo: 'bar' },
      });

      expect(storage.setItem).toHaveBeenCalledWith(
        storage.STORAGE_KEYS.PENDING_SYNC,
        expect.arrayContaining([
          expect.objectContaining({
            type: 'campaign_refresh',
            data: { foo: 'bar' },
            retries: 0,
          }),
        ])
      );
    });

    it('should append to existing operations', async () => {
      const existingOps = [
        {
          id: 'existing_op',
          type: 'campaign_refresh' as const,
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (storage.getItem as jest.Mock).mockResolvedValue(existingOps);
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      await queueSyncOperation({
        type: 'subscription_update',
      });

      expect(storage.setItem).toHaveBeenCalledWith(
        storage.STORAGE_KEYS.PENDING_SYNC,
        expect.arrayContaining([
          expect.objectContaining({ id: 'existing_op' }),
          expect.objectContaining({ type: 'subscription_update' }),
        ])
      );
    });

    it('should handle queue error', async () => {
      (storage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await queueSyncOperation({
        type: 'campaign_refresh',
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('manualSync', () => {
    it('should sync when online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);
      (campaignService.getCampaigns as jest.Mock).mockResolvedValue([]);
      (storage.setCachedItem as jest.Mock).mockResolvedValue(true);
      (storage.getItem as jest.Mock).mockResolvedValue([]);
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      await manualSync();

      expect(campaignService.getCampaigns).toHaveBeenCalled();
    });

    it('should throw error when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: null,
        type: 'none',
      });

      await expect(manualSync()).rejects.toThrow('Cannot sync while offline');
    });
  });

  describe('clearPendingSyncOperations', () => {
    it('should clear all pending operations', async () => {
      (storage.setItem as jest.Mock).mockResolvedValue(true);

      await clearPendingSyncOperations();

      expect(storage.setItem).toHaveBeenCalledWith(
        storage.STORAGE_KEYS.PENDING_SYNC,
        []
      );
    });
  });

  describe('getPendingSyncCount', () => {
    it('should return count of pending operations', async () => {
      const mockOps = [
        { id: '1', type: 'campaign_refresh' as const, timestamp: Date.now(), retries: 0 },
        { id: '2', type: 'subscription_update' as const, timestamp: Date.now(), retries: 0 },
      ];

      (storage.getItem as jest.Mock).mockResolvedValue(mockOps);

      const count = await getPendingSyncCount();

      expect(count).toBe(2);
    });

    it('should return 0 when no operations', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);

      const count = await getPendingSyncCount();

      expect(count).toBe(0);
    });

    it('should return 0 for empty array', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue([]);

      const count = await getPendingSyncCount();

      expect(count).toBe(0);
    });
  });
});
