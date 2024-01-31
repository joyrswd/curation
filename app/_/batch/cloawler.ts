import fs from 'fs';
import path from 'path';
import MeiliSearch from '../lib/MeiliSearch';
import Parser from 'rss-parser';
const args = process.argv.slice(2);
const duration:number = (args[0])? 0 : 60;
const configPath = '../conf/rss.json';
const parser = new Parser({ 'customFields': { item: ['dc:subject', 'category'] } });
let counter = 0;

const isSleeping = (sleeping: number[]) => {
    const start = sleeping[0];
    const end = sleeping[1];
    const now = new Date();
    const hour = now.getHours();
    return (start <= hour && hour < end);
}

type SiteType = {
    feed: string;
    frequency: number;
    skip?: string;
}

const isSkip = (site: SiteType, gap: number) => {
    if ((site.skip ?? false) !== false) {
        return true;
    } else if (duration === 0 ) {
        return false;
    }
    const frequency = site.frequency;
    const minutes = new Date().getMinutes();
    return ((frequency == 0 && minutes != 0) || (frequency > 0 && minutes % frequency > gap));
}

const loadFeed = async (site: SiteType, gap: number) => {
    if (isSkip(site, gap)) {
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

const loadConfig = async ():Promise<any> => {
    try{
        const data = await fs.promises.readFile(path.resolve(__dirname, configPath), 'utf8');
        return JSON.parse(data);
    }catch(err){
        console.error(err);
        return;
    }
}


const main = async (starter: number) => {
    const configs = await loadConfig();
    const period: number[] = configs.sleeping;
    const sleeping = isSleeping(period);
    for (const site of configs.sites) {
        if (sleeping) {
            //sleeping中はすべて1時間間隔にする
            site.frequency = 0;
        }
        try {
            // メモリー不足を考慮し逐次実行
            await loadFeed(site, (counter - starter));
        } catch (error) {
            console.error(`Failed to load feed ${site.feed}: ${error}`);
        }
    }
}

let timer = setInterval(() => {
    main(++counter).catch(err => console.error('An error occurred:', err));
    if (duration === 0) {
        clearInterval(timer);
    }
}, duration * 1000);