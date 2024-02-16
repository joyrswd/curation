import { prompt } from 'enquirer';
import fs from 'fs';
import * as Sqlite from '../lib/Sqlite';
import { loadFeed, addItems } from '../lib/RssLoader';
import { insert as meiliInsert } from '../lib/MeiliSearch';
import { type SiteType } from '../lib/types';

(async () => {

    let answer: any;
    const baseDir = process.cwd() + '/';
    answer = await prompt({
        type: 'input',
        name: 'path',
        message: 'TSファイルのパスを入力してください。\n',
        format: (value: string) => baseDir + value,
    });

    const path = baseDir + answer.path;
    if (!fs.existsSync(path)) {
        console.log('ファイルが見つかりません。');
        process.exit(1);
    }
    try {
        const filedata = await import(path);
        type FeedItem = [string, number, string];
        const rss: FeedItem[] = filedata.default;
        const sites:any = await Promise.all(rss.map(async (item: FeedItem) => {
            const [name, frequency, rss] = item;
            const record: any = await Sqlite.siteByRss(rss);
            if (record) {
                console.log(`『${name}』はすでに登録されています。`);
                return record;
            } else {
                try {
                    const feed: any = await loadFeed(rss);
                    const link = feed.link || (new URL(rss)).origin;
                    const site = await Sqlite.addSite(rss, name, link, frequency);
                    console.log(`『${name}』を登録しました。`);
                    return site;
                } catch (e) {
                    console.log(`『${name}』の登録に失敗しました。`);
                    throw e;
                }
            }
        }));
        await Sqlite.afterInsert(async (record: any) => await meiliInsert(record));
        await Promise.allSettled(sites.map(async (site: any) => {
            const feed: any = await loadFeed(site.rss);
            await addItems(feed.items, site as SiteType, Sqlite.insert);
        }));
        console.log('処理が完了しました。');
        process.exit(0);
    } catch (e) {
        console.error(e);
        console.log('処理をキャンセルします。');
        Sqlite.emptySites();
        process.exit(1);
    }


})();