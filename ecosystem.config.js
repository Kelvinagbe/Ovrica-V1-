// ecosystem.config.js - Complete PM2 Configuration with Auto-Setup

const fs = require('fs');

const path = require('path');

// Create logs directory if it doesn't exist

const logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logsDir)) {

  fs.mkdirSync(logsDir, { recursive: true });

  console.log('✅ Created logs directory');

}

module.exports = {

  apps: [{

    name: 'whatsapp-bot',

    script: './index.js',

    instances: 1,

    autorestart: true,

    watch: false,

    max_memory_restart: '1G',

    env: {

      NODE_ENV: 'production'

    },

    error_file: './logs/error.log',

    out_file: './logs/output.log',

    log_file: './logs/combined.log',

    time: true,

    merge_logs: true,

    exp_backoff_restart_delay: 100,

    restart_delay: 4000,

    kill_timeout: 5000,

    listen_timeout: 10000,

    min_uptime: '10s',

    max_restarts: 10,

    combine_logs: true,

    node_args: '--max-old-space-size=1024',

    

    // Auto-install dependencies on start

    post_update: ['npm install'],

    

    // Environment variables

    env_production: {

      NODE_ENV: 'production',

      PORT: 3000

    },

    

    env_development: {

      NODE_ENV: 'development',

      PORT: 3000

    }

  }],

  

  // Deployment configuration (optional)

  deploy: {

    production: {

      user: 'node',

      host: 'localhost',

      ref: 'origin/main',

      repo: 'git@github.com:your-repo.git',

      path: '/var/www/whatsapp-bot',

      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'

    }

  }

};