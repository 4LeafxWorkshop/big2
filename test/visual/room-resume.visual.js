/* global window */
import {expect,test} from '@playwright/test';

test.describe('room resume hydration flow', ()=>{
  async function seedRoomLobby(page){
    await page.goto('/');
    await page.waitForFunction(()=>Boolean(window.__BIG2_VISUAL_TEST__));
    await page.evaluate(()=>{
      window.__BIG2_VISUAL_TEST__.seedRoomResume();
    });
    await expect(page.locator('.room-overlay')).toBeVisible();
  }

  test('restores score before enabling room start after reconnect', async({page},testInfo)=>{
    test.skip(testInfo.project.name.includes('mobile'), 'desktop flow coverage only');
    await seedRoomLobby(page);
    await expect(page.locator('.room-start-subtitle')).toContainText('分數還原中');
    await expect(page.locator('#room-start')).toBeDisabled();
    await expect(page.locator('.auth-status-loading')).toContainText('分數還原中');
    await page.evaluate(()=>{
      window.__BIG2_VISUAL_TEST__.finishRoomResume();
    });
    await expect(page.locator('#room-start')).toBeEnabled();
    await expect(page.locator('.room-start-subtitle')).not.toContainText('分數還原中');
    await expect(page.locator('.auth-status-loading')).toHaveCount(0);
  });

  test('restores score before enabling room start after reconnect on mobile', async({page},testInfo)=>{
    test.skip(!testInfo.project.name.includes('mobile'), 'portrait coverage only');
    await seedRoomLobby(page);
    await expect(page.locator('.room-start-subtitle')).toContainText('分數還原中');
    await expect(page.locator('#room-start')).toBeDisabled();
    await page.evaluate(()=>{
      window.__BIG2_VISUAL_TEST__.finishRoomResume();
    });
    await expect(page.locator('#room-start')).toBeEnabled();
    await expect(page.locator('.auth-status-loading')).toHaveCount(0);
  });

  test('room lobby snapshot stays stable while restoring score', async({page},testInfo)=>{
    await seedRoomLobby(page);
    await expect(page.locator('.room-overlay')).toHaveScreenshot('room-lobby.png', {
      animations:'disabled',
      maxDiffPixelRatio:0.02
    });
  });
});
