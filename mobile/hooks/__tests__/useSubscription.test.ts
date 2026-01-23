import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useSubscription } from '../useSubscription';
import * as phoneService from '../../services/phoneService';

jest.mock('../../services/phoneService');

describe('useSubscription', () => {
  const mockPhones = [
    {
      id: 1,
      phone: '1234567890',
      platform: 'android' as const,
      created_at: '2024-01-01T00:00:00Z',
      push_token: 'test-token',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch phones on mount', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });

    const { result } = renderHook(() => useSubscription());

    expect(result.current.loading).toBe(true);
    expect(result.current.phones).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.phones).toEqual(mockPhones);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (phoneService.getPhones as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.phones).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should add subscription successfully', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });
    (phoneService.addPhone as jest.Mock).mockResolvedValue({
      success: true,
      phone: mockPhones[0],
      sent: ['1234567890'],
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let addResult;
    await act(async () => {
      addResult = await result.current.addSubscription({
        phone: '1234567890',
        platform: 'android',
        pushToken: 'test-token',
      });
    });

    expect(addResult).toEqual({ success: true, sent: ['1234567890'] });
    expect(phoneService.addPhone).toHaveBeenCalled();
    expect(phoneService.getPhones).toHaveBeenCalledTimes(2); // Initial + after add
  });

  it('should handle add subscription error', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: [] });
    (phoneService.addPhone as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Phone already exists',
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let addResult;
    await act(async () => {
      addResult = await result.current.addSubscription({
        phone: '1234567890',
        platform: 'android',
      });
    });

    expect(addResult).toEqual({ success: false, error: 'Phone already exists' });
  });

  it('should remove subscription successfully', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });
    (phoneService.deletePhone as jest.Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let removeResult;
    await act(async () => {
      removeResult = await result.current.removeSubscription(1);
    });

    expect(removeResult).toEqual({ success: true });
    expect(phoneService.deletePhone).toHaveBeenCalledWith(1);
    expect(phoneService.getPhones).toHaveBeenCalledTimes(2); // Initial + after remove
  });

  it('should handle remove subscription error', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });
    (phoneService.deletePhone as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Phone not found',
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let removeResult;
    await act(async () => {
      removeResult = await result.current.removeSubscription(999);
    });

    expect(removeResult).toEqual({ success: false, error: 'Phone not found' });
  });

  it('should update push token successfully', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });
    (phoneService.updatePushToken as jest.Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updateResult;
    await act(async () => {
      updateResult = await result.current.updateToken(1, 'new-token');
    });

    expect(updateResult).toEqual({ success: true });
    expect(phoneService.updatePushToken).toHaveBeenCalledWith(1, 'new-token');
    expect(phoneService.getPhones).toHaveBeenCalledTimes(2); // Initial + after update
  });

  it('should handle update token error', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });
    (phoneService.updatePushToken as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to update',
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updateResult;
    await act(async () => {
      updateResult = await result.current.updateToken(1, 'new-token');
    });

    expect(updateResult).toEqual({ success: false, error: 'Failed to update' });
  });

  it('should refetch phones when refetch is called', async () => {
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    jest.clearAllMocks();
    (phoneService.getPhones as jest.Mock).mockResolvedValue({ phones: mockPhones });

    await act(async () => {
      await result.current.refetch();
    });

    expect(phoneService.getPhones).toHaveBeenCalled();
  });
});
