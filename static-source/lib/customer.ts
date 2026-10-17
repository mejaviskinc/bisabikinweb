const SUPABASE_URL = 'https://iyhwephcrxeqwiemhppw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
const FUNCTIONS_URL = SUPABASE_URL + '/functions/v1';
const SESSION_KEY = 'bbweb_customer_session_v1';

export type CustomerSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: any;
};

type RequestOptions = { method?: string; body?: any; token?: string };

async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const headers: Record<string, string> = { apikey: SUPABASE_KEY, Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = 'Bearer ' + options.token;
  const response = await fetch(SUPABASE_URL + path, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store'
  });
  const raw = await response.text();
  let payload: any = null;
  if (raw) { try { payload = JSON.parse(raw); } catch { payload = { message: raw }; } }
  if (!response.ok) throw new Error(String(payload?.msg || payload?.message || payload?.error_description || payload?.error || 'Permintaan akun gagal (' + response.status + ').'));
  return payload;
}

function saveSession(payload: any): CustomerSession {
  const session: CustomerSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(payload.expires_in || 3600),
    user: payload.user
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function customerSignIn(email: string, password: string): Promise<CustomerSession> {
  const payload = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password }
  });
  return saveSession(payload);
}

export async function customerSignUp(email: string, password: string, metadata: { full_name: string; phone: string; company?: string }): Promise<{ session: CustomerSession | null; user: any }> {
  const redirect = typeof window !== 'undefined' ? window.location.origin + '/account/' : 'https://bisabikinweb.site/account/';
  const payload = await request('/auth/v1/signup?redirect_to=' + encodeURIComponent(redirect), {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password, data: metadata }
  });
  return { session: payload?.access_token ? saveSession(payload) : null, user: payload?.user || payload };
}

export async function customerSendPasswordReset(email: string): Promise<void> {
  const redirect = typeof window !== 'undefined' ? window.location.origin + '/account/' : 'https://bisabikinweb.site/account/';
  await request('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirect), {
    method: 'POST',
    body: { email: email.trim().toLowerCase() }
  });
}

export async function customerSignOut(session?: CustomerSession | null): Promise<void> {
  try {
    if (session?.access_token) await request('/auth/v1/logout', { method: 'POST', token: session.access_token });
  } catch {}
  if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
}

export async function customerGetSession(): Promise<CustomerSession | null> {
  if (typeof window === 'undefined') return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hashError = hash.get('error_description');
  if (hashError) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    throw new Error(hashError.replace(/\+/g, ' '));
  }
  const accessToken = hash.get('access_token');
  if (accessToken) {
    const user = await request('/auth/v1/user', { token: accessToken });
    const session = saveSession({
      access_token: accessToken,
      refresh_token: hash.get('refresh_token') || '',
      expires_in: hash.get('expires_in') || 3600,
      user
    });
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return session;
  }
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  let session: CustomerSession;
  try { session = JSON.parse(raw); } catch { localStorage.removeItem(SESSION_KEY); return null; }
  if (!session?.access_token || !session?.refresh_token) { localStorage.removeItem(SESSION_KEY); return null; }
  if (session.expires_at > Date.now() / 1000 + 90) return session;
  try {
    const payload = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token }
    });
    return saveSession(payload);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function customerApi(action: string, data: Record<string, any> = {}, token?: string): Promise<any> {
  if (!token) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  const response = await fetch(FUNCTIONS_URL + '/bbweb-customer-api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ action, ...data }),
    cache: 'no-store'
  });
  const raw = await response.text();
  let payload: any = null;
  if (raw) { try { payload = JSON.parse(raw); } catch { payload = { message: raw }; } }
  if (!response.ok) throw new Error(String(payload?.error || payload?.message || 'Permintaan dashboard gagal (' + response.status + ').'));
  return payload;
}
