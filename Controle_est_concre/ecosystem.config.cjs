module.exports = {
  apps: [
    {
      name: 'controle-est-concre-api',
      script: 'src/server.js',
      cwd: '/root/Controle_est_concre',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3086,
      },
    },
  ],
};
