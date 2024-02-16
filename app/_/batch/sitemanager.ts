#!/usr/bin/env node
import {insert as meiliInsert} from '../lib/MeiliSearch';
import * as Sqlite from '../lib/Sqlite';
import {prompt} from 'enquirer';
import { loadFeed, addItems } from '../lib/RssLoader';
import {type SiteType} from '../lib/types';

(async ()=>{

    let answer:any;
    answer = await prompt({
        type:'input',
        name: 'rss',
        message: 'RSSのURLを入力してください。',
    });

    try {
        new URL(answer.rss);
    } catch (e) {
        console.log('不正な値が入力されています。');
        process.exit(1);
    }
    const rss = answer.rss;
    const site = await Sqlite.siteByRss(rss);
    if (site) {
        console.log(site);
        console.log(`『${site.name}』はすでに登録されています。`);
        answer = await prompt({
            type: 'select',
            name: 'key',
            message: `更新する項目を選択してください。`,
            choices: ['更新しない', 'name', 'frequency', 'skip'],
        });
        const key = answer.key;
        const question:any = {name:'update'};
        switch(key) {
            case 'name':
                question.type = 'input';
                question.message = `サイト名を入力してください。（${site.name}）\n`;
                break;
            case 'frequency':
                question.type = 'number';
                question.message = `更新頻度を入力してください。(${site.frequency})\n`;
                question.validate = (input:number) => (Number.isInteger(input) && input >= 0 && input < 60*24);
                break;
            case 'skip':
                question.type = 'confirm';
                question.message = site.skip ? `更新を再開してよろしいですか？` : `更新を停止してよろしいですか？`;
        }
        if (question?.type) {
            answer = await prompt(question);
            if (answer.update !== false) {
                const value = (question.type === 'confirm') ? (1 - site[key]) : answer.update;
                await Sqlite.updateSite(value, key, site.id);
                console.log('サイト情報を更新しました。');
            }
        }
        process.exit(0);
    }

    try {
        const feed = await loadFeed(rss);
        answer = await prompt({
            type: 'confirm',
            name: 'confirm',
            message: `『${feed.title}』を新規登録します。よろしいですか？`,
        });
        if (answer.confirm === false) {
            console.log(`処理をキャンセルしました。`);
            process.exit(0);
        }
        const site = await Sqlite.addSite(rss, feed.title, feed.link);
        await Sqlite.afterInsert(async (record:any) => await meiliInsert(record));
        await addItems(feed.items, site as SiteType, Sqlite.insert);
        console.log(`サイト登録処理が完了しました。`);
        process.exit(0);
    } catch (e) {
        console.log(e);
        console.log(`エラーが発生したため処理を終了します。`)
        process.exit(1);
    }

})();