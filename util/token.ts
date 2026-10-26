/**
 * 获取 API 基础 URL
 *
 * 功能说明:
 * - 开发环境: 优先使用环境变量 NEXT_PUBLIC_API_URL，默认为 http://localhost:8000
 * - 生产环境: 使用当前页面的 origin（同域名部署）
 * - SSR 环境: 默认返回 http://localhost:8000
 *
 * 返回:
 * - string: API 基础 URL
 */
export function getApiUrl() {
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：使用环境变量或默认值
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  if (typeof window !== 'undefined') {
    // 浏览器环境：使用当前域名
    console.log(window.location.origin);
    return window.location.origin;
  }
  // SSR 环境默认值
  return 'http://localhost:8000';
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
