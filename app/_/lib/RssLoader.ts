import Parser from 'rss-parser';
import {log} from './LogWriter';

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

export function isSkip (site: SiteType, isInstant?: boolean):boolean {
    if ((site.skip ?? false) !== false) {
        return true;
    } else if (isInstant) {
        return false;
    }
    const frequency = site.frequency;
    const minutes = new Date().getMinutes() || 60;
    return ((frequency == 0 && minutes != 60) || (frequency > 0 && minutes % frequency > 0));
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

export async function loadSiteFeed (configs:any, isInstant:boolean, isNew:Function, callback:Function) {
    await Promise.allSettled(configs.feeds.filter((site: SiteType) => !isSkip(site, isInstant))
        .map(async (site: SiteType) => {
            log('rss', `[Start] ${site.url}`, 'd');
            await loadFeed(site).then(async (feed) => {
                if (feed && await isNew(feed.items[0], feed.title, feed.link)) {
                    await Promise.allSettled( feed.items.map( async(item:any) => await callback(item, feed.title, feed.link)));
                    log('rss', `[Update] ${site.url} ${feed.items.length} items.`, 'd');
                } else {
                    log('rss', `[None] ${site.url} no updates.`, 'd');
                }
            }).catch(err => log('rss', `[Error] ${site.url} : ${err.message}`, 'd'));
        }));
}