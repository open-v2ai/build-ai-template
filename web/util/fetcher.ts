import { getValidAccessToken, getApiUrl } from "./token";

const API_URL_V1 = `${getApiUrl()}/api/v1`;

type FetchOptions = RequestInit & {
    auth?: boolean;
    stream?: boolean;
};

export async function fetcher<T>(
    url: string,
    options: FetchOptions = {},
    onData?: (chunk: string) => void
): Promise<T | void> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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
        const token = await getValidAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL_V1}${url}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Request failed');
    }

    if (options.stream) {
        if (!res.body) throw new Error('Request failed');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                onData && onData(chunk);
            }
        }
        return;
    } else {
        return res.json();
    }
}