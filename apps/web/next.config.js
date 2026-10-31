/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@invoice/core', '@invoice/theme', '@invoice/api', '@invoice/ui'],
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
