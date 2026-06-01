import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Server packages that need Node.js fs/native modules ──────────────────
  // Without this, Next.js bundles them for Edge/Webpack and they fail at runtime.
  experimental: {
    serverExternalPackages: ['pdf-parse', 'xlsx', 'bcryptjs'],
  },

  // ── HTTP Security Headers ─────────────────────────────────────────────────
  // Applied to every response. Covers OWASP Top-10 browser-side risks.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent embedding in iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },

          // Block MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Force HTTPS for 1 year (production only — harmless in dev)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

          // Disable browser features not used by the app
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },

          // No referrer for cross-origin requests (protects user privacy)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Content Security Policy
          // Allows: self, Vercel analytics, Google Fonts, Recharts inline SVG
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline Next.js bootstrap (nonce-less approach)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + Google Fonts + inline (for CSS-in-JS / inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + data URIs (for recharts SVG blobs)
              "img-src 'self' data: blob:",
              // API connections
              "connect-src 'self' https://api.frankfurter.app",
              // No plugins, no object embeds
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },

          // Cross-origin isolation (useful for SharedArrayBuffer / performance.now precision)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
