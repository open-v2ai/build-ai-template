import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone'
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
