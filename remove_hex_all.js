const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Find and replace all #HEX with rgb
  content = content.replace(/#([0-9A-Fa-f]{6})/g, (match) => {
    return hexToRgb(match);
  });
  content = content.replace(/#([0-9A-Fa-f]{3})(?![0-9A-Fa-f])/g, (match, hex3) => {
    let hex6 = "#" + hex3[0] + hex3[0] + hex3[1] + hex3[1] + hex3[2] + hex3[2];
    return hexToRgb(hex6);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('./src/components', processFile);
walkDir('./src/app', processFile);
