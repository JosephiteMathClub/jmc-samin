const sharp = require('sharp');

sharp('public/images/id-card-bg.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log("Analyzing horizontal coordinates of the lines at y = 850, 905, 965...");
    
    const rows = [850, 905, 965];
    rows.forEach(y => {
      console.log(`\nRow y = ${y}:`);
      let segment = [];
      for (let x = 0; x < info.width; x++) {
        let idx = (info.width * y + x) * info.channels;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];
        let sum = r + g + b;
        
        if (sum > 60) { // not extremely dark
          segment.push(x);
        }
      }
      
      // Group contiguous segments
      let ranges = [];
      if (segment.length > 0) {
        let start = segment[0];
        let last = segment[0];
        for (let i = 1; i < segment.length; i++) {
          if (segment[i] === last + 1) {
            last = segment[i];
          } else {
            ranges.push({start, end: last, width: last - start + 1});
            start = segment[i];
            last = segment[i];
          }
        }
        ranges.push({start, end: last, width: last - start + 1});
      }
      console.log("Bright segments:", ranges.filter(r => r.width > 10));
    });
  });
