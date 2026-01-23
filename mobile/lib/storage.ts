import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys used throughout the app
 */
export const STORAGE_KEYS = {
  CAMPAIGNS: '@freecoffee:campaigns',
  CAMPAIGNS_TIMESTAMP: '@freecoffee:campaigns_timestamp',
  USER_PREFERENCES: '@freecoffee:preferences',
  PENDING_SYNC: '@freecoffee:pending_sync',
} as const;

/**
 * Cache expiration time in milliseconds (15 minutes)
 */
const CACHE_EXPIRATION_MS = 15 * 60 * 1000;

export interface CacheMetadata {
  timestamp: number;
  expiresAt: number;
}

/**
 * Store data in AsyncStorage with error handling
 * @param key Storage key
 * @param value Value to store (will be JSON stringified)
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    return false;
  }
}

/**
 * Retrieve data from AsyncStorage with error handling
 * @param key Storage key
 * @returns Promise that resolves to the stored value or null if not found/error
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
}

/**
 * Remove item from AsyncStorage
 * @param key Storage key
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
}

/**
 * Clear all AsyncStorage data
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function clearAll(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Store data with timestamp for cache expiration tracking
 * @param key Storage key
 * @param value Value to cache
 * @param expirationMs Cache expiration time in milliseconds (default: 15 minutes)
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function setCachedItem<T>(
  key: string,
  value: T,
  expirationMs: number = CACHE_EXPIRATION_MS
): Promise<boolean> {
  try {
    const now = Date.now();
    const metadata: CacheMetadata = {
      timestamp: now,
      expiresAt: now + expirationMs,
    };

    const dataSuccess = await setItem(key, value);
    const metadataSuccess = await setItem(`${key}_metadata`, metadata);

    return dataSuccess && metadataSuccess;
  } catch (error) {
    console.error(`Error caching ${key}:`, error);
    return false;
  }
}

/**
 * Retrieve cached data if not expired
 * @param key Storage key
 * @returns Promise that resolves to cached value or null if expired/not found
 */
export async function getCachedItem<T>(key: string): Promise<T | null> {
  try {
    const metadata = await getItem<CacheMetadata>(`${key}_metadata`);

    // Check if cache exists and is not expired
    if (!metadata) {
      return null;
    }

    const now = Date.now();
    if (now > metadata.expiresAt) {
      // Cache expired, remove it
      await removeItem(key);
      await removeItem(`${key}_metadata`);
      return null;
    }

    // Cache is valid, return data
    return await getItem<T>(key);
  } catch (error) {
    console.error(`Error retrieving cached ${key}:`, error);
    return null;
  }
}

/**
 * Check if cached data is still valid (not expired)
 * @param key Storage key
 * @returns Promise that resolves to true if cache is valid, false otherwise
 */
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const metadata = await getItem<CacheMetadata>(`${key}_metadata`);
    if (!metadata) {
      return false;
    }

    const now = Date.now();
    return now <= metadata.expiresAt;
  } catch (error) {
    console.error(`Error checking cache validity for ${key}:`, error);
    return false;
  }
}

/**
 * Get all keys stored in AsyncStorage
 * @returns Promise that resolves to array of keys or empty array on error
 */
export async function getAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
}

/**
 * Get multiple items at once for better performance
 * @param keys Array of storage keys
 * @returns Promise that resolves to array of [key, value] pairs
 */
export async function multiGet(keys: string[]): Promise<Array<[string, any]>> {
  try {
    const items = await AsyncStorage.multiGet(keys);
    return items.map(([key, value]) => [key, value ? JSON.parse(value) : null]);
  } catch (error) {
    console.error('Error in multiGet:', error);
    return [];
  }
}

/**
 * Set multiple items at once for better performance
 * @param keyValuePairs Array of [key, value] pairs
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function multiSet(keyValuePairs: Array<[string, any]>): Promise<boolean> {
  try {
    const stringifiedPairs = keyValuePairs.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(stringifiedPairs as Array<[string, string]>);
    return true;
  } catch (error) {
    console.error('Error in multiSet:', error);
    return false;
  }
}

/**
 * Remove multiple items at once for better performance
 * @param keys Array of storage keys
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function multiRemove(keys: string[]): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Error in multiRemove:', error);
    return false;
  }
}
