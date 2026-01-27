import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PhoneInput from '../PhoneInput';
import * as phoneService from '../../services/phoneService';

jest.mock('../../services/phoneService', () => ({
  formatPhoneNumber: jest.fn((text) => text),
}));

describe('PhoneInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (phoneService.formatPhoneNumber as jest.Mock).mockImplementation(
      (text) => text
    );
  });

  it('should render input with label', () => {
    const onChangeText = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} />
    );

    expect(getByText('Phone Number')).toBeTruthy();
    expect(getByPlaceholderText('(555) 123-4567')).toBeTruthy();
  });

  it('should display current value', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <PhoneInput value="1234567890" onChangeText={onChangeText} />
    );

    expect(getByDisplayValue('1234567890')).toBeTruthy();
  });

  it('should call formatPhoneNumber when text changes', () => {
    const onChangeText = jest.fn();
    (phoneService.formatPhoneNumber as jest.Mock).mockReturnValue('(123) 456-7890');

    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    fireEvent.changeText(input, '1234567890');

    expect(phoneService.formatPhoneNumber).toHaveBeenCalledWith('1234567890');
    expect(onChangeText).toHaveBeenCalledWith('(123) 456-7890');
  });

  it('should display error message when error prop is provided', () => {
    const onChangeText = jest.fn();
    const { getByText } = render(
      <PhoneInput
        value=""
        onChangeText={onChangeText}
        error="Phone number must be 10 digits"
      />
    );

    expect(getByText('Phone number must be 10 digits')).toBeTruthy();
  });

  it('should not display error when error prop is null', () => {
    const onChangeText = jest.fn();
    const { queryByText } = render(
      <PhoneInput value="" onChangeText={onChangeText} error={null} />
    );

    // Error text should not exist
    const errorText = queryByText(/must be/);
    expect(errorText).toBeNull();
  });

  it('should apply error styles when error is present', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput
        value=""
        onChangeText={onChangeText}
        error="Phone number must be 10 digits"
      />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    const styles = input.props.style;

    // Check if error style is applied (borderColor: '#ef4444')
    expect(styles).toContainEqual(
      expect.objectContaining({
        borderColor: '#ef4444',
      })
    );
  });

  it('should disable input when disabled prop is true', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} disabled={true} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    expect(input.props.editable).toBe(false);
  });

  it('should enable input when disabled prop is false', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} disabled={false} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    expect(input.props.editable).toBe(true);
  });

  it('should enable input by default', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    expect(input.props.editable).toBe(true);
  });

  it('should have maxLength of 14 characters', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    expect(input.props.maxLength).toBe(14);
  });

  it('should have phone-pad keyboard type', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    expect(input.props.keyboardType).toBe('phone-pad');
  });

  it('should apply disabled styles when disabled', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PhoneInput value="" onChangeText={onChangeText} disabled={true} />
    );

    const input = getByPlaceholderText('(555) 123-4567');
    const styles = input.props.style;

    // Check if disabled style is applied (backgroundColor: '#f5f5f5')
    expect(styles).toContainEqual(
      expect.objectContaining({
        backgroundColor: '#f5f5f5',
      })
    );
  });
});
