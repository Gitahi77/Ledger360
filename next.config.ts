// next.config.ts
// @sentry/nextjs wraps the entire config. The import MUST be at the top so
// the module is resolved before the config object is evaluated by the build
// toolchain — placing it at the bottom is an ES module anti-pattern.
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// 'unsafe-eval' is required by Next.js during development (eval-source-maps)
// but meaningfully widens the XSS surface in production. Restrict it to dev.
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // ── Server packages that need Node.js fs/native modules ─────────────────
  // serverExternalPackages prevents Edge/Webpack from bundling Node.js-only packages.
  serverExternalPackages: ["pdf-parse", "bcryptjs"],

  // ── HTTP Security Headers ────────────────────────────────────────────────
  // Applied to every response. Covers OWASP Top-10 browser-side risks.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent embedding in iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },

          // Block MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Force HTTPS for 1 year
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },

          // Disable browser features not used by the app
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },

          // No referrer for cross-origin requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Content Security Policy
          // 'unsafe-eval' is only present in development (Next.js hot reload).
          // Production builds do not use eval, so the directive is dropped.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              // https://*.sentry.io is required for Sentry error reporting to reach the ingest endpoint.
              "connect-src 'self' https://api.frankfurter.app https://*.sentry.io",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },

          // Cross-origin isolation
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "ledger360",
  project: process.env.SENTRY_PROJECT || "ledger360",
  // Only print Sentry upload progress in CI; suppress locally to reduce noise.
  silent: !process.env.CI,
  // Disable Sentry build telemetry.
  telemetry: false,
});
