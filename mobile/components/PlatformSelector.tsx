import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface PlatformSelectorProps {
  value: 'android' | 'apple';
  onChange: (platform: 'android' | 'apple') => void;
  disabled?: boolean;
}

export default function PlatformSelector({
  value,
  onChange,
  disabled = false,
}: PlatformSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Device Type</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            value === 'android' && styles.buttonActiveAndroid,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => onChange('android')}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              value === 'android' && styles.buttonTextActiveAndroid,
            ]}
          >
            📱 Android
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            value === 'apple' && styles.buttonActiveApple,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => onChange('apple')}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              value === 'apple' && styles.buttonTextActiveApple,
            ]}
          >
            🍎 Apple
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  buttonActiveAndroid: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  buttonActiveApple: {
    borderColor: '#333',
    backgroundColor: '#f5f5f5',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextActiveAndroid: {
    color: '#16a34a',
  },
  buttonTextActiveApple: {
    color: '#333',
  },
});
