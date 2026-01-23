import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getCampaigns } from '../services/campaignService';
import { setCachedItem, getItem, setItem, STORAGE_KEYS } from './storage';

/**
 * Types of sync operations that can be queued
 */
export type SyncOperation = {
  id: string;
  type: 'campaign_refresh' | 'subscription_update';
  data?: any;
  timestamp: number;
  retries: number;
};

/**
 * Network status information
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Callbacks for network state changes
 */
let networkChangeListeners: Array<(status: NetworkStatus) => void> = [];

/**
 * Track if we've transitioned from offline to online
 */
let wasOffline = false;

/**
 * Initialize network monitoring and background sync
 * This should be called once when the app starts
 */
export function initializeNetworkSync(): () => void {
  const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

  // Check initial network state
  NetInfo.fetch().then(handleNetworkChange);

  return unsubscribe;
}

/**
 * Handle network state changes
 * Triggers background sync when connection is restored
 */
async function handleNetworkChange(state: NetInfoState): Promise<void> {
  const status: NetworkStatus = {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };

  // Notify all listeners about network change
  networkChangeListeners.forEach(listener => listener(status));

  // Check if we've transitioned from offline to online
  const isNowOnline = status.isConnected && status.isInternetReachable !== false;

  if (wasOffline && isNowOnline) {
    // Network restored, trigger background sync
    await performBackgroundSync();
  }

  wasOffline = !isNowOnline;
}

/**
 * Subscribe to network status changes
 * @param listener Callback function that receives network status updates
 * @returns Unsubscribe function
 */
export function addNetworkListener(
  listener: (status: NetworkStatus) => void
): () => void {
  networkChangeListeners.push(listener);

  // Return unsubscribe function
  return () => {
    networkChangeListeners = networkChangeListeners.filter(l => l !== listener);
  };
}

/**
 * Get current network status
 * @returns Promise that resolves to current network status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
}

/**
 * Check if device is currently online
 * @returns Promise that resolves to true if online, false otherwise
 */
export async function isOnline(): Promise<boolean> {
  const status = await getNetworkStatus();
  return status.isConnected && status.isInternetReachable !== false;
}

/**
 * Perform background sync of cached data
 * Syncs campaigns and processes any pending operations
 */
export async function performBackgroundSync(): Promise<void> {
  try {
    // Check if we're actually online
    const online = await isOnline();
    if (!online) {
      return;
    }

    // Sync campaigns data
    await syncCampaigns();

    // Process pending sync operations
    await processPendingSyncOperations();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Sync campaigns data from server and update cache
 */
async function syncCampaigns(): Promise<void> {
  try {
    const campaigns = await getCampaigns();
    await setCachedItem(STORAGE_KEYS.CAMPAIGNS, campaigns);
  } catch (error) {
    console.error('Failed to sync campaigns:', error);
  }
}

/**
 * Add an operation to the pending sync queue
 * Operations will be processed when connection is restored
 * @param operation Sync operation to queue
 */
export async function queueSyncOperation(
  operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>
): Promise<void> {
  try {
    const pendingOps = await getItem<SyncOperation[]>(STORAGE_KEYS.PENDING_SYNC) || [];

    const newOperation: SyncOperation = {
      ...operation,
      id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    pendingOps.push(newOperation);
    await setItem(STORAGE_KEYS.PENDING_SYNC, pendingOps);
  } catch (error) {
    console.error('Failed to queue sync operation:', error);
  }
}

/**
 * Process all pending sync operations
 * Retries failed operations up to 3 times
 */
async function processPendingSyncOperations(): Promise<void> {
  try {
    const pendingOps = await getItem<SyncOperation[]>(STORAGE_KEYS.PENDING_SYNC);

    if (!pendingOps || pendingOps.length === 0) {
      return;
    }

    const failedOps: SyncOperation[] = [];

    for (const operation of pendingOps) {
      try {
        await executeSyncOperation(operation);
      } catch (error) {
        console.error(`Sync operation ${operation.id} failed:`, error);

        // Retry up to 3 times
        if (operation.retries < 3) {
          failedOps.push({
            ...operation,
            retries: operation.retries + 1,
          });
        }
      }
    }

    // Update pending operations (keep only failed ones that can be retried)
    await setItem(STORAGE_KEYS.PENDING_SYNC, failedOps);
  } catch (error) {
    console.error('Failed to process pending sync operations:', error);
  }
}

/**
 * Execute a specific sync operation
 * @param operation Sync operation to execute
 */
async function executeSyncOperation(operation: SyncOperation): Promise<void> {
  switch (operation.type) {
    case 'campaign_refresh':
      await syncCampaigns();
      break;
    case 'subscription_update':
      // Future: handle subscription updates
      break;
    default:
      console.warn(`Unknown sync operation type: ${operation.type}`);
  }
}

/**
 * Manually trigger a sync (useful for pull-to-refresh)
 * @returns Promise that resolves when sync is complete
 */
export async function manualSync(): Promise<void> {
  const online = await isOnline();

  if (!online) {
    throw new Error('Cannot sync while offline');
  }

  await performBackgroundSync();
}

/**
 * Clear all pending sync operations
 * Useful for testing or after successful bulk sync
 */
export async function clearPendingSyncOperations(): Promise<void> {
  await setItem(STORAGE_KEYS.PENDING_SYNC, []);
}

/**
 * Get count of pending sync operations
 * @returns Promise that resolves to number of pending operations
 */
export async function getPendingSyncCount(): Promise<number> {
  const pendingOps = await getItem<SyncOperation[]>(STORAGE_KEYS.PENDING_SYNC);
  return pendingOps?.length || 0;
}
