const sharp = require('sharp');

sharp('public/images/id-card-bg.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log("Analyzing text / line colors in the lower half (y > 630)...");
    
    // Let's filter for pixels that are not very dark (sum of RGB > 100)
    // but also not pure black or dark blue, to see where colored labels/underlines are.
    let coloredPixels = [];
    for (let y = 630; y < info.height; y++) {
      for (let x = 30; x < info.width - 30; x++) {
        let idx = (info.width * y + x) * info.channels;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];
        
        let sum = r + g + b;
        if (sum > 150) { // bright pixels
          coloredPixels.push({x, y, r, g, b});
        }
      }
    }
    
    console.log(`Bright colored pixels counted: ${coloredPixels.length}`);
    
    // Group them by Y coordinate to find specific lines/fields
    let yBins = {};
    coloredPixels.forEach(p => {
      yBins[p.y] = (yBins[p.y] || 0) + 1;
    });
    
    console.log("\nRow distribution of colored/bright pixels:");
    let activeY = Object.keys(yBins).map(Number).sort((a,b)=>a-b);
    let ranges = [];
    if (activeY.length > 0) {
      let start = activeY[0];
      let last = activeY[0];
      for (let i = 1; i < activeY.length; i++) {
        if (activeY[i] === last + 1) {
          last = activeY[i];
        } else {
          ranges.push({start, end: last, avgPixels: Math.round(activeY.slice(activeY.indexOf(start), activeY.indexOf(last)+1).reduce((acc,y)=>acc+yBins[y], 0) / (last - start + 1))});
          start = activeY[i];
          last = activeY[i];
        }
      }
      ranges.push({start, end: last, avgPixels: Math.round(activeY.slice(activeY.indexOf(start)).reduce((acc,y)=>acc+yBins[y], 0) / (last - start + 1))});
    }
    
    ranges.forEach(r => {
      // Print only ranges that are interesting (e.g. height >= 5 or many pixels)
      if (r.end - r.start > 2 && r.avgPixels > 30) {
        console.log(`y-range: ${r.start} to ${r.end} (height: ${r.end - r.start + 1}), avg pixels per row: ${r.avgPixels}`);
        
        // Let's sample a few pixels in this range to see their colors
        let sampleY = Math.round((r.start + r.end) / 2);
        let samplePixels = coloredPixels.filter(p => p.y === sampleY);
        let sampleColors = samplePixels.slice(0, 3).map(p => `[x=${p.x}, RGB=(${p.r},${p.g},${p.b})]`);
        console.log(`  Sample Pixels on y=${sampleY}: ${sampleColors.join(', ')}`);
      }
    });
  });
