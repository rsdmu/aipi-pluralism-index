
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_AIPI_DATA_URL: process.env.NEXT_PUBLIC_AIPI_DATA_URL || '/data/providers.json',
    NEXT_PUBLIC_AIPI_META_URL: process.env.NEXT_PUBLIC_AIPI_META_URL || '/data/meta.json'
  }
};
module.exports = nextConfig;
