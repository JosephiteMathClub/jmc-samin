export function normalizeSection(rawSection?: string | string[]): string {
  if (!rawSection) return '';
  const s = Array.isArray(rawSection) ? rawSection[0] : rawSection;
  const lower = s.toLowerCase().trim();
  
  const aliasMap: Record<string, string> = {
    'super-admin': 'super_admin',
    'superadmin': 'super_admin',
    'ticket-purchase': 'ticket_purchase',
    'festival-calendar': 'festival_calendar',
    'session-handouts': 'handouts',
    'resources': 'resources_mgmt',
    'resources-library': 'resources_mgmt',
    'resources-mgmt': 'resources_mgmt',
    'ec-members': 'ec_members',
    'ecmembers': 'ec_members',
    'food-management': 'food',
    'challenge-problems': 'challenge',
    'email-confirmations': 'email_confirmations',
    'email-logs': 'email_confirmations',
    'event-registrations': 'event_registrations',
    'unique-registrants': 'event_registrations',
    'ca-participants': 'ca_participants',
    'inter-reg-config': 'inter_reg_config',
    'inter-config': 'inter_reg_config',
    'developers-page': 'developers',
    'audit-logs': 'audit_logs',
    'site-config': 'site',
  };
  
  return aliasMap[lower] || lower;
}

export const SUPER_ADMIN_TABS = new Set([
  'super_admin',
  'super-admin',
  'audit_logs',
  'audit-logs',
  'site',
  'home',
  'about',
  'panel',
  'developers',
  'support'
]);
