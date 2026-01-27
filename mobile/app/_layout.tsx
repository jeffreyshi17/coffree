import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../lib/notifications';
import { initializeNetworkSync, addNetworkListener, type NetworkStatus } from '../lib/networkSync';
import OfflineIndicator from '../components/OfflineIndicator';

export default function RootLayout() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const networkUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // TODO: Store token in Supabase when user subscribes
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener(notification => {
      // Handle notification received in foreground
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseReceivedListener(response => {
      // Navigate to campaigns screen when notification is tapped
      router.push('/(tabs)/campaigns');
    });

    // Initialize network monitoring and background sync
    networkUnsubscribe.current = initializeNetworkSync();

    // Listen for network status changes
    const removeNetworkListener = addNetworkListener((status: NetworkStatus) => {
      setNetworkStatus(status);
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (networkUnsubscribe.current) {
        networkUnsubscribe.current();
      }
      removeNetworkListener();
    };
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
      <OfflineIndicator networkStatus={networkStatus} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#8B4513',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
