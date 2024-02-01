import Parser from 'rss-parser';
const parser = new Parser({ 'customFields': { item: ['dc:subject', 'category'] } });

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
    const hour = now.getHours();
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
    let feed: any;
    try {
        feed = await parser.parseURL(site.url);
    } catch (error) {
        console.error(`Failed to parse URL ${site.url}: ${error}`);
        return;
    }
    if (!feed.items) {
        console.error(`Feed items are missing ${site.url}`);
        return;
    }
    return feed;
}

export async function loadConfig(configPath:string):Promise<any> {
    try{
        const contents = await import(configPath);
        return contents.default;
    }catch(err){
        throw new Error(`Failed to load config file ${configPath}: ${err}`);
    }
}

export async function loadSiteFeed (configPath:string, isInstant:boolean):Promise<SiteType[]> {
    const configs = await loadConfig(configPath);
    const sleeping = isSleeping(configs.sleeping);
    const sites:SiteType[] = [];
    await Promise.allSettled(configs.feeds.map(async (site: SiteType) => {
        if (sleeping) site.frequency = 0;
        if (isSkip(site, isInstant) === false) {
            site.feed = await loadFeed(site);
            if (site.feed) sites.push(site);
        }
    }));
    return sites;
}