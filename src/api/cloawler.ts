import configs from '../conf/rss.json';
import MeiliSearch from '../lib/MeiliSearch';
import Parser from 'rss-parser';
const parser = new Parser({'customFields': {item:['dc:subject']}});

const isSleeping = (sleeping:number[]) => {
    const start = sleeping[0];
    const end = sleeping[1];
    const now = new Date();
    const minutes = now.getMinutes();
    const hour = now.getHours();
    return (start <= hour && hour < end && minutes % 30 !== 0);
}

type SiteType = {
    feed: string;
    frequency: number;
    skip?: string;
}

const isSkip = (site: SiteType) => {
    if (site.skip) {
        return true;
    }
    const frequency = site.frequency;
    const minutes = new Date().getMinutes();
    return ((frequency == 0 && minutes != 0) || (frequency > 0 && minutes % frequency !== 0));
}

const loadFeed = async (site: SiteType) => {
    if (isSkip(site)) {
        return;
    }
    let feed: any;
    try {
        feed = await parser.parseURL(site.feed);
    } catch (error) {
        console.error(`Failed to parse URL ${site.feed}: ${error}`);
        return;
    }
    if (!feed.items) {
        console.error(`Feed items are missing ${site.feed}`);
        return;
    }
    await Promise.all(feed.items.map((item: Object) => MeiliSearch.upsert(item, feed.title, feed.link).catch((error: Error) => console.error(`Failed to save item: ${error}`))));
}

const main = async () => {
    const sleeping: number[] = configs.sleeping;
    if (isSleeping(sleeping)) {
        console.log('The process is currently in the sleeping period.');
        return;
    }
    for (const site of configs.sites) {
        try {
            // メモリー不足を考慮し逐次実行
            await loadFeed(site);
        } catch (error) {
            console.error(`Failed to load feed ${site.feed}: ${error}`);
        }
    }
}

main().catch(err => console.error('An error occurred:', err));