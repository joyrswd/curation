/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '**',
      },
    ],
  },
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === "production"
      ? { properties: ['^data-testid$'] }
      : false,
  },
};

export default nextConfig;
