import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import PhoneInput from '../../components/PhoneInput';
import PlatformSelector from '../../components/PlatformSelector';
import ErrorMessage from '../../components/ErrorMessage';
import { useSubscription } from '../../hooks/useSubscription';
import { validatePhoneNumber } from '../../services/phoneService';

export default function HomeScreen() {
  const [phone, setPhone] = useState('');
  const [platform, setPlatform] = useState<'android' | 'apple'>('android');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { addSubscription } = useSubscription();

  const handleSubmit = async () => {
    setError(null);

    // Validate phone number
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addSubscription({ phone, platform });

      if (result.success) {
        // Show success message
        const sentCount = result.sent?.length || 0;
        const message =
          sentCount > 0
            ? `You'll receive ${sentCount} free coffee voucher${
                sentCount !== 1 ? 's' : ''
              } via text shortly!`
            : 'You have been added to the mailing list!';

        setSuccessMessage(message);
        setShowSuccess(true);

        // Reset form
        setPhone('');
        setPlatform('android');
      } else {
        setError(result.error || 'Failed to add subscription');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessMessage('');
  };

  const handleRetryError = () => {
    setError(null);
  };

  const isFormValid = phone.length > 0 && !isSubmitting;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>☕</Text>
        </View>
        <Text style={styles.title}>Welcome to FreeCoffee</Text>
        <Text style={styles.subtitle}>
          Get notified about Capital One free coffee offers
        </Text>
      </View>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscribe for Free Coffee</Text>
        <Text style={styles.cardDescription}>
          Add your phone number to receive free drink vouchers now and join the
          mailing list
        </Text>

        <View style={styles.form}>
          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            disabled={isSubmitting}
            error={null}
          />

          <PlatformSelector
            value={platform}
            onChange={setPlatform}
            disabled={isSubmitting}
          />

          {error && (
            <View style={styles.errorContainer}>
              <ErrorMessage
                title="Subscription Failed"
                message={error}
                onRetry={handleRetryError}
                retryText="Dismiss"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>
                  Sending your free coffee texts...
                </Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Text style={styles.submitButtonIcon}>☕</Text>
                <Text style={styles.submitButtonText}>Get Free Coffee</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccess}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleCloseSuccess}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>Great!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>1.</Text>
          <Text style={styles.infoText}>
            Enter your phone number and select your device type
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>2.</Text>
          <Text style={styles.infoText}>
            Receive free Capital One drink vouchers via text
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>3.</Text>
          <Text style={styles.infoText}>
            Get notified when new offers become available
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fef3c7',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  errorContainer: {
    marginTop: -8,
  },
  submitButton: {
    backgroundColor: '#d97706',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#d97706',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonIcon: {
    fontSize: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
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
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    width: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#d1fae5',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 48,
    color: '#10b981',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: '#d97706',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
