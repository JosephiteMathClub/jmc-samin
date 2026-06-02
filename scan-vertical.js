const sharp = require('sharp');

sharp('public/images/id-card-bg.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log("Scanning vertical columns...");
    
    // Scan at a few x columns
    const cols = [100, 200, 300, 400, 500];
    
    cols.forEach(x => {
      console.log(`\n--- COLUMN x = ${x} ---`);
      let inLight = false;
      let lightStart = 0;
      
      for (let y = 630; y < info.height; y++) {
        let idx = (info.width * y + x) * info.channels;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];
        
        let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // We look for pixels that are significantly brighter than the local dark background (e.g. brightness > 80)
        if (brightness > 120) {
          if (!inLight) {
            inLight = true;
            lightStart = y;
          }
        } else {
          if (inLight) {
            inLight = false;
            console.log(`y: ${lightStart} to ${y - 1} | Avg RGB = (${r}, ${g}, ${b}) | Brightness = ${brightness.toFixed(1)}`);
          }
        }
      }
      if (inLight) {
        console.log(`y: ${lightStart} to ${info.height - 1} | Brightness > 120`);
      }
    });
  });
