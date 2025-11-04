import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters and return just the digits
  return phone.replace(/\D/g, '');
}

async function testPhoneWithCapitalOne(
  phone: string,
  platform: 'android' | 'apple',
  campaignId: string,
  marketingChannel: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.capitalone.com/protected/24565/retail/digital-offers/text-pass', {
      method: 'POST',
      headers: {
        'accept': 'application/json; v=1',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        marketingChannel,
        platform,
        phoneNumber: phone,
      }),
    });

    const data = await response.json();

    if (response.status === 200 || response.ok) {
      return { success: true };
    }

    // Check for invalid phone number error
    const errorText = data.developerText || data.userText || '';
    if (errorText.toLowerCase().includes('phonenumber is invalid') ||
        errorText.toLowerCase().includes('phone') && errorText.toLowerCase().includes('invalid')) {
      return { success: false, error: 'Invalid phone number' };
    }

    // For other errors (campaign issues, etc), we'll still consider the phone valid
    // Only return false if it's specifically a phone number problem
    return { success: false, error: data.developerText || 'Failed to send' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// GET - Fetch all phone numbers
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
    }

    return NextResponse.json({ phones: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new phone number
export async function POST(request: NextRequest) {
  try {
    const { phone, platform } = await request.json();

    if (!phone || !platform) {
      return NextResponse.json({ error: 'Phone and platform are required' }, { status: 400 });
    }

    if (platform !== 'android' && platform !== 'apple') {
      return NextResponse.json({ error: 'Platform must be either "android" or "apple"' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Basic format check
    if (normalizedPhone.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if phone already exists
    const { data: existing } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Phone number already subscribed' }, { status: 400 });
    }

    // Get the most recent SUCCESSFUL campaign from message_logs to test with
    const { data: recentLog } = await supabase
      .from('message_logs')
      .select('campaign_id, marketing_channel')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!recentLog) {
      // No campaigns yet, just add the number without testing
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({ phone: normalizedPhone, platform })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        phone: data,
        message: 'Phone added successfully (no campaigns to test with yet)'
      });
    }

    // Test the phone number with Capital One API
    console.log(`Testing phone ${normalizedPhone} with campaign ${recentLog.campaign_id}`);
    const testResult = await testPhoneWithCapitalOne(
      normalizedPhone,
      platform,
      recentLog.campaign_id,
      recentLog.marketing_channel
    );

    if (!testResult.success) {
      const errorLower = (testResult.error || '').toLowerCase();

      // Check if error is about the campaign (not the phone)
      if (errorLower.includes('invalid campaign') ||
          errorLower.includes('expired') ||
          errorLower.includes('campaign')) {
        // Campaign issue - can't validate phone, just add it anyway
        console.log(`Campaign ${recentLog.campaign_id} is invalid, adding phone without validation`);
      } else if (errorLower.includes('phone')) {
        // Phone number issue - reject it
        return NextResponse.json({
          error: 'Invalid phone number - Capital One rejected it',
          details: testResult.error
        }, { status: 400 });
      }
      // For other errors, add the phone anyway (benefit of the doubt)
    }

    // Phone is valid! Add it to the database
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert({ phone: normalizedPhone, platform })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
    }

    // Log the test message
    await supabase.from('message_logs').insert({
      campaign_id: recentLog.campaign_id,
      marketing_channel: recentLog.marketing_channel,
      link: `Test validation for ${normalizedPhone}`,
      phone_number: normalizedPhone,
      status: 'success',
      error_message: 'Phone validation test',
    });

    return NextResponse.json({
      success: true,
      phone: data,
      message: 'Phone validated and added successfully',
      testedWith: recentLog.campaign_id
    });
  } catch (error) {
    console.error('Error in POST /api/phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a phone number
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if phone number exists first
    const { data: existing, error: checkError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({
        error: 'Phone number not found. This number is not subscribed to the mailing list.'
      }, { status: 404 });
    }

    // Delete the phone number
    const { error } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('phone', normalizedPhone);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove phone number' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Phone number removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
