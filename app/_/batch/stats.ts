#!/usr/bin/env node
import {stats} from '../lib/MeiliSearch';
import {siteStats} from '../lib/Sqlite';
(async () => {
    await stats();
    console.log(await siteStats());
})();