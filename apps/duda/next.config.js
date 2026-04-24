// Load root monorepo .env first so DUDA_ORIGIN has a default; app-level .env overrides it.
require('../../load-root-env');

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/duda',
  reactStrictMode: true,
  transpilePackages: ['@repo/ui'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://localhost:3000',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
