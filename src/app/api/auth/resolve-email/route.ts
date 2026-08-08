import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  
  if (!key) {
    key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  }
  
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

const slugifyName = (name: string): string => {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim();
    const isPhoneInput = !cleanIdentifier.includes('@') && /^[0-9+\s\-()]+$/.test(cleanIdentifier);
    const isEmailInput = cleanIdentifier.includes('@');

    const supabaseAdmin = getSupabaseAdmin();

    if (isPhoneInput) {
      try {
        const rawPhone = cleanIdentifier.replace(/\D/g, '');
        const last10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
        const phoneVariants = Array.from(new Set([
          cleanIdentifier,
          rawPhone,
          last10,
          `0${last10}`,
          `+880${last10}`,
          `880${last10}`
        ])).filter(Boolean);

        // 1. Check profiles table (both phone and email columns)
        const orConditions = [
          ...phoneVariants.map(v => `phone.eq.${v}`),
          ...phoneVariants.map(v => `email.eq.${v}`)
        ].join(',');

        const { data: profilePhones } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, phone')
          .or(orConditions);

        if (profilePhones && profilePhones.length > 0) {
          const target = profilePhones[0];
          if (target.id) {
            const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(target.id);
            if (authUserData?.user?.email) {
              return NextResponse.json({ email: authUserData.user.email });
            }
          }
          if (target.email) {
            return NextResponse.json({ email: target.email });
          }
          if (target.full_name) {
            return NextResponse.json({ email: `${slugifyName(target.full_name)}@josephitre.club` });
          }
        }

        // 2. Find by checking member table phone column
        const { data: memberData } = await supabaseAdmin
          .from('member')
          .select('id, full_name, email, email_address, phone')
          .or(orConditions);

        if (memberData && memberData.length > 0) {
          const target = memberData[0];
          if (target.id) {
            const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(target.id);
            if (authUserData?.user?.email) {
              return NextResponse.json({ email: authUserData.user.email });
            }
          }
          if (target.email) {
            return NextResponse.json({ email: target.email });
          }
          if (target.email_address) {
            return NextResponse.json({ email: target.email_address });
          }
          if (target.full_name) {
            return NextResponse.json({ email: `${slugifyName(target.full_name)}@josephitre.club` });
          }
        }

        // 3. Check ec_member table phone column
        const { data: ecData } = await supabaseAdmin
          .from('ec_member')
          .select('id, full_name, email, email_address, phone')
          .or(orConditions);

        if (ecData && ecData.length > 0) {
          const target = ecData[0];
          if (target.id) {
            const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(target.id);
            if (authUserData?.user?.email) {
              return NextResponse.json({ email: authUserData.user.email });
            }
          }
          if (target.email) {
            return NextResponse.json({ email: target.email });
          }
          if (target.email_address) {
            return NextResponse.json({ email: target.email_address });
          }
          if (target.full_name) {
            return NextResponse.json({ email: `${slugifyName(target.full_name)}@josephitre.club` });
          }
        }

        // 4. Fallback check: Search auth.users metadata for matching phone
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (usersData?.users) {
          const matchedUser = usersData.users.find(u => {
            const uPhone = (u.phone || u.user_metadata?.phone || '').toString().replace(/\D/g, '');
            if (!uPhone) return false;
            return uPhone === rawPhone || uPhone.endsWith(last10) || rawPhone.endsWith(uPhone.slice(-10));
          });

          if (matchedUser?.email) {
            return NextResponse.json({ email: matchedUser.email });
          }
        }
      } catch (err) {
        console.error('Error in phone resolution DB query:', err);
      }

      // If no account matched this phone number, return helpful error
      return NextResponse.json({ 
        error: 'No registered account found with this phone number. Please check the phone number or register a new account.' 
      }, { status: 400 });
    } else if (!isEmailInput) {
      // Name input is explicitly disabled
      return NextResponse.json({ 
        error: 'Logging in using full name is no longer supported. Please log in using your Phone Number or Email Address.' 
      }, { status: 400 });
    } else {
      // It's a real email input.
      try {
        // 1. Check profiles table
        const { data: profiles, error: pErr } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('email', cleanIdentifier.toLowerCase());

        if (pErr) {
          console.error('Error fetching profiles in resolve-email API:', pErr);
        }

        if (profiles && profiles.length > 0) {
          if (profiles.length > 1) {
            return NextResponse.json({
              error: `Multiple accounts are registered with this email (${profiles.map(p => p.full_name).join(', ')}). Please sign in using your Given Name instead of your email address.`
            }, { status: 400 });
          } else {
            return NextResponse.json({ email: `${slugifyName(profiles[0].full_name)}@josephitre.club` });
          }
        }

        // 2. Check member table for email or email_address
        const { data: members } = await supabaseAdmin
          .from('member')
          .select('full_name')
          .or(`email.eq.${cleanIdentifier.toLowerCase()},email_address.eq.${cleanIdentifier.toLowerCase()}`);

        if (members && members.length > 0) {
          return NextResponse.json({ email: `${slugifyName(members[0].full_name)}@josephitre.club` });
        }

        // 3. Check ec_member table for email or email_address
        const { data: ecMembers } = await supabaseAdmin
          .from('ec_member')
          .select('full_name')
          .or(`email.eq.${cleanIdentifier.toLowerCase()},email_address.eq.${cleanIdentifier.toLowerCase()}`);

        if (ecMembers && ecMembers.length > 0) {
          return NextResponse.json({ email: `${slugifyName(ecMembers[0].full_name)}@josephitre.club` });
        }
      } catch (err) {
        console.error('Error in email resolution DB query:', err);
      }

      // If no profile found, check if it's already a virtual email
      if (cleanIdentifier.endsWith('@josephitre.club')) {
        return NextResponse.json({ email: cleanIdentifier });
      }

      // Otherwise, return as is (maybe it's a super-admin or other login email in auth.users)
      return NextResponse.json({ email: cleanIdentifier });
    }
  } catch (err: any) {
    console.error('Error in resolve-email route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
