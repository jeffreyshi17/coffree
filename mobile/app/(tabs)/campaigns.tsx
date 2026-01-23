import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useCampaigns } from '../../hooks/useCampaigns';
import CampaignCard from '../../components/CampaignCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function CampaignsScreen() {
  const { campaigns, loading, error, refetch } = useCampaigns();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner message="Loading campaigns..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage
          title="Failed to Load Campaigns"
          message={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  if (campaigns.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>☕</Text>
        </View>
        <Text style={styles.emptyTitle}>No Campaigns Available</Text>
        <Text style={styles.emptyText}>
          Check back later for free coffee vouchers!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Vouchers</Text>
        <Text style={styles.headerSubtitle}>
          {campaigns.length} free coffee {campaigns.length === 1 ? 'voucher' : 'vouchers'} available
        </Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.campaign_id}
        renderItem={({ item }) => <CampaignCard campaign={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#d97706']}
            tintColor="#d97706"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#fef3c7',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
