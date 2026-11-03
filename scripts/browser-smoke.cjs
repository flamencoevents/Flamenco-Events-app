const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = 'https://flamencoevents.github.io/Flamenco-Events-app/';
const paths = [
  ['servicios.html','Flamenco Events'],
  ['portal.html','Flamenco Events'],
  ['admin.html','Flamenco Events'],
  ['staff.html','Flamenco Events'],
];
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for(const [path,expected] of paths) {
      const page=await browser.newPage({viewport:{width:390,height:844}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:25000});
      assert.equal(response?.status(),200,path+' did not load');
      await page.waitForTimeout(1700);
      const text=await page.locator('body').innerText();
      assert(text.includes(expected),path+' missing expected brand');
      const width=await page.evaluate(()=>({
        full:document.documentElement.scrollWidth,
        visible:document.documentElement.clientWidth,
      }));
      assert(width.full<=width.visible+4,
        path+' has horizontal overflow: '+JSON.stringify(width));
      assert.equal(errors.length,0,path+' Javascript errors: '+errors.join('; '));
      if(path==='admin.html'){
        assert.equal(await page.locator('#workspace').isVisible(),false,
          'Admin workspace visible without authentication');
      }
      if(path==='staff.html'){
        assert.equal(await page.locator('#workspace').isVisible(),false,
          'Staff workspace visible without authentication');
      }
      console.log(path,'mobile smoke passed');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exit(1)});
