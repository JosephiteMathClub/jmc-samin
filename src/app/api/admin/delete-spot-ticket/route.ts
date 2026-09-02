import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPER_ADMIN_EMAILS } from '@/lib/constants';

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
    const body = await req.json();
    const {
      spotTicketId,
      memberId,
      email,
      fullName,
      trxnid,
      category,
      adminEmail
    } = body;

    const requesterEmail = (adminEmail || '').trim().toLowerCase();
    
    // Check if requester is a Super Admin
    const isSuperAdminUser = SUPER_ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(requesterEmail);
    
    const supabaseAdmin = getSupabaseAdmin();

    // Verify role in profiles or ec_member if not in hardcoded list
    let verifiedSuperAdmin = isSuperAdminUser;
    if (!verifiedSuperAdmin && requesterEmail) {
      const { data: adminProf } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('email', requesterEmail)
        .maybeSingle();

      if (adminProf?.role === 'super_admin') {
        verifiedSuperAdmin = true;
      }
    }

    if (!verifiedSuperAdmin && !body.isSuperAdmin) {
      return NextResponse.json({
        error: 'Permission Denied: Only Super Administrators have authorization to delete on-spot ticket participant records.'
      }, { status: 403 });
    }

    const cleanMemberId = (memberId || '').toString().replace(/^SPOT-/i, '').trim();
    const targetTicketId = spotTicketId || `spot-${cleanMemberId}`;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanTrxnid = (trxnid || `SPOT-TICKET-${cleanMemberId}`).trim();

    // 1. Remove from site_content (ticket_purchases)
    try {
      const { data: existingContent } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'ticket_purchases')
        .maybeSingle();

      if (existingContent?.data) {
        const spotTickets = { ...(existingContent.data.spotTickets || {}) };
        delete spotTickets[cleanMemberId];
        delete spotTickets[targetTicketId];
        delete spotTickets[`spot-${cleanMemberId}`];

        const fullPurchases = { ...(existingContent.data.purchases || {}) };
        delete fullPurchases[targetTicketId];
        delete fullPurchases[`spot-${cleanMemberId}`];
        delete fullPurchases[cleanMemberId];

        await supabaseAdmin
          .from('site_content')
          .upsert({
            id: 'ticket_purchases',
            data: {
              ...existingContent.data,
              spotTickets,
              purchases: fullPurchases,
              lastUpdated: new Date().toISOString()
            }
          }, { onConflict: 'id' });
      }
    } catch (scErr) {
      console.warn('Could not update site_content on spot ticket delete:', scErr);
    }

    // 2. Remove from category event tables
    const eventTables = [
      'primary_events',
      'junior_events',
      'secondary_events',
      'higher_secondary_events'
    ];

    for (const tbl of eventTables) {
      try {
        if (cleanTrxnid) {
          await supabaseAdmin
            .from(tbl)
            .delete()
            .eq('trxnid', cleanTrxnid);
        }

        if (cleanMemberId) {
          await supabaseAdmin
            .from(tbl)
            .delete()
            .eq('member_id', `SPOT-${cleanMemberId}`);
        }

        // Also check if email matches and trxnid starts with SPOT-TICKET
        if (cleanEmail) {
          await supabaseAdmin
            .from(tbl)
            .delete()
            .ilike('email', cleanEmail)
            .ilike('trxnid', 'SPOT-TICKET-%');
        }
      } catch (tblErr) {
        console.warn(`Could not delete from ${tbl}:`, tblErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `On-spot ticket and registration for ${fullName || cleanMemberId} deleted successfully.`
    });
  } catch (err: any) {
    console.error('Delete Spot Ticket Error:', err);
    return NextResponse.json({
      error: err.message || 'Internal server error while deleting on-spot ticket'
    }, { status: 500 });
  }
}
