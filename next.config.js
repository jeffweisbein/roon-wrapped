/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ROON_SERVER_PORT: '3003',
    ROON_SERVER_HOST: 'localhost',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3003/api/:path*',
        // Exclude the top-40 endpoint from being proxied
        has: [
          {
            type: 'query',
            key: 'path',
            value: '(?!history/top-40).*'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 