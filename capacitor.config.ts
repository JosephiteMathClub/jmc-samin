import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.josephitemathclub.app',
  appName: 'Josephite Math Club',
  webDir: 'www', // We use 'www' as a placeholder since we load the Live URL
  server: {
    url: 'https://jmc-sjs.org',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#050505",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#E933B4",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
