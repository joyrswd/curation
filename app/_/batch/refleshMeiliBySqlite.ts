#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { AppConf } from '../conf/app';
import readline from 'readline';
import fs from 'fs';
import MeiliSearch from 'meilisearch';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt: string) => {
    return new Promise<string>((resolve) => {
        rl.question(prompt, resolve);
    });
};

(async () => {
    //AppConf.sqliteのパスからファファイル名を取得
    const path = AppConf.sqlite.split('/');
    const filename = path[path.length - 1];
    const name = await question(`データベースファイル名を入力してください（${filename}）:`);
    if (name) {
        AppConf.sqlite = AppConf.sqlite.replace('/' + filename, '/' + name);
    }
    if (!fs.existsSync(AppConf.sqlite)) {
        console.log('データベースファイルが見つかりません。処理を中止します。');
        process.exit(1);
    }
    const indexname = AppConf.db.index;
    const inputindex = await question(`MeiliSearchのホスト名を入力してください（${indexname}）:`);
    if (inputindex) {
        AppConf.db.index = inputindex;
    }

    const host = AppConf.db.host??'';
    const apiKey = AppConf.db.key??'';
    const index = AppConf.db.index??'';
    const client = new MeiliSearch({ host, apiKey });
    client.deleteIndexIfExists(index);
    const meili = client.index(index);

    const db = new sqlite3.Database(AppConf.sqlite);

    db.all(`SELECT 
        feeds.id, 
        feeds.title, 
        feeds.link, 
        feeds.date, 
        feeds.intro, 
        feeds.image, 
        feeds.category, 
        feeds.timestamp, 
        sites.name as site
        FROM feeds LEFT JOIN sites ON feeds.site_id = sites.id WHERE sites.skip = 0`, async (err, rows:any) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        meili.addDocuments(rows).finally(() => {
            console.log('MeiliSearchへのデータの登録が完了しました。');
            db.close();
            process.exit(0);
        });
    });

})();