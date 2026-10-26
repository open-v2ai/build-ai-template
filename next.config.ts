import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 设置输出文件追踪根目录为当前项目目录，避免与其他 Next.js 项目冲突
  outputFileTracingRoot: __dirname,
  
  // 流式响应优化配置
  serverExternalPackages: [],
  
  // Webpack 配置 - 确保不会 polyfill fetch
  webpack: (config, { isServer }) => {
    // 在客户端构建中，确保使用原生 fetch
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // 不要 polyfill 这些 API，使用浏览器原生实现
        fs: false,
        net: false,
        tls: false,
      };
      
      // 确保不会替换原生 fetch
      config.resolve.alias = {
        ...config.resolve.alias,
        // 如果有 fetch polyfill，跳过它
      };
    }
    
    return config;
  },
  
  // 头部配置 - 支持流式响应
  async headers() {
    return [
      {
        // 匹配所有 API 路由
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
