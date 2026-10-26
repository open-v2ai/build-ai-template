import { getValidAccessToken, getApiUrl } from "@/util/token";
import { getValidAccessToken as getSupabaseToken } from "@/util/supabase-auth";

// 是否使用 Supabase 认证
const USE_SUPABASE_AUTH = true;

const API_URL_V1 = `${getApiUrl()}/api/v1`;

/**
 * 获取当前用户的语言设置
 * 
 * 功能说明:
 * - 从 URL 路径中提取当前语言设置
 * - 支持 Next.js 国际化路由格式 /[locale]/...
 * - 默认返回中文 (zh)
 * 
 * 返回:
 * - string: 语言代码 (zh 或 en)
 */
function getAcceptLanguage(): string {
    if (typeof window === 'undefined') {
        // 服务端渲染时返回默认语言
        return 'zh';
    }
    
    // 从当前 URL 路径中提取语言
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // 检查第一个路径段是否是语言代码
    if (segments.length > 0) {
        const firstSegment = segments[0];
        if (firstSegment === 'en' || firstSegment === 'zh') {
            return firstSegment;
        }
    }
    
    // 默认返回中文
    return 'zh';
}

type FetchOptions = RequestInit & {
    auth?: boolean;
    stream?: boolean;
};

/**
 * 获取原生 fetch 函数
 * 
 * 功能说明:
 * - 确保使用浏览器原生的 fetch API，避免 polyfill 干扰
 * - 在 Next.js 等框架中，可能会被 polyfill 替换，导致流式响应失效
 * - 优先使用 window.fetch，如果不存在则使用全局 fetch
 */
function getNativeFetch(): typeof fetch {
    // 在浏览器环境中，优先使用 window.fetch（原生实现）
    if (typeof window !== 'undefined' && window.fetch) {
        return window.fetch.bind(window);
    }
    
    // 如果没有 window.fetch，使用全局 fetch
    if (typeof globalThis !== 'undefined' && globalThis.fetch) {
        return globalThis.fetch.bind(globalThis);
    }
    
    // 最后回退到标准 fetch
    return fetch;
}

/**
 * 检查流式响应支持
 * 
 * 功能说明:
 * - 检查当前环境是否支持 ReadableStream 和 Response.body.getReader()
 * - 如果不支持，会在控制台输出警告信息
 */
function checkStreamSupport(): boolean {
    if (typeof window === 'undefined') {
        // 服务端渲染环境，跳过检查
        return false;
    }
    
    const hasReadableStream = typeof ReadableStream !== 'undefined';
    const hasResponseBody = typeof Response !== 'undefined' && 
                           Response.prototype.hasOwnProperty('body');
    
    if (!hasReadableStream || !hasResponseBody) {
        console.warn('流式响应不支持：当前环境缺少 ReadableStream 或 Response.body 支持');
        return false;
    }
    
    return true;
}

export async function fetcher<T>(
    url: string,
    options: FetchOptions = {},
    onData?: (chunk: string) => void
): Promise<T | void> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': getAcceptLanguage(),  // 自动添加语言头
    };

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

    // Automatically add Authorization header
    if (options.auth) {
        // 根据配置选择使用 Supabase 或自定义认证
        const token = USE_SUPABASE_AUTH
            ? await getSupabaseToken()
            : await getValidAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    // 使用原生 fetch
    const nativeFetch = getNativeFetch();
    
    // 流式请求的特殊头部设置
    if (options.stream) {
        // 确保不会被压缩或缓存
        headers['Accept'] = 'text/plain';
        headers['Cache-Control'] = 'no-cache';
        headers['Connection'] = 'keep-alive';
        
        // 检查流式响应支持
        if (!checkStreamSupport()) {
            throw new Error('当前环境不支持流式响应');
        }
    }


    const fullUrl = `${API_URL_V1}${url}`;
    
    const res = await nativeFetch(fullUrl, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMessage = 'Request failed';
        let errorDetails = null;
        
        try {
            const error = await res.json();
            errorMessage = error.detail || error.message || `HTTP ${res.status}: ${res.statusText}`;
            errorDetails = error;
        } catch (error) {
            console.error('Failed to parse error response:', error)
            // If JSON cannot be parsed, use HTTP status information
            errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        // 创建包含更多信息的错误对象（使用类型断言避免 TS 报错）
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
        
        // 检查响应体是否支持 getReader
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
            // 确保释放 reader
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
