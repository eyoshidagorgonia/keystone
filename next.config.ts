import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    // If the app is in 'api' mode, disable all UI pages.
    if (process.env.KEYSTONE_MODE === 'api') {
      return [
        { source: '/', destination: '/404', permanent: true },
        { source: '/keys', destination: '/404', permanent: true },
        { source: '/services', destination: '/404', permanent: true },
        { source: '/playground', destination: '/404', permanent: true },
        { source: '/documentation', destination: '/404', permanent: true },
        { source: '/settings', destination: '/404', permanent: true },
      ];
    }
    // In 'admin' mode (or default), no redirects are needed.
    return [];
  },
};

export default nextConfig;
