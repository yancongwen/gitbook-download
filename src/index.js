const fs = require('fs-extra');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
});

const downloadPage = async (puppeteerPage, url, index) => {
    await puppeteerPage.goto(url, { timeout: 60 * 1000 });

    await puppeteerPage.waitForSelector('h1[data-testid="page.title"]');

    let pageContent = '';
    const pageTitle = await puppeteerPage.$eval('h1[data-testid="page.title"]', el => el.innerText)
    try {
        const htmlContent = await puppeteerPage.$eval('div[data-testid="page.contentEditor"]', el => el.innerHTML)
        pageContent = `# ${pageTitle}\n\n${turndownService.turndown(htmlContent)}`
    } catch (e) { }

    if (!pageContent) {
        pageContent = `# ${pageTitle}\n`
    }

    const navLinks = await puppeteerPage.$$eval('div[data-rnwrdesktop-18u37iz="true"][data-rnwr970-eqz5dr="true"] > a', elements => elements.map(item => item.href), index)
    let nextPageUrl = undefined
    if (navLinks.length > 1) {
        nextPageUrl = navLinks[navLinks.length - 1];
    } else if (navLinks.length === 1 && index === 0) {
        nextPageUrl = navLinks[0];
    }

    fs.writeFileSync(`output/${index + 1}.${pageTitle.replaceAll('/', '|')}.md`, pageContent);

    return {
        content: pageContent,
        next: nextPageUrl
    };
}

const start = async url => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const puppeteerPage = await browser.newPage();

    let count = 0;
    let book = '';
    let nextPageUrl = url;
    while (nextPageUrl) {
        const { content, next } = await downloadPage(puppeteerPage, nextPageUrl, count);
        console.log(`${count} (${nextPageUrl}): download success.`)
        book = book + '\n\n\n' + content;
        nextPageUrl = next;
        count++;
    }

    fs.writeFileSync(`output/uniagency_help_center.md`, book);

    await browser.close();
}

start('https://help.uniagency.net').then().catch(console.error);
