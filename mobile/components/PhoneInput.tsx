import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { formatPhoneNumber } from '../services/phoneService';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export default function PhoneInput({
  value,
  onChangeText,
  disabled = false,
  error = null,
}: PhoneInputProps) {
  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={handleChange}
        placeholder="(555) 123-4567"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        maxLength={14}
        editable={!disabled}
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
