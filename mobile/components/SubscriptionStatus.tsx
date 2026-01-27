import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSubscription } from '../hooks/useSubscription';
import type { PhoneNumber } from '../services/phoneService';

export default function SubscriptionStatus() {
  const { phones, loading, removeSubscription, refetch } = useSubscription();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const anonymizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      const last4 = cleaned.slice(-4);
      return `(***) ***-${last4}`;
    }
    return '****';
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUnsubscribe = async (phone: PhoneNumber) => {
    Alert.alert(
      'Unsubscribe',
      `Are you sure you want to unsubscribe ${anonymizePhone(phone.phone)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(phone.id);
            try {
              const result = await removeSubscription(phone.id);
              if (result.success) {
                Alert.alert(
                  'Unsubscribed',
                  'You have been successfully removed from the mailing list.',
                  [{ text: 'OK' }]
                );
                await refetch();
              } else {
                Alert.alert('Error', result.error || 'Failed to unsubscribe', [
                  { text: 'OK' },
                ]);
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred', [{ text: 'OK' }]);
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const getPlatformIcon = (platform: 'android' | 'apple'): string => {
    return platform === 'apple' ? '🍎' : '🤖';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.icon}>☕</Text>
            <View style={styles.headerText}>
              <Text style={styles.title}>My Subscriptions</Text>
              <View style={styles.loadingSubtitle}>
                <ActivityIndicator size="small" color="#666" />
              </View>
            </View>
          </View>

          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonItem}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonTextContainer}>
                  <View style={styles.skeletonText} />
                  <View style={styles.skeletonSubtext} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>☕</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Subscriptions</Text>
            <Text style={styles.subtitle}>
              {phones.length} active subscription{phones.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {phones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>No Subscriptions</Text>
            <Text style={styles.emptyText}>
              Visit the Home tab to subscribe for free coffee offers!
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {phones.map((phone) => (
              <View key={phone.id} style={styles.phoneItem}>
                <View style={styles.phoneInfo}>
                  <View style={styles.platformIconContainer}>
                    <Text style={styles.platformIcon}>
                      {getPlatformIcon(phone.platform)}
                    </Text>
                  </View>
                  <View style={styles.phoneDetails}>
                    <Text style={styles.phoneNumber}>
                      {anonymizePhone(phone.phone)}
                    </Text>
                    <Text style={styles.phoneDate}>
                      Subscribed {formatDateTime(phone.created_at)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.unsubscribeButton,
                    removingId === phone.id && styles.unsubscribeButtonDisabled,
                  ]}
                  onPress={() => handleUnsubscribe(phone)}
                  disabled={removingId === phone.id}
                  activeOpacity={0.7}
                >
                  {removingId === phone.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text style={styles.unsubscribeButtonText}>Unsubscribe</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About Subscriptions</Text>
        <Text style={styles.infoText}>
          Your phone number is used to send you free coffee voucher texts from Capital
          One campaigns. We'll notify you when new offers become available.
        </Text>
        <Text style={styles.infoText}>
          You can unsubscribe at any time by tapping the Unsubscribe button above.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingSubtitle: {
    height: 20,
  },
  loadingContainer: {
    gap: 12,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonSubtext: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '40%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  listContainer: {
    maxHeight: 400,
  },
  listContent: {
    gap: 12,
  },
  phoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  phoneInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  platformIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  platformIcon: {
    fontSize: 20,
  },
  phoneDetails: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  phoneDate: {
    fontSize: 12,
    color: '#666',
  },
  unsubscribeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    minWidth: 100,
    alignItems: 'center',
  },
  unsubscribeButtonDisabled: {
    opacity: 0.6,
  },
  unsubscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});
