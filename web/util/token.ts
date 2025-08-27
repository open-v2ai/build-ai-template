export function getApiUrl() {
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    console.log(window.location.origin);
    return window.location.origin;
  }
  return 'http://localhost:8080';
}

const API_URL_V1 = `${getApiUrl()}/api/v1`;

function getTokenExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

export async function getValidAccessToken() {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  // Get expiration timestamp from accessToken
  const accessTokenExp = accessToken ? getTokenExp(accessToken) : null;
  // Print accessToken expiration time
  console.log('accessTokenExp:', accessTokenExp ? new Date(accessTokenExp) : 'Unable to parse');

  // Check if access_token is expired
  if (accessToken && accessTokenExp && Date.now() < accessTokenExp) {
    return accessToken;
  }

  // If access_token is expired, try to refresh using refresh_token
  if (refreshToken) {
    try {
      const res = await fetch(`${API_URL_V1}/auth/refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      if (res.ok) {
        const data = await res.json() as { access_token: string; refresh_token: string };
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        return data.access_token;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
  }

  return null;
}
