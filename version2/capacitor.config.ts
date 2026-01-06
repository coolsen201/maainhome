import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.golocal.intercom',
  appName: 'MaainHome',
  webDir: 'dist/public',
  server: {
    url: 'https://maainhome.vercel.app',
    cleartext: true
  }
};

export default config;
