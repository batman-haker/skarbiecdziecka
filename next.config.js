/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization settings
  images: {
    domains: [
      'supabase.co',
      // Add your Supabase storage domain here when configured
      // Example: 'your-project.supabase.co'
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration for handling certain packages
  webpack: (config, { isServer }) => {
    // Fix for some Web3 packages that don't work well with webpack
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'Skarbiec Dziecka',
  },
};

module.exports = nextConfig;
