module.exports = {
  apps: [{
    name: 'db14-bot-platform',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Restart settings
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Resource limits
    max_memory_restart: '500M',
    
    // Auto restart on file changes (development only)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'running-bots'],
    
    // Environment variables file
    env_file: '.env'
  }]
};