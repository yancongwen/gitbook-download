const fs = require('fs-extra');
const puppeteer = require('puppeteer');

const selectorPrefix = '.gitbook-root nav'

const wait = (timeout = 200) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

async function getSubmenu(page, href) {
    console.log(`start get path ${href}`)
    try {
        const selector = `${selectorPrefix} a[href="${href}"]`
        await page.click(selector + ' > div:nth-child(2)');
        await wait(200);
        const links = await page.$eval(selector, dom => {
            const list = []
            const domChildren = dom.querySelectorAll('div')
            if (domChildren[1]) {
                domChildren[1].click();
                const subLinks = dom?.nextElementSibling?.querySelectorAll('a') || [];
                subLinks.forEach(element => {
                    const divChildren = element.querySelectorAll('div');
                    list.push({
                        href: element.getAttribute('href'),
                        title: divChildren[0] ? divChildren[0].innerText : null,
                        children: divChildren[1] ? [] : undefined
                    })
                })
            }
            return list;
        })
        console.log(links)
        return links;
    } catch (error) {
        console.log(error.message);
    }
}

async function getMenuTree(url) {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();

    await page.goto(url, { timeout: 60 * 1000 });
    console.log('open success')

    await page.waitForSelector(selectorPrefix);

    const links = await page.$$eval(selectorPrefix + ' a', links => links.map(link => {
        const children = link.querySelectorAll('div');
        const menu = {
            href: link.getAttribute('href'),
            title: children[0] ? children[0].innerText : null,
        }
        if (children[1]) {
            menu.children = [];
        }
        return menu;
    }).filter(link => link.href && link.title && !link.href.includes('http')))

    for (let i = 0; i < links.length; i++) {
        if (links[i].children) {
            links[i].children = await getSubmenu(page, links[i].href);
        }
    }

    await browser.close();

    console.log(JSON.stringify(links, null, 2));
    return links;
}

getMenuTree('https://help.uniagency.net').then().catch(console.error);
