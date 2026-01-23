import {
  normalizePhoneNumber,
  formatPhoneNumber,
  validatePhoneNumber,
  getPhones,
  addPhone,
  deletePhone,
  updatePushToken,
  AddPhoneRequest,
} from '../phoneService';

// Mock global fetch
global.fetch = jest.fn();

describe('phoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('normalizePhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhoneNumber('(123) 456-7890')).toBe('1234567890');
      expect(normalizePhoneNumber('123-456-7890')).toBe('1234567890');
      expect(normalizePhoneNumber('123.456.7890')).toBe('1234567890');
      expect(normalizePhoneNumber('+1 (123) 456-7890')).toBe('11234567890');
    });

    it('should handle already normalized numbers', () => {
      expect(normalizePhoneNumber('1234567890')).toBe('1234567890');
    });

    it('should handle empty string', () => {
      expect(normalizePhoneNumber('')).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit number correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should format partial numbers correctly', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('1234')).toBe('(123) 4');
      expect(formatPhoneNumber('123456')).toBe('(123) 456');
    });

    it('should handle numbers with formatting', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should truncate at 10 digits', () => {
      expect(formatPhoneNumber('12345678901234')).toBe('(123) 456-7890');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate 10-digit numbers', () => {
      expect(validatePhoneNumber('1234567890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('123456789')).toBe(false);
      expect(validatePhoneNumber('12345678901')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('getPhones', () => {
    it('should fetch phone numbers successfully', async () => {
      const mockPhones = [
        {
          id: 1,
          phone: '1234567890',
          platform: 'android' as const,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ phones: mockPhones }),
      });

      const result = await getPhones();

      expect(result.phones).toEqual(mockPhones);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/phone'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return empty array when no phones', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getPhones();

      expect(result.phones).toEqual([]);
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(getPhones()).rejects.toThrow('Failed to fetch phone numbers');
    });

    it('should retry on network failure', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ phones: [] }),
        });

      const resultPromise = getPhones();

      // Fast-forward timers to complete retry delay
      await jest.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result.phones).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('addPhone', () => {
    it('should add phone number successfully', async () => {
      const request: AddPhoneRequest = {
        phone: '(123) 456-7890',
        platform: 'android',
        pushToken: 'test-token',
      };

      const mockResponse = {
        success: true,
        phone: {
          id: 1,
          phone: '1234567890',
          platform: 'android',
          created_at: '2024-01-01T00:00:00Z',
          push_token: 'test-token',
        },
        message: 'Phone added successfully',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addPhone(request);

      expect(result.success).toBe(true);
      expect(result.phone).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/phone'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            phone: '1234567890',
            platform: 'android',
            pushToken: 'test-token',
          }),
        })
      );
    });

    it('should validate phone number before adding', async () => {
      const request: AddPhoneRequest = {
        phone: '123', // Invalid
        platform: 'android',
      };

      const result = await addPhone(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number must be 10 digits');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      const request: AddPhoneRequest = {
        phone: '1234567890',
        platform: 'android',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Phone already exists' }),
      });

      const result = await addPhone(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone already exists');
    });
  });

  describe('deletePhone', () => {
    it('should delete phone number successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deletePhone(1);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/phone'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ id: 1 }),
        })
      );
    });

    it('should handle delete errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Phone not found' }),
      });

      const result = await deletePhone(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone not found');
    });
  });

  describe('updatePushToken', () => {
    it('should update push token successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await updatePushToken(1, 'new-token');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/phone'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ id: 1, pushToken: 'new-token' }),
        })
      );
    });

    it('should handle update errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update' }),
      });

      const result = await updatePushToken(1, 'new-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update');
    });
  });
});
