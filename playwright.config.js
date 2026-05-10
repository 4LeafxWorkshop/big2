import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir:'./test/visual',
  testMatch:'**/*.visual.js',
  snapshotDir:'./test/visual/__snapshots__',
  timeout:30000,
  expect:{
    timeout:5000
  },
  use:{
    baseURL:'http://127.0.0.1:5173/big2/',
    screenshot:'only-on-failure',
    trace:'retain-on-failure'
  },
  webServer:{
    command:'npm run dev -- --host 127.0.0.1',
    url:'http://127.0.0.1:5173/big2/',
    reuseExistingServer:true,
    timeout:30000
  },
  projects:[
    {
      name:'chromium-landscape',
      use:{
        ...devices['Desktop Chrome'],
        viewport:{width:1440,height:900}
      }
    },
    {
      name:'chromium-mobile-portrait',
      use:{
        ...devices['iPhone 14'],
        browserName:'chromium',
        viewport:{width:390,height:844}
      }
    }
  ]
});
