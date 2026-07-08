const { execSync } = require('child_process');

const commands = [
  'npm ci',
  'npx prisma generate',
  'npx tsc --noEmit',
  'npm run lint',
  'npx vitest run',
  'npm run build'
];

console.log('Starting exact CI verification...\n');
let totalTime = 0;

for (const cmd of commands) {
  console.log(`> ${cmd}`);
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit', shell: 'cmd.exe' });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    totalTime += parseFloat(duration);
    console.log(`\n✓ Success (${duration}s)\n`);
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n❌ Failed (${duration}s). Exit code: ${err.status}\n`);
    process.exit(1);
  }
}

console.log(`All CI steps passed successfully in ${totalTime.toFixed(2)}s.`);
process.exit(0);
