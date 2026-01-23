const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface PhoneNumber {
  id: number;
  phone: string;
  platform: 'android' | 'apple';
  created_at: string;
  push_token?: string;
}

export interface AddPhoneRequest {
  phone: string;
  platform: 'android' | 'apple';
  pushToken?: string;
}

export interface AddPhoneResponse {
  success: boolean;
  phone?: PhoneNumber;
  message?: string;
  error?: string;
  details?: string;
  sent?: string[];
  failed?: string[];
}

export interface GetPhonesResponse {
  phones: PhoneNumber[];
}

export interface DeletePhoneResponse {
  success: boolean;
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  retryDelayMs: number = 2000
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to fetch after retries');
}

/**
 * Normalize phone number to remove all non-digit characters
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format phone number as (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  const phoneNumber = value.replace(/\D/g, '');

  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
}

/**
 * Validate phone number format (must be 10 digits)
 */
export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 10;
}

/**
 * Get all subscribed phone numbers
 */
export async function getPhones(): Promise<GetPhonesResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/phone`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch phone numbers');
  }

  const data = await response.json();
  return {
    phones: data.phones || [],
  };
}

/**
 * Add a new phone number subscription
 */
export async function addPhone(request: AddPhoneRequest): Promise<AddPhoneResponse> {
  const normalized = normalizePhoneNumber(request.phone);

  if (!validatePhoneNumber(normalized)) {
    return {
      success: false,
      error: 'Phone number must be 10 digits',
    };
  }

  const response = await fetchWithRetry(`${API_BASE_URL}/api/phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: normalized,
      platform: request.platform,
      pushToken: request.pushToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'Failed to add phone number',
      details: data.details,
    };
  }

  return {
    success: true,
    phone: data.phone,
    message: data.message,
    sent: data.sent,
    failed: data.failed,
  };
}

/**
 * Delete a phone number subscription
 */
export async function deletePhone(phoneId: number): Promise<DeletePhoneResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/phone`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: phoneId }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'Failed to delete phone number',
    };
  }

  return {
    success: true,
  };
}

/**
 * Update push token for a phone number
 */
export async function updatePushToken(
  phoneId: number,
  pushToken: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/phone`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: phoneId, pushToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'Failed to update push token',
    };
  }

  return {
    success: true,
  };
}
