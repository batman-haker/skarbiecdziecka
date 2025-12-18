/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // Experimental features
  experimental: {
    // Enable server actions (useful for form handling)
    serverActions: true,
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'Skarbiec Dziecka',
  },
};

module.exports = nextConfig;
