const { execSync } = require('child_process');
require('dotenv').config({ path: '.env' });
try {
  execSync('npx vitest run src/tests/concurrency-stress.test.ts', { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
