/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Compile the shared UI package from source (no separate build step needed).
  transpilePackages: ['@repo/ui'],

  /**
   * MULTI-ZONE ROUTING — the core MFE "string".
   *
   * The shell acts as a reverse-proxy for any /shop path, forwarding the
   * request to the independent shop Next.js app running on port 3001.
   *
   * Because the shop app is configured with basePath: '/shop', every URL it
   * serves already starts with /shop, so the rewrite destinations mirror the
   * source path exactly.
   *
   * Important: cross-zone links in the UI use plain <a> tags (not Next.js
   * <Link>) so the browser performs a full navigation and loads the correct
   * zone's JS bundle.
   */
  async rewrites() {
    return [
      {
        // Product listing  →  http://localhost:3001/shop
        source: '/shop',
        destination: 'http://localhost:3001/shop',
      },
      {
        // PDP + any nested shop routes  →  http://localhost:3001/shop/:path*
        source: '/shop/:path*',
        destination: 'http://localhost:3001/shop/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
