const sharp = require('sharp');

sharp('public/images/id-card-bg.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Let's analyze row colors between y=630 and 1000.
    // Specifically, we want to see where row details contain dark lines or typical colored lines.
    // Let's print out the average horizontal brightness of the middle section (e.g. x between 100 and 500)
    // to search for horizontal lines where people write text.
    
    console.log("Analyzing row brightness under the QR code...");
    for (let y = 630; y < info.height; y++) {
      let segmentSum = 0;
      let count = 0;
      for (let x = 100; x < info.width - 100; x++) {
        let idx = (info.width * y + x) * info.channels;
        // Grayscale conversion
        let val = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
        segmentSum += val;
        count++;
      }
      let avg = segmentSum / count;
      // If average brightness is significantly lower than background or has high variation, print it
      if (y % 10 === 0) {
        console.log(`y=${y}: Avg Brightness = ${avg.toFixed(2)}`);
      }
    }
  });
