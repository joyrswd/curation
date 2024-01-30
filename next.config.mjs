/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/',
            destination: '/find',
          },
        ]
      },    
};

export default nextConfig;
