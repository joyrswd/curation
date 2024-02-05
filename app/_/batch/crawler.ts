#!/usr/bin/env node
import {upsert, isNew} from '../lib/MeiliSearch';
import {loadSiteFeed} from '../lib/RssLoader';
const args = process.argv.slice(2);
const minutes:number = (args[0])? parseInt(args[0])??1 : 1; //引数で実行間隔（分）を指定
const triggerTime = minutes * 60 * 1000;
const configPath = '../conf/rss.ts';

const main = async (isInstant:boolean) => {
    await loadSiteFeed(configPath, isInstant, isNew, upsert).catch(err => console.error('An error occurred:', err))
    .finally(() => (isInstant) ? process.exit(0) : setTimeout(main, triggerTime, isInstant));
};

setTimeout(main, triggerTime, (minutes == 0));