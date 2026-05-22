const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'secret',
  'mfasecret',
  'apikey',
  'authorization',
]);

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function labelForMethod(method: string, resource = 'record'): string {
  if (method === 'POST') return `Created ${resource}`;
  if (method === 'PUT' || method === 'PATCH') return `Updated ${resource}`;
  if (method === 'DELETE') return `Deleted ${resource}`;
  return `Modified ${resource}`;
}

/** Strip secrets before anything is persisted in logs. */
export function sanitizeLogPayload(body: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const safe: Record<string, unknown> = { ...body };
  for (const key of Object.keys(safe)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('secret')) {
      safe[key] = '[redacted]';
    }
  }
  return safe;
}

/** Build a short, human-readable description for audit/system log UIs. */
export function buildHumanLogDetails(
  method: string,
  url: string,
  body?: Record<string, unknown> | null,
  oldData?: Record<string, unknown> | null,
): string {
  const lowerUrl = url.toLowerCase();
  const b = sanitizeLogPayload(body);
  const parts: string[] = [];

  if (lowerUrl.includes('/auth/login')) {
    const id = (b.email || b.identifier) as string | undefined;
    return id ? `Signed in as ${id}` : 'User authenticated successfully';
  }
  if (lowerUrl.includes('/auth/logout')) return 'User signed out';
  if (lowerUrl.includes('/auth/refresh')) return 'Session token refreshed';
  if (lowerUrl.includes('/auth/mfa')) return 'Multi-factor authentication updated';

  if (lowerUrl.includes('/cookies') || lowerUrl.includes('/public/cookies')) {
    if (b.status) parts.push(`Status: ${capitalize(String(b.status))}`);
    if (b.userId) parts.push(`User ID: ${b.userId}`);
    if (b.domain) parts.push(`Domain: ${b.domain}`);
    if (b.name) parts.push(`Configuration: ${b.name}`);
    return parts.length ? parts.join(' · ') : 'Cookie preferences recorded';
  }

  if (lowerUrl.includes('/consent-records') || lowerUrl.includes('/public/consent')) {
    if (b.status) parts.push(`Status: ${capitalize(String(b.status))}`);
    const who = (b.endUserEmail || b.email || b.endUserPhone || b.identifier) as string | undefined;
    if (who) parts.push(`Subject: ${who}`);
    if (b.purposeId) parts.push(`Purpose: ${b.purposeId}`);
    return parts.length ? parts.join(' · ') : 'Consent record saved';
  }

  if (lowerUrl.includes('/users')) {
    if (method === 'DELETE' && oldData) {
      const removed = (oldData.email || oldData.name) as string | undefined;
      if (removed) return `Removed user ${removed}`;
    }
    if (b.name) parts.push(`Name: ${b.name}`);
    if (b.email) parts.push(`Email: ${b.email}`);
    if (b.status) parts.push(`Status: ${b.status}`);
    return parts.length ? parts.join(' · ') : labelForMethod(method, 'user account');
  }

  if (lowerUrl.includes('/rights') || lowerUrl.includes('/grievances')) {
    const type = (b.requestType || b.type) as string | undefined;
    const requester = (b.requesterEmail || b.requesterName || b.email) as string | undefined;
    if (type) parts.push(`Type: ${type}`);
    if (requester) parts.push(`Requester: ${requester}`);
    if (b.status) parts.push(`Status: ${b.status}`);
    return parts.length ? parts.join(' · ') : labelForMethod(method, 'request');
  }

  if (lowerUrl.includes('/roles')) {
    const name = (b.name || oldData?.name) as string | undefined;
    return name ? `${labelForMethod(method, 'role')}: ${name}` : labelForMethod(method, 'role');
  }

  if (lowerUrl.includes('/invitations')) {
    if (b.email) return `Invitation sent to ${b.email}`;
    return labelForMethod(method, 'invitation');
  }

  if (lowerUrl.includes('/api-keys')) {
    if (b.name) return `${labelForMethod(method, 'API key')}: ${b.name}`;
    return labelForMethod(method, 'API key');
  }

  const genericFields: Array<{ key: string; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'label', label: 'Label' },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Type' },
    { key: 'email', label: 'Email' },
    { key: 'domain', label: 'Domain' },
    { key: 'description', label: 'Description' },
  ];

  for (const { key, label } of genericFields) {
    const value = b[key];
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${label}: ${value}`);
    }
  }

  if (parts.length) return parts.join(' · ');

  if (oldData && (method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    const label = (oldData.name || oldData.title || oldData.email) as string | undefined;
    if (label) return `${labelForMethod(method)}: ${label}`;
  }

  if (typeof b.message === 'string') return b.message;
  if (typeof b.note === 'string') return b.note;

  return '';
}

/** Normalize stored details (string or legacy JSON) for API responses. */
export function normalizeLogDetailsForDisplay(details: unknown): string {
  if (details === null || details === undefined) return '';
  if (typeof details === 'string') {
    const trimmed = details.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return normalizeLogDetailsForDisplay(JSON.parse(trimmed));
      } catch {
        return details;
      }
    }
    return details;
  }
  if (typeof details !== 'object') return String(details);

  const obj = details as Record<string, unknown>;
  if (typeof obj.summary === 'string') return obj.summary;

  if (obj.requestBody && typeof obj.requestBody === 'object' && !Array.isArray(obj.requestBody)) {
    const rebuilt = buildHumanLogDetails('POST', '/', obj.requestBody as Record<string, unknown>);
    if (rebuilt) return rebuilt;
  }

  if (typeof obj.email === 'string') return `Email: ${obj.email}`;
  if (obj.status !== undefined) return `Status: ${obj.status}`;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.note === 'string') return obj.note;
  if (typeof obj.description === 'string') return obj.description;
  if (typeof obj.result === 'string') return obj.result;

  return '';
}
