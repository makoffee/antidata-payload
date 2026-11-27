import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

// The live site is read-only: pages are built from the database at deploy time, and content is
// edited only in the local admin (npm run dev). On the production deploy the admin, the REST API
// and the draft-preview routes are closed. Set ALLOW_LIVE_ADMIN=1 in Vercel to reopen them
// temporarily. /api/media/file stays open while images are still served from Blob through it.
const LIVE_READ_ONLY =
  process.env.VERCEL_ENV === 'production' && process.env.ALLOW_LIVE_ADMIN !== '1'
const BLOCKED = '/not-found-blocked'

const nextConfig: NextConfig = {
  images: {
    qualities: [100],
    // Optimized variants are kept for a year (the default is a few hours), so each width is read
    // from Blob once, not again every few hours. Media URLs carry ?<updatedAt>, so replacing a
    // file still shows the new one. Fewer widths means fewer variants to generate and cache.
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 1080, 1920, 3840],
    // Payload media is served relative (/api/media/file/x.jpg?<updatedAt>, see getMediaUrl); the
    // query is a cache-buster, so allow any query there. Other local images: no query.
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/**', search: '' }],
    // Next 16 blocks optimizing images from localhost/private IPs; allow it for local dev only
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  // Security headers on every response
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Browsers use HTTPS only for this site for a year
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          // Other sites cannot put the site or the admin in a frame (clickjacking); the admin's
          // own live preview is same-origin, so it still works
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Files are used as the type the server says they are
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  reactStrictMode: true,
  redirects: async () => [
    ...((await redirects?.()) ?? []),
    ...(LIVE_READ_ONLY
      ? [{ source: '/admin/:path*', destination: '/', permanent: false }]
      : []),
  ],
  rewrites: async () => ({
    beforeFiles: LIVE_READ_ONLY
      ? [
          { source: '/api/:path((?!media/file/).*)', destination: BLOCKED },
          { source: '/next/preview', destination: BLOCKED },
          { source: '/next/exit-preview', destination: BLOCKED },
        ]
      : [],
    afterFiles: [],
    fallback: [],
  }),
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
