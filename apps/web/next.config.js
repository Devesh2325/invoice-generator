/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@invoice/core', '@invoice/theme', '@invoice/api', '@invoice/ui'],
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
