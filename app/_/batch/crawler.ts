#!/usr/bin/env node
import {upsert, isNew} from '../lib/MeiliSearch';
import {isSleeping, loadConfig, loadSiteFeed} from '../lib/RssLoader';
const args = process.argv.slice(2);
const minutes:number = (args[0])? parseInt(args[0])??1 : 1; //引数で実行間隔（分）を指定
const triggerTime = minutes * 60 * 1000;
const configPath = '../conf/rss.ts';

const main = async (isInstant:boolean) => {
    const config = await loadConfig(configPath);
    await loadSiteFeed(config, isInstant, isNew, upsert).catch(err => console.error('An error occurred:', err))
    .finally(() => {
        if(triggerTime === 0) process.exit(0);
        const sleeping = isSleeping(config.sleeping);
        const nextTime = (sleeping) ? 60 * 60 * 1000 : triggerTime;
        setTimeout(main, nextTime, sleeping)
    });
};

setTimeout(main, triggerTime, (triggerTime === 0));