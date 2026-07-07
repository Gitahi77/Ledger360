const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../src/components/financial');
const destDir = path.join(__dirname, '../src/components/finance/display'); // User said finance/display

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const items = fs.readdirSync(sourceDir);
  for (const item of items) {
    const srcPath = path.join(sourceDir, item);
    const dstPath = path.join(destDir, item);
    fs.renameSync(srcPath, dstPath);
    console.log(`Moved ${item} to ${destDir}`);
  }
  
  // Try to remove the old directory
  fs.rmdirSync(sourceDir);
  console.log('Successfully removed old financial directory');
} catch (err) {
  console.error('Error moving:', err);
}
