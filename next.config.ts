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
    // If the app is in 'api' mode, disable all UI pages by redirecting to a non-existent page.
    if (process.env.KEYSTONE_MODE === 'api') {
      const uiPaths = [
        '/',
        '/keys',
        '/services',
        '/playground',
        '/documentation',
        '/settings',
      ];
      
      return uiPaths.map(path => ({
        source: path,
        destination: '/404', // Redirecting to a non-existent page effectively disables them.
        permanent: false, // Use false to avoid permanent browser caching of the redirect.
      }));
    }
    // In 'admin' mode (or default), no redirects are needed.
    return [];
  },
};

export default nextConfig;
