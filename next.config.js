/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@supabase/supabase-js'],
  webpack: (config, { isServer }) => {
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Only use static export for Netlify
  ...(process.env.DEPLOY_PLATFORM === 'netlify' ? {
    output: 'export',
    images: {
      unoptimized: true,
    },
  } : {}),
  // Enable server actions for both platforms
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 