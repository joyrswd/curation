#!/usr/bin/env node
import {upsert} from '../lib/MeiliSearch';
import {loadSiteFeed} from '../lib/RssLoader';
const args = process.argv.slice(2);
const minutes:number = (args[0])? parseInt(args[0])??1 : 1; //引数で実行間隔（分）を指定
const configPath = '../conf/rss.ts';

const main = async (isInstant:boolean) => {
    const sites = await loadSiteFeed(configPath, isInstant);
    sites.forEach(site => site.feed.items.forEach((item:any) => {
        try {
            upsert(item, site.feed.title, site.feed.link);
        } catch (error) {
            console.error(`Failed to upsert ${item.link}: ${error}`);
        }
    }));
}

let timer = setInterval(() => {
    main((minutes === 0))
    .catch(err => console.error('An error occurred:', err))
    .finally(() => {
        if(minutes === 0) {
            clearInterval(timer);
            process.exit(0);
        }
    });
}, minutes * 60 * 1000);