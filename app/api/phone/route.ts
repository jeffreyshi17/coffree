import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // US phone numbers should be 10 digits
  return cleaned.length === 10;
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters and return just the digits
  return phone.replace(/\D/g, '');
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

    if (!validatePhoneNumber(phone)) {
      return NextResponse.json({ error: 'Invalid phone number. Must be a valid 10-digit US phone number' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

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

    // Insert new phone number
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert({ phone: normalizedPhone, platform })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
    }

    return NextResponse.json({ success: true, phone: data });
  } catch (error) {
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
