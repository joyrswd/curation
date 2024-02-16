#!/usr/bin/env node
import {insert as meiliInsert} from '../lib/MeiliSearch';
import {getDuration, startRssLoader} from '../lib/RssLoader';
import * as Sqlite from '../lib/Sqlite';
import { AppConf } from '../conf/app';

const args = process.argv.slice(2);
const triggerTime = getDuration(args[0]);
(async () => {
    await Sqlite.afterInsert(async (record:any) => await meiliInsert(record));
    const siteList = await Sqlite.sites();
    const rssList = siteList.map((site) => {
        return {
            id: site.id,
            url: site.rss,
            frequency: site.frequency,
            lastupdate: new Date(site.lastupdate).getTime()
        };
    });
    startRssLoader(triggerTime, rssList, Sqlite.insert, AppConf.sleeping);
})();
