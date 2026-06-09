const sharp = require('sharp');

sharp('public/images/ec_id_card_bg.jpeg')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log("Searching for horizontal line segments...");
    
    // Search in the lower half (y between 630 and 1000)
    for (let y = 630; y < info.height; y++) {
      let runLength = 0;
      let startX = 0;
      let lastR = 0, lastG = 0, lastB = 0;
      
      for (let x = 0; x < info.width; x++) {
        let idx = (info.width * y + x) * info.channels;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];
        
        // A line pixel is flat, and stands out (not too dark, e.g. sum > 100)
        // Let's check color similarity with neighbors to see if it's a solid line
        let isSimilar = Math.abs(r - lastR) < 10 && Math.abs(g - lastG) < 10 && Math.abs(b - lastB) < 10;
        let isBright = (r > 60 || g > 60 || b > 60);
        
        if (isSimilar && isBright) {
          runLength++;
        } else {
          if (runLength > 80) {
            console.log(`y=${y}: Line found from x=${startX} to x=${x-1} (length=${runLength}) | color: rgb(${lastR}, ${lastG}, ${lastB})`);
          }
          runLength = 1;
          startX = x;
          lastR = r;
          lastG = g;
          lastB = b;
        }
      }
      if (runLength > 80) {
        console.log(`y=${y}: Line found from x=${startX} to x=${info.width-1} (length=${runLength}) | color: rgb(${lastR}, ${lastG}, ${lastB})`);
      }
    }
  });
