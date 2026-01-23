import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../lib/notifications';

export default function RootLayout() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

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

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
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
