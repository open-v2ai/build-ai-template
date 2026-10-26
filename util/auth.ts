import { getValidAccessToken } from '@/util/token';
import { fetcher } from '@/util/fetcher';

export type UserType = 'user' | 'admin';
export type MembershipType = 'free' | 'monthly' | 'yearly';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  user_type: UserType;
  membership_type: MembershipType;
  last_login_at: string | null;
  created_at: string;
}

/**
 * 检查用户是否为管理员
 * @returns Promise<boolean> - 如果用户是管理员返回 true，否则返回 false
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return false;
    }

    const userProfile = await fetcher('/auth/me', {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    }) as UserProfile;

    if (!userProfile) {
      return false;
    }

    return userProfile.user_type === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * 获取用户类型
 * @returns Promise<UserType | null> - 返回用户类型，如果获取失败返回 null
 */
export async function getUserType(): Promise<UserType | null> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return null;
    }

    const userProfile = await fetcher('/auth/me', {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    }) as UserProfile;

    return userProfile?.user_type || null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
}

/**
 * 获取完整的用户配置信息
 * @returns Promise<UserProfile | null> - 返回用户配置信息，如果获取失败返回 null
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return null;
    }

    const userProfile = await fetcher('/auth/me', {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    }) as UserProfile;

    return userProfile || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * 检查用户是否有访问管理后台的权限
 * @returns Promise<{ hasAccess: boolean; reason?: string }> - 返回是否有权限及原因
 */
export async function checkAdminAccess(): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    // Check if there is a valid access token
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { hasAccess: false, reason: 'NO_ACCESS_TOKEN' };
    }

    // Directly use the obtained accessToken to get user profile information
    const userProfile = await fetcher('/auth/me', {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    }) as UserProfile;

    if (!userProfile) {
      return { hasAccess: false, reason: 'NO_USER_PROFILE' };
    }

    // Check user type
    if (userProfile.user_type !== 'admin') {
      return { hasAccess: false, reason: 'NOT_ADMIN' };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { hasAccess: false, reason: 'CHECK_FAILED' };
  }
}

/**
 * 从 localStorage 获取缓存的用户类型（用于快速检查）
 * @returns UserType | null - 返回缓存的用户类型
 */
export function getCachedUserType(): UserType | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userType = localStorage.getItem('user_type');
  return (userType as UserType) || null;
}

/**
 * 检查缓存的用户是否为管理员（用于快速检查）
 * @returns boolean - 如果缓存显示用户是管理员返回 true
 */
export function isCachedUserAdmin(): boolean {
  const userType = getCachedUserType();
  return userType === 'admin';
}
