module.exports = {
  apps: [
    {
      name: 'lecabanon-api',
      script: 'dist/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      autorestart: true,
      max_memory_restart: '500M',
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true
    }
  ]
}
