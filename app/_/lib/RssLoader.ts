import Parser from 'rss-parser';
import {log} from './LogWriter';
import { run } from 'node:test';

const parser = new Parser({ 
    customFields: { item: ['dc:subject', 'category'] },
    timeout: 10*1000,
});

type SiteType = {
    url: string;
    frequency: number;
    skip?: string;
    feed?: any;
}

export function isSleeping(sleeping: number[]):boolean {
    const start = sleeping[0];
    const end = sleeping[1];
    const now = new Date();
    const hour = parseInt(now.toLocaleString('ja-JP', { hour: 'numeric', hour12: false, timeZone: 'Asia/Tokyo'}));
    return (start <= hour && hour < end);
}

export function wakeUp(sleeping: number[]):number {
    return (sleeping[1] - sleeping[0]) * 60 * 60 * 1000;
}

export function isSkip (site: SiteType, isInstant?: boolean):boolean {
    if ((site.skip ?? false) !== false) {
        return true;
    } else if (isInstant) {
        return false;
    }
    const frequency = site.frequency;
    const currentMin = new Date().getMinutes();
    const currentHour = new Date().getHours();  
    const minutes = (currentHour * 60 + currentMin) || 24 * 60;
    return ((frequency == 0 && minutes != 24 * 60) || (frequency > 0 && minutes % frequency > 0));
}

export async function loadFeed (site: SiteType):Promise<any> {
    try {
        const feed = await parser.parseURL(site.url);
        if (!feed.items) {
            throw new Error(`Feed items are missing`);
        }
        return feed;
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}

export async function loadConfig(configPath:string):Promise<any> {
    try{
        delete require.cache[require.resolve(configPath)];
        const contents = await require(configPath);
        return contents.default;
    }catch(err){
        throw new Error(`Failed to load config file ${configPath}: ${err}`);
    }
}

export async function processFeed (site: SiteType, isNew:Function, callback:Function) {
    log('rss', `[Start] ${site.url}`, 'd');
    await loadFeed(site).then(async (feed) => {
        if (feed && await isNew(feed.items[0], feed.title, feed.link)) {
            await Promise.allSettled( feed.items.map( async(item:any) => await callback(item, feed.title, feed.link)));
            log('rss', `[Update] ${site.url} ${feed.items.length} items.`, 'd');
        } else {
            log('rss', `[None] ${site.url} no updates.`, 'd');
        }
    }).catch(err => log('rss', `[Error] ${site.url} : ${err.message}`, 'd'));
}

export async function loadSiteFeed (isInstant:boolean, configs:any, isNew:Function, callback:Function) {
    await Promise.allSettled(configs.feeds.filter((site: SiteType) => !isSkip(site, isInstant))
        .map((site: SiteType) => processFeed(site, isNew, callback)));
}

export function getDuration(arg:any):number {
    const duration:number = isNaN(arg)? 1 : parseInt(arg)??1; //引数で実行間隔（分）を指定
    return duration * 60 * 1000;
}

export function setNextTime(triggerTime:number, sleepings:number[], callback:Function) {
    const nextTime = isSleeping(sleepings) ? wakeUp(sleepings) : triggerTime;
    setTimeout(callback, nextTime);
}

export async function startRssLoader(triggerTime:number, configPath:string, isNew:Function, callback:Function) {
    const isInstant = (triggerTime === 0);
    const config = await loadConfig(configPath);
    await loadSiteFeed(isInstant, config, isNew, callback)
        .catch(err => log('rss', `An error occurred: ${err}`))
        .finally(() => (isInstant) ? process.exit(0) : setNextTime(triggerTime, config.sleeping, () => startRssLoader(triggerTime, configPath, isNew, callback)));
}