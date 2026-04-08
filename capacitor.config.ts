import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'crm.impulsecrm.uz',
  appName: 'IMPULSE CRM',
  webDir: '.output/public',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
