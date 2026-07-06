const { execSync } = require('child_process');
const http = require('http');

// Start server
const server = execSync('start /B cmd /c "D:\\???\\??\\????\\lucky-shop\\node_modules\\.bin\\tsx.cmd src/index.ts > server_keep.log 2>&1"', {
  cwd: 'D:\\???\\??\\????\\lucky-shop\\server',
  shell: 'cmd.exe',
  stdio: 'ignore'
});

console.log('Waiting for server...');
