/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    // Enable optimization in production, disable in dev for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['lh3.googleusercontent.com'], // Google OAuth avatars
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.googleapis.com https://*.google.com https://api.stripe.com https://*.stripe.com",
              "frame-src 'self' https://js.stripe.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Redirects for duplicate routes
  async redirects() {
    return [
      {
        source: '/ats',
        destination: '/ats-scanner',
        permanent: true,
      },
      {
        source: '/interview/technical',
        destination: '/technical-interview',
        permanent: true,
      },
      {
        source: '/interview/behavioral',
        destination: '/behavioral-interview',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
