import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.josephitemathclub.app',
  appName: 'Josephite Math Club',
  webDir: 'www', // We use 'www' as a placeholder since we load the Live URL
  server: {
    url: 'https://jmc-sjs.org',
    cleartext: true
  }
};

export default config;
