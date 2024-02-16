#!/usr/bin/env node
import fs from 'fs';
import { lastPubDate, firstPubDate } from '../lib/MeiliSearch';
import { AppConf } from '../conf/app';

const sitmapPath = __dirname + '/../../../public/sitemap.xml';

const generateSitemap = (urls: string[]): string => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${AppConf.appHost}</loc>
        <lastmod>${convertDateFormat()}</lastmod>
        <changefreq>always</changefreq>
    </url>
    ${urls.join('\n')}
</urlset>`;
    return xml;
}

const convertDateFormat = (dateString?: string | Date): string => {
    const date = (dateString) ? new Date(dateString) : new Date();
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
}

const find = async (date: string) => {
    const response = await fetch(AppConf.appHost + '/api/daily', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: date }),
    });
    return (response.ok);
}

const makeElement = (date: string): string => {
    return `<url>
    <loc>${AppConf.appHost}/daily/${date}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>never</changefreq>
    </url>`;
}

const genereateUrls = async (from: string, to: string) => {
    let count = 0;
    const xml: string[] = [];
    const dater = new Date(to);
    const last = new Date(from);
    do {
        // daterを1日戻す
        dater.setDate(dater.getDate() - 1);
        const thisDate = convertDateFormat(dater);
        if (await find(thisDate)) {
            xml.push(makeElement(thisDate));
        }
        console.log(thisDate);
    } while (++count < 20 && dater > last)
    return xml;
}

const create = async () => {

    const lastDate = convertDateFormat(await lastPubDate());
    const firstDate = convertDateFormat(await firstPubDate());
    const urls = await genereateUrls(firstDate, lastDate);
    const sitemap = generateSitemap(urls);
    fs.writeFile(sitmapPath, sitemap, (err) => {
        if (err) console.error(err);
        setTimeout(create, 1000*60*60*24);
    });
}

create();
