/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@invoice/core', '@invoice/theme', '@invoice/api', '@invoice/ui'],
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
