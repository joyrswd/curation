#!/usr/bin/env node
import MeiliSearch from '../lib/MeiliSearch';
import {loadSiteFeed} from '../lib/RssLoader';
const args = process.argv.slice(2);
const duration:number = (args[0])? 0 : 60;
const isInstant = (duration === 0);
const configPath = '../conf/rss.ts';

const main = async () => {
    const sites = await loadSiteFeed(configPath, isInstant);
    sites.forEach(site => site.feed.items.forEach((item:any) => {
        try {
            MeiliSearch.upsert(item, site.feed.title, site.feed.link);
        } catch (error) {
            console.error(`Failed to upsert ${item.link}: ${error}`);
        }
    }));
}

let timer = setInterval(() => {
    main().catch(err => console.error('An error occurred:', err));
    if (isInstant) {
        clearInterval(timer);
    }
}, duration * 1000);