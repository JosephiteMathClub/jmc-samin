const sharp = require('sharp');

sharp('public/images/ec_id_card_bg.jpeg')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log("Scanning rows y=750 to 980 for golden/amber lines...");
    
    for (let y = 750; y < 980; y++) {
      let rCount = 0;
      let gCount = 0;
      let bCount = 0;
      let count = 0;
      
      // Let's count how many pixels look like amber/gold (e.g. R > 150, G > 100, B < 80)
      // or light purple (R > 100, G > 100, B > 180)
      let amberCount = 0;
      let purpleCount = 0;
      
      for (let x = 40; x < info.width - 40; x++) {
        let idx = (info.width * y + x) * info.channels;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];
        
        let isAmber = (r > 150 && g > 100 && b < 100);
        let isPurple = (r > 80 && g > 80 && b > 150);
        
        if (isAmber) amberCount++;
        if (isPurple) purpleCount++;
      }
      
      if (amberCount > 40) {
        console.log(`y=${y}: Amber/Gold pixels count = ${amberCount}`);
      }
      if (purpleCount > 40) {
        console.log(`y=${y}: Purple pixels count = ${purpleCount}`);
      }
    }
  });
