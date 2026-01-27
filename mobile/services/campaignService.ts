const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface Campaign {
  id: number;
  campaign_id: string;
  marketing_channel: string;
  full_link: string;
  is_valid: boolean;
  is_expired: boolean;
  first_seen_at: string;
}

export interface CampaignCount {
  count: number;
  distributed: number;
}

export interface SendCoffeeRequest {
  link: string;
  phoneOverride?: string;
}

export interface SendCoffeeResponse {
  success?: boolean;
  error?: string;
  type?: 'invalid' | 'expired';
  sent?: string[];
  failed?: { phone: string; error: string }[];
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
 * Fetch list of campaigns
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/campaigns?is_valid=true&is_expired=false`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch campaigns');
  }

  const data = await response.json();
  return data.campaigns || [];
}

/**
 * Fetch count of valid campaigns and distributed vouchers
 */
export async function getCampaignCount(): Promise<CampaignCount> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/campaigns/count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaign count');
  }

  const data = await response.json();
  return {
    count: data.count || 0,
    distributed: data.distributed || 0,
  };
}

/**
 * Send coffee campaign to phones
 */
export async function sendCoffee(request: SendCoffeeRequest): Promise<SendCoffeeResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/send-coffee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      error: data.error || 'Failed to send coffee',
      type: data.type,
    };
  }

  return {
    success: true,
    sent: data.sent,
    failed: data.failed,
  };
}

/**
 * Parse a coffee link to extract campaign ID and marketing channel
 */
export function parseCoffeeLink(url: string): { cid: string; mc: string } | null {
  try {
    const urlObj = new URL(url);

    // Validate the base URL
    if (!urlObj.hostname.includes('coffree.capitalone.com') || !urlObj.pathname.includes('/sms/')) {
      return null;
    }

    const cid = urlObj.searchParams.get('cid');
    let mc = urlObj.searchParams.get('mc');

    if (!cid || !mc) {
      return null;
    }

    // Sanitize marketing channel to only contain letters
    mc = mc.replace(/[^a-zA-Z]/g, '');

    if (!mc) {
      return null;
    }

    return { cid, mc };
  } catch (error) {
    return null;
  }
}

/**
 * Format a timestamp as human-readable time ago
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
