const fs = require('fs');
const path = require('path');

try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '1.0.0';

  const versionFilePath = path.join(__dirname, 'public', 'version.json');
  const manifest = {
    version: version,
    buildTime: Date.now()
  };

  fs.writeFileSync(versionFilePath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Successfully generated deployment version manifest:', manifest);
} catch (error) {
  console.error('Failed to generate version manifest:', error);
}
