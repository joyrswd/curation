import Parser from 'rss-parser';
import { log } from './LogWriter';
import sanitizeHtml from 'sanitize-html';

const parser = new Parser({
    customFields: { item: ['dc:subject', 'category'] },
    timeout: 10 * 1000,
});

type SiteType = {
    id: number;
    url: string;
    frequency: number;
    lastupdate: number;
}

export function isSleeping(sleeping: number[]): boolean {
    const start = sleeping[0];
    const end = sleeping[1];
    const now = new Date();
    const hour = parseInt(now.toLocaleString('ja-JP', { hour: 'numeric', hour12: false, timeZone: 'Asia/Tokyo' }));
    return (start <= hour && hour < end);
}

export function wakeUp(sleeping: number[]): number {
    return (sleeping[1] - sleeping[0]) * 60 * 60 * 1000;
}

export function isSkip(site: SiteType, isInstant?: boolean): boolean {
    if (isInstant) {
        return false;
    }
    const frequency = site.frequency;
    const currentMin = new Date().getMinutes();
    const currentHour = new Date().getHours();
    const minutes = (currentHour * 60 + currentMin) || 24 * 60;
    return ((frequency == 0 && minutes != 24 * 60) || (frequency > 0 && minutes % frequency > 0));
}

export const parseIntro = (content: string): string => {
    // contentからHTMLタグを除去
    const urlText = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
    // urlを除去
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const nlText = urlText.replace(urlRegex, '');
    // 連続した改行を除去
    const text = nlText.replace(/[\n\s*\n]+/g, '\n');
    return text;
}

export const parseImage = (content: string): string => {
    const regex = /<img.*?src\s*=\s*[\"|\'](.*?)[\"|\'].*?>/g;
    const match = regex.exec(content);
    if (match && match[1]) {
        return match[1];
    }
    return '';
}

export function convert(item: any): any {
    const pubDate = item.pubDate ?? item.date;
    return {
        title: item.title,
        link: item.link,
        date: new Date(pubDate).toLocaleDateString('ja-JP', {year:'numeric', month: '2-digit', day: '2-digit'}).replaceAll('/', '-'),
        intro: parseIntro(item['content:encoded']),
        image: parseImage(item['content:encoded']),
        category: item.category ?? item['dc:subject'] ?? '',
        timestamp: new Date(pubDate).getTime(),
    };
}

export async function loadFeed(site: SiteType): Promise<any> {
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

export async function loadFeedItems(site: SiteType): Promise<any> {
    try {
        const feed = await loadFeed(site);
        return feed.items.map((item:any) => convert(item));
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}

export async function loadConfig(configPath: string): Promise<any> {
    try {
        delete require.cache[require.resolve(configPath)];
        const contents = await require(configPath);
        return contents.default;
    } catch (err) {
        throw new Error(`Failed to load config file ${configPath}: ${err}`);
    }
}

export async function processFeed(site: SiteType, callback: Function) {
    log('rss', `[Start] ${site.url}`, 'd');
    await loadFeedItems(site).then(async (items) => {
        if (items && site.lastupdate < items[0].timestamp) {
            await Promise.allSettled(items.map(async (item: any) => await callback(item, site.id)));
            log('rss', `[Update] ${site.url} ${items.length} items.`, 'd');
        } else {
            log('rss', `[None] ${site.url} no updates.`, 'd');
        }
    }).catch(err => log('rss', `[Error] ${site.url} : ${err.message}`, 'd'));
}

export async function loadSiteFeed(isInstant: boolean, sites: any, callback: Function) {
    await Promise.allSettled(sites.filter((site: SiteType) => !isSkip(site, isInstant))
        .map((site: SiteType) => processFeed(site, callback)));
}

export function getDuration(arg: any): number {
    const duration: number = isNaN(arg) ? 1 : parseInt(arg) ?? 1; //引数で実行間隔（分）を指定
    return duration * 60 * 1000;
}

export function setNextTime(triggerTime: number, sleepings: number[], callback: Function) {
    const nextTime = isSleeping(sleepings) ? wakeUp(sleepings) : triggerTime;
    setTimeout(callback, nextTime);
}

export async function startRssLoader(triggerTime: number, rssInfo: any, callback: Function, sleepings: number[]) {
    const isInstant = (triggerTime === 0);
    await loadSiteFeed(isInstant, rssInfo, callback)
        .catch(err => log('rss', `An error occurred: ${err}`))
        .finally(() => (isInstant) ? process.exit(0) : setNextTime(triggerTime, sleepings, () => startRssLoader(triggerTime, rssInfo, callback, sleepings)));
}