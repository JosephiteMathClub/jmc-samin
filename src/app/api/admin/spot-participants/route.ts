import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

async function verifyAdminOrSuper(req?: Request): Promise<{ isAdmin: boolean; isSuper: boolean; email?: string; adminName?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let authUser: any = null;

    // 1. Check Bearer token first if present in request headers
    if (req) {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
          const { data: { user: bearerUser } } = await supabaseAdmin.auth.getUser(token);
          if (bearerUser) {
            authUser = bearerUser;
          }
        }
      }
    }

    // 2. Fall back to cookies
    if (!authUser) {
      const cookieStore = await cookies();
      const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (anonUrl && anonKey) {
        const supabase = createServerClient(
          anonUrl,
          anonKey,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet: any) {
                cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options));
              },
            },
          }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) authUser = user;
      }
    }

    if (!authUser) {
      return { isAdmin: false, isSuper: false };
    }

    const email = (authUser.email || '').toLowerCase().trim();

    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    const SUPER_ADMINS = Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS,
      'samintausif38@gmail.com',
      'superadmin@josephite.club',
      'admin@josephite.club'
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    const isSuperByEmail = SUPER_ADMINS.includes(email);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', authUser.id)
      .maybeSingle();

    const role = (profile?.role || authUser.user_metadata?.role || '').toString().toLowerCase().trim();
    const isSuper = Boolean(isSuperByEmail || role === 'super_admin');
    const isAdmin = Boolean(isSuper || role === 'admin' || role === 'moderator' || (adminEmailsEnv && adminEmailsEnv.toLowerCase().includes(email)));

    return {
      isAdmin,
      isSuper,
      email,
      adminName: profile?.full_name || authUser.user_metadata?.full_name || 'Admin'
    };
  } catch (err) {
    console.error('Error verifying admin in spot-participants:', err);
    return { isAdmin: false, isSuper: false };
  }
}

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminOrSuper(req);
    if (!auth.isAdmin && !auth.isSuper) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Super Admin credentials required.' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let records: any[] = [];
    let tableExists = true;

    // 1. Query spot_ticket_participants
    try {
      const { data, error } = await supabaseAdmin
        .from('spot_ticket_participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          tableExists = false;
        } else {
          console.error('Error fetching spot_ticket_participants:', error);
        }
      } else if (data) {
        records = data;
      }
    } catch (tblErr) {
      console.warn('Catch error querying spot_ticket_participants:', tblErr);
      tableExists = false;
    }

    // 2. Read site_content to cross-check or auto-sync
    try {
      const { data: siteData } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'ticket_purchases')
        .maybeSingle();

      const spotTickets = siteData?.data?.spotTickets || {};
      const existingTicketIds = new Set(records.map(r => r.ticket_id?.replace(/^#/, '')));

      // If table exists and has missing records from site_content, backfill them
      const missingToBackfill: any[] = [];

      Object.entries(spotTickets).forEach(([spotId, ticket]: [string, any]) => {
        const fullTicketId = `SPOT-${spotId.replace(/^spot-/i, '').replace(/^#/i, '')}`;
        if (!existingTicketIds.has(fullTicketId) && !existingTicketIds.has(`SPOT-${spotId}`) && !existingTicketIds.has(spotId)) {
          const transformed = {
            ticket_id: fullTicketId,
            user_id: ticket.userId || null,
            full_name: ticket.fullName || 'Spot Registrant',
            email: ticket.email || '',
            phone: ticket.phone || '',
            academic_class: ticket.class || 'N/A',
            section: ticket.section || 'N/A',
            roll: ticket.roll || 'Spot Reg',
            school: ticket.school || 'St. Joseph Higher Secondary School',
            category: ticket.category || 'Secondary',
            selected_events: Array.isArray(ticket.eventsList) ? ticket.eventsList.join(', ') : (ticket.events || ''),
            is_team: Boolean(ticket.teamName || (ticket.teamMembers && ticket.teamMembers.length > 0)),
            team_name: ticket.teamName || null,
            team_members: ticket.teamMembers || [],
            amount: Number(ticket.amount || 0),
            trxnid: ticket.trxnid || `SPOT-TICKET-${spotId.replace(/^spot-/i, '')}`,
            payment_method: 'cash',
            verified: ticket.confirmed ? 'yes' : 'no',
            verified_by: ticket.confirmedBy || 'Admin',
            verified_by_name: ticket.confirmedByName || 'Admin',
            verified_by_email: ticket.confirmedByEmail || null,
            validated: Boolean(ticket.validated),
            validated_at: ticket.validatedAt || null,
            validated_by: ticket.validatedBy || null,
            snacks_collected: Boolean(ticket.snacks),
            certificate_collected: Boolean(ticket.certificate),
            souvenir_collected: Boolean(ticket.souvenir),
            academic_year: '2025-2026',
            metadata: {
              imported_from_site_content: true,
              confirmed_at: ticket.confirmedAt
            },
            created_at: ticket.confirmedAt || new Date().toISOString()
          };

          if (tableExists) {
            missingToBackfill.push(transformed);
          } else {
            // Include in memory list for user viewing even before table is created
            records.push({
              id: `fallback-${spotId}`,
              ...transformed
            });
          }
        }
      });

      // Auto-insert backfilled items if table exists
      if (tableExists && missingToBackfill.length > 0) {
        try {
          const { data: inserted, error: backfillErr } = await supabaseAdmin
            .from('spot_ticket_participants')
            .upsert(missingToBackfill, { onConflict: 'ticket_id' })
            .select();

          if (!backfillErr && inserted) {
            records = [...records, ...inserted];
          }
        } catch (bErr) {
          console.warn('Could not auto-backfill to spot_ticket_participants:', bErr);
        }
      }
    } catch (scErr) {
      console.warn('Could not check site_content for spot tickets:', scErr);
    }

    // Sort by created_at DESC
    records.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    // Compute stats
    let totalRevenue = 0;
    let teamCount = 0;
    let soloCount = 0;
    let validatedCount = 0;
    const categoryCounts: Record<string, number> = {
      Primary: 0,
      Junior: 0,
      Secondary: 0,
      'Higher Secondary': 0,
      Other: 0
    };

    records.forEach(r => {
      totalRevenue += Number(r.amount || 0);
      if (r.is_team) teamCount++;
      else soloCount++;
      if (r.validated) validatedCount++;

      const cat = r.category || 'Secondary';
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else {
        categoryCounts.Other++;
      }
    });

    return NextResponse.json({
      success: true,
      tableExists,
      records,
      stats: {
        totalCount: records.length,
        totalRevenue,
        teamCount,
        soloCount,
        validatedCount,
        categoryCounts
      }
    });
  } catch (err: any) {
    console.error('GET /api/admin/spot-participants error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminOrSuper(req);
    if (!auth.isAdmin && !auth.isSuper) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Super Admin credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const supabaseAdmin = getSupabaseAdmin();

    // ----------------------------------------------------
    // ACTION: SYNC SPOT PURCHASES (From Ticket Purchase Section)
    // ----------------------------------------------------
    if (action === 'sync_spot_purchases') {
      const spotTickets = body.spotTickets || {};
      const results: string[] = [];
      const currentYear = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

      for (const [spotId, ticket] of Object.entries(spotTickets) as [string, any][]) {
        const rawId = spotId.replace(/^spot-/i, '').replace(/^#/i, '').trim();
        if (!rawId) continue;
        const fullTicketId = `SPOT-${rawId}`;

        const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const safeUserId = isUuid(ticket.userId) ? ticket.userId : null;

        const record = {
          ticket_id: fullTicketId,
          user_id: safeUserId,
          full_name: (ticket.fullName || 'Spot Registrant').trim(),
          email: (ticket.email || '').trim().toLowerCase(),
          phone: (ticket.phone || '').trim(),
          academic_class: (ticket.class || 'N/A').trim(),
          section: (ticket.section || 'N/A').trim(),
          roll: (ticket.roll || 'Spot Reg').trim(),
          school: (ticket.school || 'St. Joseph Higher Secondary School').trim(),
          category: ticket.category || 'Secondary',
          selected_events: Array.isArray(ticket.eventsList) ? ticket.eventsList.join(', ') : (ticket.events || 'Spot Ticket Registration'),
          is_team: Boolean(ticket.teamName || (ticket.teamMembers && ticket.teamMembers.length > 0)),
          team_name: ticket.teamName || null,
          team_members: ticket.teamMembers || [],
          amount: Number(ticket.amount || 0),
          trxnid: ticket.trxnid || `SPOT-TICKET-${rawId}`,
          payment_method: 'cash',
          verified: ticket.confirmed ? 'yes' : 'no',
          verified_by: ticket.confirmedBy || auth.email || 'Admin',
          verified_by_name: ticket.confirmedByName || auth.adminName || 'Admin',
          verified_by_email: ticket.confirmedByEmail || auth.email || null,
          validated: Boolean(ticket.validated),
          validated_at: ticket.validatedAt || null,
          validated_by: ticket.validatedBy || null,
          snacks_collected: Boolean(ticket.snacks),
          certificate_collected: Boolean(ticket.certificate),
          souvenir_collected: Boolean(ticket.souvenir),
          academic_year: currentYear,
          metadata: {
            synced_from_ticket_purchase_section: true,
            confirmed_at: ticket.confirmedAt,
            last_sync_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        };

        const { error: upsertErr } = await supabaseAdmin
          .from('spot_ticket_participants')
          .upsert(record, { onConflict: 'ticket_id' });

        if (!upsertErr) {
          results.push(fullTicketId);

          // Also sync to previous_year_participants
          try {
            const histRecord = {
              original_id: fullTicketId,
              user_id: safeUserId,
              full_name: (ticket.fullName || 'Spot Registrant').trim(),
              email: (ticket.email || '').trim().toLowerCase(),
              phone: (ticket.phone || '').trim(),
              bkash_number: (ticket.phone || '').trim(),
              academic_class: (ticket.class || null),
              section: (ticket.section || null),
              roll: (ticket.roll || null),
              school: (ticket.school || 'St. Joseph Higher Secondary School').trim(),
              source_table: 'spot_registration',
              selected_events: Array.isArray(ticket.eventsList) ? ticket.eventsList.join(', ') : (ticket.events || 'Spot Ticket Registration'),
              trxnid: ticket.trxnid || `SPOT-TICKET-${rawId}`,
              amount: Number(ticket.amount || 0),
              academic_year: currentYear,
              verified: ticket.confirmed ? 'yes' : 'no',
              metadata: {
                registered_from: 'spot_ticket_counter',
                ticket_id: fullTicketId,
                is_team: Boolean(ticket.teamName),
                team_name: ticket.teamName || null,
                verified_by: ticket.confirmedByEmail || ticket.confirmedBy || auth.email || 'Admin',
                registered_at: ticket.confirmedAt || new Date().toISOString()
              }
            };

            const { data: exHist } = await supabaseAdmin
              .from('previous_year_participants')
              .select('id')
              .eq('original_id', fullTicketId)
              .maybeSingle();

            if (exHist?.id) {
              await supabaseAdmin.from('previous_year_participants').update(histRecord).eq('id', exHist.id);
            } else {
              await supabaseAdmin.from('previous_year_participants').insert(histRecord);
            }
          } catch (histErr) {
            console.warn('Could not sync to previous_year_participants:', histErr);
          }
        } else {
          console.warn(`Failed upserting ${fullTicketId} to spot_ticket_participants:`, upsertErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${results.length} spot tickets to spot_ticket_participants table.`,
        syncedTicketIds: results
      });
    }

    // ----------------------------------------------------
    // ACTION: UPDATE PARTICIPANT INFO
    // ----------------------------------------------------
    if (action === 'update_participant') {
      if (!auth.isSuper) {
        return NextResponse.json({ error: 'Unauthorized: Only Super Administrators have authorization to edit participant info.' }, { status: 403 });
      }
      const {
        id,
        ticket_id,
        full_name,
        email,
        phone,
        academic_class,
        section,
        roll,
        school,
        category,
        selected_events,
        is_team,
        team_name,
        team_members,
        amount,
        trxnid,
        payment_method,
        validated,
        snacks_collected,
        certificate_collected,
        souvenir_collected
      } = body;

      const cleanName = (full_name || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhone = (phone || '').trim();
      const cleanTicketId = (ticket_id || '').trim();
      const cleanMemberId = cleanTicketId.replace(/^SPOT-/i, '').replace(/^#/i, '').trim();

      if (!cleanName || !cleanEmail) {
        return NextResponse.json({ error: 'Full name and email are mandatory.' }, { status: 400 });
      }

      const updateData: any = {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        academic_class: (academic_class || 'N/A').trim(),
        section: (section || 'N/A').trim(),
        roll: (roll || 'Spot Reg').trim(),
        school: (school || 'St. Joseph Higher Secondary School').trim(),
        category: category || 'Secondary',
        selected_events: typeof selected_events === 'string' ? selected_events : (Array.isArray(selected_events) ? selected_events.join(', ') : ''),
        is_team: Boolean(is_team || (team_members && team_members.length > 0)),
        team_name: is_team ? (team_name || null) : null,
        team_members: is_team && Array.isArray(team_members) ? team_members : [],
        amount: Number(amount || 0),
        trxnid: trxnid || `SPOT-TICKET-${cleanMemberId}`,
        payment_method: payment_method || 'cash',
        validated: Boolean(validated),
        snacks_collected: Boolean(snacks_collected),
        certificate_collected: Boolean(certificate_collected),
        souvenir_collected: Boolean(souvenir_collected),
        updated_at: new Date().toISOString()
      };

      // 1. Update spot_ticket_participants table
      try {
        if (id && !id.startsWith('fallback-')) {
          await supabaseAdmin
            .from('spot_ticket_participants')
            .update(updateData)
            .eq('id', id);
        } else if (cleanTicketId) {
          await supabaseAdmin
            .from('spot_ticket_participants')
            .update(updateData)
            .eq('ticket_id', cleanTicketId);
        }
      } catch (tblErr) {
        console.warn('Could not update spot_ticket_participants table:', tblErr);
      }

      // 2. Synchronize to site_content (ticket_purchases.spotTickets)
      try {
        const { data: existingContent } = await supabaseAdmin
          .from('site_content')
          .select('data')
          .eq('id', 'ticket_purchases')
          .maybeSingle();

        if (existingContent?.data?.spotTickets) {
          const spotTickets = { ...existingContent.data.spotTickets };
          const targetKey = cleanMemberId || Object.keys(spotTickets).find(k => k === cleanMemberId || `SPOT-${k}` === cleanTicketId);

          if (targetKey && spotTickets[targetKey]) {
            spotTickets[targetKey] = {
              ...spotTickets[targetKey],
              fullName: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              class: updateData.academic_class,
              section: updateData.section,
              roll: updateData.roll,
              school: updateData.school,
              category: updateData.category,
              eventsList: updateData.selected_events.split(',').map((s: string) => s.trim()).filter(Boolean),
              teamName: updateData.team_name,
              teamMembers: updateData.team_members,
              amount: updateData.amount,
              trxnid: updateData.trxnid,
              validated: updateData.validated,
              snacks: updateData.snacks_collected,
              certificate: updateData.certificate_collected,
              souvenir: updateData.souvenir_collected,
              lastModifiedBy: auth.email,
              lastModifiedAt: new Date().toISOString()
            };

            await supabaseAdmin
              .from('site_content')
              .upsert({
                id: 'ticket_purchases',
                data: {
                  ...existingContent.data,
                  spotTickets,
                  lastUpdated: new Date().toISOString()
                }
              }, { onConflict: 'id' });
          }
        }
      } catch (scErr) {
        console.warn('Could not sync update to site_content:', scErr);
      }

      // 3. Update category event tables (primary_events, junior_events, secondary_events, higher_secondary_events)
      const targetCategoryTable = 
        updateData.category === 'Primary' ? 'primary_events' :
        updateData.category === 'Junior' ? 'junior_events' :
        updateData.category === 'Higher Secondary' ? 'higher_secondary_events' :
        'secondary_events';

      const eventPayload: any = {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        class: updateData.academic_class,
        section: updateData.section,
        roll: updateData.roll,
        school: updateData.school,
        selected_events: updateData.selected_events,
        team_name: updateData.team_name,
        team_members: updateData.team_members
      };

      try {
        if (cleanMemberId) {
          await supabaseAdmin
            .from(targetCategoryTable)
            .update(eventPayload)
            .or(`member_id.eq.SPOT-${cleanMemberId},trxnid.eq.${updateData.trxnid}`);
        }
      } catch (catErr) {
        console.warn(`Could not update category table ${targetCategoryTable}:`, catErr);
      }

      // 4. Update in previous_year_participants (Updating history of participants)
      try {
        if (cleanTicketId) {
          await supabaseAdmin
            .from('previous_year_participants')
            .update({
              full_name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              academic_class: updateData.academic_class,
              section: updateData.section,
              roll: updateData.roll,
              school: updateData.school,
              selected_events: updateData.selected_events,
              amount: updateData.amount
            })
            .eq('original_id', cleanTicketId);
        }
      } catch (histErr) {
        console.warn('Could not update in previous_year_participants:', histErr);
      }

      return NextResponse.json({
        success: true,
        message: `Participant "${cleanName}" (${cleanTicketId}) updated successfully across all tables.`
      });
    }

    // ----------------------------------------------------
    // ACTION: DELETE PARTICIPANT
    // ----------------------------------------------------
    if (action === 'delete_participant') {
      const { id, ticket_id, email, trxnid, fullName } = body;
      const cleanTicketId = (ticket_id || '').trim();
      const cleanMemberId = cleanTicketId.replace(/^SPOT-/i, '').replace(/^#/i, '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanTrxnid = (trxnid || '').trim();

      // 1. Delete from spot_ticket_participants
      try {
        if (id && !id.startsWith('fallback-')) {
          await supabaseAdmin
            .from('spot_ticket_participants')
            .delete()
            .eq('id', id);
        }
        if (cleanTicketId) {
          await supabaseAdmin
            .from('spot_ticket_participants')
            .delete()
            .eq('ticket_id', cleanTicketId);
        }
      } catch (tblErr) {
        console.warn('Could not delete from spot_ticket_participants:', tblErr);
      }

      // 2. Delete from site_content
      try {
        const { data: existingContent } = await supabaseAdmin
          .from('site_content')
          .select('data')
          .eq('id', 'ticket_purchases')
          .maybeSingle();

        if (existingContent?.data?.spotTickets) {
          const spotTickets = { ...existingContent.data.spotTickets };
          delete spotTickets[cleanMemberId];
          delete spotTickets[cleanTicketId];
          delete spotTickets[`spot-${cleanMemberId}`];

          const fullPurchases = { ...(existingContent.data.purchases || {}) };
          delete fullPurchases[`spot-${cleanMemberId}`];
          delete fullPurchases[cleanTicketId];

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
        console.warn('Could not delete from site_content:', scErr);
      }

      // 3. Delete from live category event tables
      const eventTables = [
        'primary_events',
        'junior_events',
        'secondary_events',
        'higher_secondary_events'
      ];

      for (const tbl of eventTables) {
        try {
          if (cleanMemberId) {
            await supabaseAdmin.from(tbl).delete().eq('member_id', `SPOT-${cleanMemberId}`);
          }
          if (cleanTrxnid) {
            await supabaseAdmin.from(tbl).delete().eq('trxnid', cleanTrxnid);
          }
        } catch (tblErr) {
          console.warn(`Could not delete from ${tbl}:`, tblErr);
        }
      }

      // 4. Delete from previous_year_participants
      try {
        if (cleanTicketId) {
          await supabaseAdmin
            .from('previous_year_participants')
            .delete()
            .or(`original_id.eq.${cleanTicketId},original_id.ilike.${cleanTicketId}-%`);
        }
      } catch (histErr) {
        console.warn('Could not delete from previous_year_participants:', histErr);
      }

      return NextResponse.json({
        success: true,
        message: `Participant record for "${fullName || cleanTicketId}" deleted successfully.`
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/admin/spot-participants error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
