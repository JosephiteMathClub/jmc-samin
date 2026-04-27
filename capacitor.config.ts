import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.josephitemathclub.app',
  appName: 'Josephite Math Club',
  webDir: 'out', // Next.js static export directory
  server: {
    // For local development on your machine, you can point to your dev server tag
    // url: 'http://192.168.x.x:3000', 
    // cleartext: true,
    
    // For the final APK, it's best to use the production URL if you aren't doing a static export
    url: 'https://ais-pre-atrdtng4dlxlbcnpe6o546-118654560279.asia-southeast1.run.app',
  }
};

export default config;
