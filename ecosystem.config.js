module.exports = {
  apps: [{
    name: 'nexuscode',
    script: 'server.prod.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      ENABLE_AUTH: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080,
      ENABLE_AUTH: 'true',
      JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    watch: false,
    max_restarts: 10,
    restart_delay: 4000
  }]
};
