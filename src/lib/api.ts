const API_BASE = '/api';

async function apiRequest(endpoint: string, options?: RequestInit) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('lr-auth-storage')
      : null;
  let authToken = '';
  if (token) {
    try {
      const parsed = JSON.parse(token);
      authToken = parsed?.state?.user?.token || '';
    } catch {
      // ignore parse errors
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// Auth
export const loginOwner = (email: string, password: string) =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const loginAdmin = (adminId: string, password: string) =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ adminId, password }),
  });

export const verifyToken = (token: string) =>
  apiRequest('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

// Keys
export const getKeys = (params?: string) =>
  apiRequest(`/keys${params ? '?' + params : ''}`);
export const generateKey = (data: Record<string, unknown>) =>
  apiRequest('/keys', { method: 'POST', body: JSON.stringify(data) });
export const updateKey = (id: string, data: Record<string, unknown>) =>
  apiRequest(`/keys/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteKey = (id: string) =>
  apiRequest(`/keys/${id}`, { method: 'DELETE' });

// Admins
export const getAdmins = (params?: string) =>
  apiRequest(`/admins${params ? '?' + params : ''}`);
export const createAdmin = (data: Record<string, unknown>) =>
  apiRequest('/admins', { method: 'POST', body: JSON.stringify(data) });
export const updateAdmin = (id: string, data: Record<string, unknown>) =>
  apiRequest(`/admins/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAdmin = (id: string) =>
  apiRequest(`/admins/${id}`, { method: 'DELETE' });
export const getBalanceLogs = (adminId: string) =>
  apiRequest(`/balance/${adminId}`);

// Dashboard
export const getStats = () => apiRequest('/dashboard/stats');

// Setup
export const checkSetup = async (): Promise<{ setup: boolean; tables?: Record<string, boolean> }> => {
  try {
    const res = await fetch(`${API_BASE}/setup`);
    return res.json();
  } catch {
    return { setup: false, tables: { admins: false, licence_keys: false, balance_logs: false } };
  }
};
