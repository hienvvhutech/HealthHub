import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthhub.app',
  appName: 'HealthHub',
  webDir: 'build',
  server: {
    androidScheme: 'http', 
    cleartext: true
  }
};

export default config;