module.exports = {
  apps: [
    {
      name: "roon-wrapped-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8080,
        args: "dev",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
        args: "start",
      },
    },
    {
      name: "roon-wrapped-server",
      script: "server/index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "development",
        ROON_SERVER_PORT: 3003,
      },
      env_development: {
        NODE_ENV: "development",
        ROON_SERVER_PORT: 3003,
      },
      env_production: {
        NODE_ENV: "production",
        ROON_SERVER_PORT: 3003,
      },
    },
    {
      name: "history-cleanup",
      script: "./scripts/cleanup-history.sh",
      cwd: __dirname,
      cron_restart: "0 0 * * *", // Run daily at midnight
      autorestart: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
