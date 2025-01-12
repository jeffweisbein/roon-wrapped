module.exports = {
  apps: [
    {
      name: 'roon-wrapped-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'roon-wrapped-server',
      script: 'server/index.js',
      env: {
        NODE_ENV: 'development',
        ROON_SERVER_PORT: 3003,
      },
      env_development: {
        NODE_ENV: 'development',
        ROON_SERVER_PORT: 3003,
      },
      env_production: {
        NODE_ENV: 'production',
        ROON_SERVER_PORT: 3003,
      },
    },
    {
      name: 'history-cleanup',
      script: './scripts/cleanup-history.sh',
      cron_restart: '0 0 * * *', // Run daily at midnight
      autorestart: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}; 