// ecosystem.config.js
// PM2 Configuration for DealDoor

module.exports = {
  apps: [
    {
      name: 'dealdoor',
      script: 'dist/server/entry.mjs',
      interpreter: 'bun',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 4321,
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 4321,
      },
      // Logging
      log_file: 'logs/combined.log',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};
