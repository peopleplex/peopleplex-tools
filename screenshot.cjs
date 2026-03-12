const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1536, height: 872 });
    await page.goto('http://localhost:5175/psychology');

    // Wait for the specific H1 to load
    await page.waitForSelector('h1', { timeout: 5000 });

    await page.screenshot({ path: 'psychology_test.png' });
    await browser.close();
})();
