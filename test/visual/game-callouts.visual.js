/* global document, HTMLElement, window */
import {expect,test} from '@playwright/test';

async function showCallout(page,seat){
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.__BIG2_VISUAL_TEST__));
  await page.evaluate((seatIndex)=>{
    window.__BIG2_VISUAL_TEST__.showCallout({
      seat:seatIndex,
      text:seatIndex===0?'Your turn!':'Pass!'
    });
  },seat);
  await page.locator('.game-foreground-layer [data-callout-ready="1"]').waitFor();
  await page.waitForTimeout(250);
}

async function calloutMetrics(page){
  return page.evaluate(()=>window.__BIG2_VISUAL_TEST__.metrics());
}

async function countPillIsTopmost(page){
  return page.evaluate(()=>{
    const pill=document.querySelector('.seat-callout-active .closed-count-pill');
    if(!(pill instanceof HTMLElement))return false;
    const rect=pill.getBoundingClientRect();
    const x=rect.left+(rect.width/2);
    const y=rect.top+(rect.height/2);
    const top=document.elementFromPoint(x,y);
    return top===pill||Boolean(top?.closest?.('.closed-count-pill'));
  });
}

test.describe('foreground callout layout', ()=>{
  test('east callout tail points to the right-side avatar', async({page},testInfo)=>{
    test.skip(testInfo.project.name.includes('mobile'), 'covered by the desktop landscape station layout');
    await showCallout(page,1);
    const metrics=await calloutMetrics(page);
    expect(metrics.seatClass).toBe('east');
    expect(metrics.tailClass).toContain('tail-east');
    expect(metrics.bubble.right).toBeLessThan(metrics.eastAvatar.left);
    await expect(page).toHaveScreenshot('east-callout-landscape.png', {
      animations:'disabled',
      maxDiffPixelRatio:0.02
    });
  });

  test('north callout tail points down to the north avatar', async({page},testInfo)=>{
    test.skip(testInfo.project.name.includes('mobile'), 'covered by the desktop landscape station layout');
    await showCallout(page,2);
    const metrics=await calloutMetrics(page);
    expect(metrics.seatClass).toBe('north');
    expect(metrics.tailClass).toContain('tail-south');
    expect(metrics.bubble.bottom).toBeLessThan(metrics.northAvatar.top);
  });

  test('closed card count stays topmost during callouts', async({page},testInfo)=>{
    test.skip(testInfo.project.name.includes('mobile'), 'covered by the desktop landscape station layout');
    await showCallout(page,2);
    await expect.poll(()=>countPillIsTopmost(page)).toBe(true);
  });

  test('portrait south callout stays above the self avatar', async({page},testInfo)=>{
    test.skip(!testInfo.project.name.includes('mobile'), 'portrait coverage only');
    await showCallout(page,0);
    const metrics=await calloutMetrics(page);
    expect(metrics.seatClass).toBe('south');
    expect(metrics.tailClass).toContain('tail-south');
    expect(metrics.bubble.bottom).toBeLessThan(metrics.selfAvatar.top);
    await expect(page).toHaveScreenshot('south-callout-portrait.png', {
      animations:'disabled',
      maxDiffPixelRatio:0.02
    });
  });

  test('portrait side callout stays above the side avatar', async({page},testInfo)=>{
    test.skip(!testInfo.project.name.includes('mobile'), 'portrait coverage only');
    await showCallout(page,1);
    const metrics=await calloutMetrics(page);
    expect(metrics.seatClass).toBe('east');
    expect(metrics.tailClass).toContain('tail-south');
    expect(metrics.bubble.bottom).toBeLessThan(metrics.eastAvatar.top);
    await expect(page).toHaveScreenshot('east-callout-portrait.png', {
      animations:'disabled',
      maxDiffPixelRatio:0.02
    });
  });
});
