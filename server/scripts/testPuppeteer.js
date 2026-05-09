import puppeteer from 'puppeteer';

const testScrape = async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        console.log('Going to Codeforces...');
        await page.goto('https://codeforces.com/blog/entry/1', { waitUntil: 'domcontentloaded' });
        const title = await page.title();
        console.log('Title:', title);
        await browser.close();
        console.log('Success!');
    } catch (err) {
        console.error('Scrape failed:', err.message);
    }
};

testScrape();
