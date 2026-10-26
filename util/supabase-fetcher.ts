/**
 * Supabase 版本的 API 请求工具
 *
 * 功能说明:
 * - 提供与原 fetcher 兼容的 API
 * - 使用 Supabase Auth 进行认证
 * - 自动处理 token 刷新
 * - 支持流式响应
 */

import { createClient } from '@/lib/supabase/client'

/**
 * 获取当前用户的语言设置
 */
function getAcceptLanguage(): string {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0) {
    const firstSegment = segments[0];
    if (firstSegment === 'en' || firstSegment === 'zh') {
      return firstSegment;
    }
  }

  return 'zh';
}

type FetchOptions = RequestInit & {
  auth?: boolean;
  needAuth?: boolean; // 兼容旧版本
  stream?: boolean;
};

/**
 * Supabase 版本的 fetcher
 *
 * 与原 fetcher 保持 API 兼容，但底层使用 Supabase
 */
export async function supabaseFetcher<T>(
  url: string,
  options: FetchOptions = {},
  onData?: (chunk: string) => void
): Promise<T | void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': getAcceptLanguage(),
  };

  // 合并自定义 headers
  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(options.headers)) {
    options.headers.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else if (typeof options.headers === 'object' && options.headers) {
    Object.assign(headers, options.headers);
  }

  // 处理认证
  const needAuth = options.auth || options.needAuth;
  if (needAuth) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Unauthorized: No valid session');
    }

    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // 流式请求的特殊头部设置
  if (options.stream) {
    headers['Accept'] = 'text/plain';
    headers['Cache-Control'] = 'no-cache';
    headers['Connection'] = 'keep-alive';
  }

  // 构建完整 URL（兼容旧版本的 /api/v1 前缀）
  let fullUrl = url;
  if (url.startsWith('/')) {
    // 如果是相对路径，添加 /api 前缀（如果还没有）
    if (!url.startsWith('/api/')) {
      // 将 /api/v1/xxx 转换为 /api/xxx
      if (url.startsWith('/api/v1/')) {
        fullUrl = url.replace('/api/v1/', '/api/');
      } else {
        fullUrl = `/api${url}`;
      }
    }
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = 'Request failed';
    let errorDetails = null;

    try {
      const error = await res.json();
      errorMessage = error.error || error.detail || error.message || `HTTP ${res.status}: ${res.statusText}`;
      errorDetails = error;
    } catch (error) {
      console.error('Failed to parse error response:', error);
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }

    const newError = new Error(errorMessage) as Error & {
      status?: number;
      statusText?: string;
      url?: string;
      details?: unknown;
    };
    newError.status = res.status;
    newError.statusText = res.statusText;
    newError.url = fullUrl;
    newError.details = errorDetails;

    throw newError;
  }

  if (options.stream) {
    if (!res.body) {
      throw new Error('响应体为空，无法进行流式读取');
    }

    if (typeof res.body.getReader !== 'function') {
      throw new Error('响应体不支持 getReader 方法');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    try {
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: !done });

          if (onData) {
            onData(chunk);
          }
        }
      }
    } catch (error) {
      throw error;
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {
        console.warn('释放 reader 锁失败:', e);
      }
    }

    return;
  } else {
    return res.json();
  }
}

/**
 * 提供兼容接口，可以直接替换原 fetcher
 */
export const fetcher = supabaseFetcher;

/**
 * 辅助方法：带类型的 GET 请求
 */
export async function get<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'GET' }) as Promise<T>;
}

/**
 * 辅助方法：带类型的 POST 请求
 */
export async function post<T>(url: string, data?: unknown, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }) as Promise<T>;
}

/**
 * 辅助方法：带类型的 PUT 请求
 */
export async function put<T>(url: string, data?: unknown, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }) as Promise<T>;
}

/**
 * 辅助方法：带类型的 DELETE 请求
 */
export async function del<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'DELETE' }) as Promise<T>;
}
