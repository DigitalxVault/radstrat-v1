// ecosystem.config.cjs
// MUST use .cjs extension because the project uses "type": "module" in package.json
// PM2 does NOT load .env files. Use dotenv or define env vars directly.

const path = require('path')

// Load environment from .env.production on the server
try {
  require('dotenv').config({ path: path.join(__dirname, '.env.production') })
} catch {
  // dotenv not available in production -- env vars set directly
}

module.exports = {
  apps: [
    {
      name: 'radstrat-api',
      script: 'dist/server.js',
      cwd: './apps/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      // Log configuration
      error_file: '/var/log/pm2/radstrat-api-error.log',
      out_file: '/var/log/pm2/radstrat-api-out.log',
      time: true,
      max_memory_restart: '500M',
      // Restart behavior
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
    },
    // Worker process placeholder (Phase 3)
    // {
    //   name: 'radstrat-worker',
    //   script: 'dist/worker.js',
    //   cwd: './apps/api',
    //   instances: 1,     // MUST be 1 to prevent duplicate push sends
    //   exec_mode: 'fork',
    //   env: { NODE_ENV: 'production' },
    // },
  ],
}
