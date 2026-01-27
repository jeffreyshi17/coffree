import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
  maxRetries: number = 3,
  retryDelayMs: number = 2000
): Promise<{ success: boolean; results: ExpoPushTicket[]; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (attempt < maxRetries) {
          await sleep(retryDelayMs);
          continue;
        }
        return { success: false, results: [], error: `Expo API error: ${errorText}` };
      }

      const data: ExpoPushResponse = await response.json();
      return { success: true, results: data.data };
    } catch (error) {
      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
        continue;
      }
      return { success: false, results: [], error: 'Network error' };
    }
  }

  return { success: false, results: [], error: 'Network error' };
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, marketingChannel, title, body } = await request.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all phone numbers that have push tokens
    const { data: phones, error: fetchError } = await supabase
      .from('phone_numbers')
      .select('*')
      .not('push_token', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
    }

    if (!phones || phones.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No devices to send notifications to',
        sent: 0,
        failed: 0,
      });
    }

    // Build push notification messages
    const messages: ExpoPushMessage[] = phones.map((phone: { push_token: string }) => ({
      to: phone.push_token,
      sound: 'default',
      title: title,
      body: body,
      data: {
        campaignId,
        marketingChannel,
        screen: 'campaigns',
      },
    }));

    // Send notifications via Expo Push API
    const result = await sendExpoPushNotifications(messages);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        sent: 0,
        failed: phones.length,
      }, { status: 500 });
    }

    // Count successes and failures
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    result.results.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
        if (phones[index]) {
          failedTokens.push(phones[index].push_token);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} notification(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      sent: successCount,
      failed: failureCount,
      failedTokens,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
