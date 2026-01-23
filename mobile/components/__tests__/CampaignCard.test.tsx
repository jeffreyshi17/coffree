import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CampaignCard from '../CampaignCard';
import * as campaignService from '../../services/campaignService';

jest.mock('../../services/campaignService', () => ({
  formatTimeAgo: jest.fn((date: Date) => '2 hours ago'),
}));

describe('CampaignCard', () => {
  const mockCampaign: campaignService.Campaign = {
    id: 1,
    campaign_id: 'TEST123',
    marketing_channel: 'email',
    full_link: 'https://coffree.capitalone.com/sms/?cid=TEST123&mc=email',
    is_valid: true,
    is_expired: false,
    first_seen_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render campaign information', () => {
    const { getByText } = render(<CampaignCard campaign={mockCampaign} />);

    expect(getByText('Free Coffee Voucher')).toBeTruthy();
    expect(getByText('Capital One Offer')).toBeTruthy();
    expect(getByText('TEST123')).toBeTruthy();
    expect(getByText('email')).toBeTruthy();
  });

  it('should display formatted time ago', () => {
    const { getByText } = render(<CampaignCard campaign={mockCampaign} />);

    expect(getByText('2 hours ago')).toBeTruthy();
    expect(campaignService.formatTimeAgo).toHaveBeenCalled();
  });

  it('should display available status', () => {
    const { getByText } = render(<CampaignCard campaign={mockCampaign} />);

    expect(getByText('✓ Available')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <CampaignCard campaign={mockCampaign} onPress={onPressMock} />
    );

    const card = getByText('Free Coffee Voucher').parent?.parent?.parent;
    if (card) {
      fireEvent.press(card);
    }

    expect(onPressMock).toHaveBeenCalled();
  });

  it('should be disabled when onPress is not provided', () => {
    const { getByText } = render(<CampaignCard campaign={mockCampaign} />);

    const card = getByText('Free Coffee Voucher').parent?.parent?.parent;
    expect(card?.props.disabled).toBe(true);
  });

  it('should not be disabled when onPress is provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <CampaignCard campaign={mockCampaign} onPress={onPressMock} />
    );

    const card = getByText('Free Coffee Voucher').parent?.parent?.parent;
    expect(card?.props.disabled).toBe(false);
  });

  it('should display coffee icon', () => {
    const { getByText } = render(<CampaignCard campaign={mockCampaign} />);

    expect(getByText('☕')).toBeTruthy();
  });

  it('should display all detail labels', () => {
    const { getByText } = render(<CampaignCard campaign={mockCampaign} />);

    expect(getByText('Campaign ID:')).toBeTruthy();
    expect(getByText('Marketing Channel:')).toBeTruthy();
    expect(getByText('Added:')).toBeTruthy();
  });
});
