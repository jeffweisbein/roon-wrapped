/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ROON_SERVER_PORT: '3003',
    ROON_SERVER_HOST: 'localhost',
  },
  async rewrites() {
    return []
  }
}

module.exports = nextConfig 