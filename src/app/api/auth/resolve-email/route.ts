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
        // Check profiles table (email column might hold phone string or matches phone)
        const { data: profilePhone } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('email', cleanIdentifier)
          .maybeSingle();

        if (profilePhone?.full_name) {
          if (profilePhone.email && (profilePhone.email.includes(cleanIdentifier) || profilePhone.email.includes('@'))) {
            return NextResponse.json({ email: profilePhone.email });
          }
          return NextResponse.json({ email: `${slugifyName(profilePhone.full_name)}@josephitre.club` });
        }

        // Find their registered email by checking member table
        const { data: memberData } = await supabaseAdmin
          .from('member')
          .select('full_name, email')
          .eq('phone', cleanIdentifier)
          .maybeSingle();

        if (memberData) {
          if (memberData.email) {
            return NextResponse.json({ email: memberData.email });
          }
          if (memberData.full_name) {
            return NextResponse.json({ email: `${slugifyName(memberData.full_name)}@josephitre.club` });
          }
        }

        // Check ec_member table
        const { data: ecData } = await supabaseAdmin
          .from('ec_member')
          .select('full_name, email')
          .eq('phone', cleanIdentifier)
          .maybeSingle();

        if (ecData) {
          if (ecData.email) {
            return NextResponse.json({ email: ecData.email });
          }
          if (ecData.full_name) {
            return NextResponse.json({ email: `${slugifyName(ecData.full_name)}@josephitre.club` });
          }
        }
      } catch (err) {
        console.error('Error in phone resolution DB query:', err);
      }

      // Fallback to virtual email
      return NextResponse.json({ email: `${cleanIdentifier}@josephitre.club` });
    } else if (!isEmailInput) {
      // It's a Name!
      try {
        // 1. Try to find they have a member or ec_member record with an email column first
        const { data: memberByName } = await supabaseAdmin
          .from('member')
          .select('id, full_name, email')
          .ilike('full_name', `%${cleanIdentifier}%`);

        if (memberByName && memberByName.length > 0) {
          const exactMatch = memberByName.find(m => m.full_name?.trim().toLowerCase() === cleanIdentifier.toLowerCase());
          const targetMember = exactMatch || memberByName[0];
          if (targetMember.email) {
            return NextResponse.json({ email: targetMember.email });
          }
        }

        const { data: ecByName } = await supabaseAdmin
          .from('ec_member')
          .select('id, full_name, email')
          .ilike('full_name', `%${cleanIdentifier}%`);

        if (ecByName && ecByName.length > 0) {
          const exactMatch = ecByName.find(m => m.full_name?.trim().toLowerCase() === cleanIdentifier.toLowerCase());
          const targetMember = exactMatch || ecByName[0];
          if (targetMember.email) {
            return NextResponse.json({ email: targetMember.email });
          }
        }

        // 2. Try exact/close match on full_name in profiles
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .ilike('full_name', cleanIdentifier);

        if (profiles && profiles.length > 0) {
          const exactMatch = profiles.find(p => p.full_name?.trim().toLowerCase() === cleanIdentifier.toLowerCase());
          const targetProfile = exactMatch || (profiles.length === 1 ? profiles[0] : null);
          if (targetProfile) {
            try {
              const { data: uData } = await supabaseAdmin.auth.admin.getUserById(targetProfile.id);
              if (uData?.user?.email) {
                return NextResponse.json({ email: uData.user.email });
              }
            } catch (err) {
              console.error('Error in getUserById during exact profiles resolution:', err);
            }
            return NextResponse.json({ email: `${slugifyName(targetProfile.full_name)}@josephitre.club` });
          }
        }

        // 2. Try wildcard contains match in profiles
        const { data: profilesWild } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .ilike('full_name', `%${cleanIdentifier}%`);

        if (profilesWild && profilesWild.length > 0) {
          const exactSlugMatch = profilesWild.find(p => slugifyName(p.full_name) === slugifyName(cleanIdentifier));
          const targetProfile = exactSlugMatch || profilesWild[0];
          try {
            const { data: uData } = await supabaseAdmin.auth.admin.getUserById(targetProfile.id);
            if (uData?.user?.email) {
              return NextResponse.json({ email: uData.user.email });
            }
          } catch (err) {
            console.error('Error in getUserById during wild profiles resolution:', err);
          }
          return NextResponse.json({ email: `${slugifyName(targetProfile.full_name)}@josephitre.club` });
        }

        // 3. Try searching member table
        const { data: memberData } = await supabaseAdmin
          .from('member')
          .select('id, full_name')
          .ilike('full_name', `%${cleanIdentifier}%`);

        if (memberData && memberData.length > 0) {
          const exactMatch = memberData.find(m => m.full_name?.trim().toLowerCase() === cleanIdentifier.toLowerCase());
          const targetMember = exactMatch || memberData[0];
          try {
            const { data: uData } = await supabaseAdmin.auth.admin.getUserById(targetMember.id);
            if (uData?.user?.email) {
              return NextResponse.json({ email: uData.user.email });
            }
          } catch (err) {
            console.error('Error in getUserById during member resolution:', err);
          }
          return NextResponse.json({ email: `${slugifyName(targetMember.full_name)}@josephitre.club` });
        }

        // 4. Try searching ec_member table
        const { data: ecData } = await supabaseAdmin
          .from('ec_member')
          .select('id, full_name')
          .ilike('full_name', `%${cleanIdentifier}%`);

        if (ecData && ecData.length > 0) {
          const exactMatch = ecData.find(m => m.full_name?.trim().toLowerCase() === cleanIdentifier.toLowerCase());
          const targetMember = exactMatch || ecData[0];
          try {
            const { data: uData } = await supabaseAdmin.auth.admin.getUserById(targetMember.id);
            if (uData?.user?.email) {
              return NextResponse.json({ email: uData.user.email });
            }
          } catch (err) {
            console.error('Error in getUserById during ec_member resolution:', err);
          }
          return NextResponse.json({ email: `${slugifyName(targetMember.full_name)}@josephitre.club` });
        }
      } catch (err) {
        console.error('Error in name resolution DB query:', err);
      }

      // Default fallback
      return NextResponse.json({ email: `${slugifyName(cleanIdentifier)}@josephitre.club` });
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
