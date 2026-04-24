// Load root monorepo .env first so DUDA_ORIGIN has a default; app-level .env overrides it.
require('../../load-root-env');

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * MULTI-ZONE KEY SETTING.
   *
   * Every route this app serves is prefixed with /shop, so:
   *   app/page.tsx          →  /shop
   *   app/[id]/page.tsx     →  /shop/[id]
   *
   * The shell's rewrite forwards localhost:3000/shop/* here, and because
   * basePath matches the source prefix, paths align perfectly.
   *
   * All internal Next.js <Link> hrefs are basePath-relative (e.g. href="/"
   * resolves to /shop in the browser).
   */
  basePath: '/shop',

  reactStrictMode: true,

  transpilePackages: ['@repo/ui'],

  /**
   * Allow the shell (port 3000) to proxy assets from this zone.
   * In a production deployment, replace with the actual shell origin.
   */
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
