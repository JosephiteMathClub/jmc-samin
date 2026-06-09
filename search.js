const fs = require('fs');
const path = require('path');

function searchFile(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      if (
        filePath.startsWith('/proc') ||
        filePath.startsWith('/sys') ||
        filePath.startsWith('/dev') ||
        filePath.startsWith('/lib') ||
        filePath.startsWith('/usr') ||
        filePath.startsWith('/var/log') ||
        filePath.includes('node_modules') ||
        filePath.includes('.next') ||
        filePath.includes('.git')
      ) {
        return;
      }
      try {
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(searchFile(filePath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          results.push(filePath);
        }
      } catch (err) {}
    });
  } catch (err) {}
  return results;
}

const foundFiles = searchFile('/');
console.log('Found .ts/.tsx files at:', foundFiles);
