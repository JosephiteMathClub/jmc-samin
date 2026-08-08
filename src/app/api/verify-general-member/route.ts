import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  
  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing');
  }

  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  url = url.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: Request) {
  try {
    const { identifier, email, phone } = await req.json();

    const rawInput = (identifier || email || phone || '').trim();
    if (!rawInput) {
      return NextResponse.json({ 
        success: false, 
        isMember: false, 
        message: 'Please provide a valid phone number or email address to verify member status.' 
      }, { status: 400 });
    }

    const cleanInput = rawInput.toLowerCase();
    const cleanPhone = rawInput.replace(/\D/g, ''); // digits only if phone

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check member table by email_address or email or phone
    const { data: memberData, error: memberErr } = await supabaseAdmin
      .from('member')
      .select('id, full_name, email, email_address, phone, member_id')
      .or(`email_address.ilike.${cleanInput},email.ilike.${cleanInput},phone.eq.${rawInput}`)
      .limit(1);

    if (memberData && memberData.length > 0) {
      const m = memberData[0];
      return NextResponse.json({
        success: true,
        isMember: true,
        memberName: m.full_name || 'Verified General Member',
        memberId: m.member_id || '',
        discountPercentage: 50,
        message: `Member verified: ${m.full_name || 'General Member'} (${m.member_id || 'Registered Member'})`
      });
    }

    // 2. Fallback: search profiles table by email
    const { data: profileData, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .ilike('email', cleanInput)
      .limit(1);

    if (profileData && profileData.length > 0) {
      const p = profileData[0];
      return NextResponse.json({
        success: true,
        isMember: true,
        memberName: p.full_name || 'Verified General Member',
        memberId: p.id || '',
        discountPercentage: 50,
        message: `Member verified: ${p.full_name || 'General Member'}`
      });
    }

    return NextResponse.json({
      success: false,
      isMember: false,
      message: 'No registered Josephite Math Club member found matching this email or phone number.'
    });

  } catch (err: any) {
    console.error('Error in verify-general-member API:', err);
    return NextResponse.json({ 
      success: false, 
      isMember: false, 
      error: err.message || 'Verification service error' 
    }, { status: 500 });
  }
}
