import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const rawTarget =
      process.env.ASCENSION_BACKEND_URL ||
      process.env.VITE_API_BASE_URL ||
      'https://ascension-backend.onrender.com';
    const targetHost = rawTarget
      .replace(/\/api\/?$/, '')
      .replace(/\/+$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${targetHost}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

