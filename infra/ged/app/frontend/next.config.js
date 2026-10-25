/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/unificado/ged',
  assetPrefix: '/unificado/ged',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/unificado/ged',
  },
};

module.exports = nextConfig;
