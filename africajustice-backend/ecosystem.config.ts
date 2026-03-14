import { Ecosystem } from 'pm2'

const config: Ecosystem = {
  apps: [
    {
      name: 'africajustice-backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}

export default config
