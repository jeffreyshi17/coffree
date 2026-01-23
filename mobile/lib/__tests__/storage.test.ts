import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setItem,
  getItem,
  removeItem,
  clearAll,
  setCachedItem,
  getCachedItem,
  isCacheValid,
  getAllKeys,
  multiGet,
  multiSet,
  multiRemove,
  STORAGE_KEYS,
} from '../storage';

jest.mock('@react-native-async-storage/async-storage');

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store item successfully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await setItem('test_key', { foo: 'bar' });

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify({ foo: 'bar' })
      );
    });

    it('should handle storage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await setItem('test_key', { foo: 'bar' });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getItem', () => {
    it('should retrieve item successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ foo: 'bar' }));

      const result = await getItem('test_key');

      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null when item does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getItem('test_key');

      expect(result).toBeNull();
    });

    it('should handle retrieval error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getItem('test_key');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await removeItem('test_key');

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should handle removal error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Remove error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await removeItem('test_key');

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('clearAll', () => {
    it('should clear all storage successfully', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

      const result = await clearAll();

      expect(result).toBe(true);
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });

    it('should handle clear error', async () => {
      (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('Clear error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await clearAll();

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('setCachedItem', () => {
    it('should cache item with metadata', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1000000);

      const result = await setCachedItem('test_key', { foo: 'bar' });

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify({ foo: 'bar' })
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key_metadata',
        expect.stringContaining('"timestamp":1000000')
      );

      dateSpy.mockRestore();
    });

    it('should use custom expiration time', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1000000);

      await setCachedItem('test_key', { foo: 'bar' }, 5000);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key_metadata',
        JSON.stringify({
          timestamp: 1000000,
          expiresAt: 1005000,
        })
      );

      dateSpy.mockRestore();
    });
  });

  describe('getCachedItem', () => {
    it('should return cached item if not expired', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(2000000);

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'test_key_metadata') {
          return Promise.resolve(
            JSON.stringify({
              timestamp: 1000000,
              expiresAt: 3000000,
            })
          );
        }
        if (key === 'test_key') {
          return Promise.resolve(JSON.stringify({ foo: 'bar' }));
        }
        return Promise.resolve(null);
      });

      const result = await getCachedItem('test_key');

      expect(result).toEqual({ foo: 'bar' });

      dateSpy.mockRestore();
    });

    it('should return null if cache is expired', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(4000000);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          timestamp: 1000000,
          expiresAt: 3000000,
        })
      );
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await getCachedItem('test_key');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key_metadata');

      dateSpy.mockRestore();
    });

    it('should return null if no metadata', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getCachedItem('test_key');

      expect(result).toBeNull();
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(2000000);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          timestamp: 1000000,
          expiresAt: 3000000,
        })
      );

      const result = await isCacheValid('test_key');

      expect(result).toBe(true);

      dateSpy.mockRestore();
    });

    it('should return false for expired cache', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(4000000);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          timestamp: 1000000,
          expiresAt: 3000000,
        })
      );

      const result = await isCacheValid('test_key');

      expect(result).toBe(false);

      dateSpy.mockRestore();
    });

    it('should return false for missing metadata', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await isCacheValid('test_key');

      expect(result).toBe(false);
    });
  });

  describe('getAllKeys', () => {
    it('should return all storage keys', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['key1', 'key2']);

      const result = await getAllKeys();

      expect(result).toEqual(['key1', 'key2']);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getAllKeys();

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('multiGet', () => {
    it('should retrieve multiple items', async () => {
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['key1', JSON.stringify({ foo: 'bar' })],
        ['key2', JSON.stringify({ baz: 'qux' })],
      ]);

      const result = await multiGet(['key1', 'key2']);

      expect(result).toEqual([
        ['key1', { foo: 'bar' }],
        ['key2', { baz: 'qux' }],
      ]);
    });

    it('should handle null values', async () => {
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ['key1', null],
      ]);

      const result = await multiGet(['key1']);

      expect(result).toEqual([['key1', null]]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.multiGet as jest.Mock).mockRejectedValue(new Error('Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await multiGet(['key1']);

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('multiSet', () => {
    it('should set multiple items', async () => {
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);

      const result = await multiSet([
        ['key1', { foo: 'bar' }],
        ['key2', { baz: 'qux' }],
      ]);

      expect(result).toBe(true);
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['key1', JSON.stringify({ foo: 'bar' })],
        ['key2', JSON.stringify({ baz: 'qux' })],
      ]);
    });

    it('should handle error', async () => {
      (AsyncStorage.multiSet as jest.Mock).mockRejectedValue(new Error('Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await multiSet([['key1', { foo: 'bar' }]]);

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('multiRemove', () => {
    it('should remove multiple items', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const result = await multiRemove(['key1', 'key2']);

      expect(result).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should handle error', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(new Error('Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await multiRemove(['key1']);

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have expected keys', () => {
      expect(STORAGE_KEYS).toMatchObject({
        CAMPAIGNS: '@freecoffee:campaigns',
        CAMPAIGNS_TIMESTAMP: '@freecoffee:campaigns_timestamp',
        USER_PREFERENCES: '@freecoffee:preferences',
        PENDING_SYNC: '@freecoffee:pending_sync',
      });
    });
  });
});
