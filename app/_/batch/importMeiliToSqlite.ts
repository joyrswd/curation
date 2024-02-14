#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { AppConf } from '../conf/app';
import Rss from '../conf/rss';
import { loadFeed } from '../lib/RssLoader';
import { getAll } from '../lib/MeiliSearch';
import { tokenize } from "kuromojin";
import readline from 'readline';
import fs from 'fs';

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

    const db = new sqlite3.Database(AppConf.sqlite);

    //トランザクション開始
    await new Promise(resolve => db.serialize(async () => {
        db.run('BEGIN TRANSACTION');
        //sitesテーブルの初期化
        db.run('DELETE FROM sites');
        //feedsテーブルの初期化
        db.run('DELETE FROM feeds');
        //tokensテーブルの初期化
        db.run('DELETE FROM tokens');
        //feed_tokenテーブルの初期化
        db.run('DELETE FROM feed_token');
        //sitesテーブルにデータを挿入
        const stmt = db.prepare('INSERT INTO sites (name, url, rss, frequency, skip, hidden, lastupdate) VALUES (?, ?, ?, ?, ?, ?, ?)');
        await Promise.allSettled(Rss.feeds.map(async (site: any) => {
            await loadFeed(site).then((feed) => {
                const current = (new Date()).toISOString();
                stmt.run(feed.title, feed.link, site.url, site.frequency, (site.skip ? 1 : 0), 0, current);
                console.log(`Loaded feed ${site.url}`);
            }).catch((err) => {
                console.log(`Failed to load feed ${site.url}: ${err}`);
            });
        }));
        stmt.finalize();
        //トランザクションのコミット
        db.run('COMMIT', resolve);
    }));

    await new Promise(resolve => db.all('SELECT * FROM sites where skip = 0', async (err, sites: any) => {
        if (err) {
            console.log(err);
        }
        await Promise.allSettled(sites.map(async (site: any) => {
            console.log(`Importing feeds from ${site.name}`);
            let current = 1;
            let total = 0;
            do {
                const result = await getAll({ page: current, hitsPerPage: 1000, filter: `site = "${site.name}"` });
                await new Promise(resolve => db.serialize(async () => {
                    db.run('BEGIN TRANSACTION');
                    const stmt = db.prepare('INSERT INTO feeds (site_id, title, link, date, intro, image, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    result.hits.forEach((feed: any) => {
                        const date = new Date(feed.date).toISOString().split('T')[0];
                        stmt.run(site.id, feed.title, feed.link, date, feed.intro, feed.image, feed.category, feed.timestamp);
                    });
                    total = result.totalHits;
                    stmt.finalize();
                    db.run('COMMIT', resolve);
                }));
            } while (total > current++);
            console.log(`Imported ${total} feeds from ${site.name}`);
        }));
        resolve(sites);
    }));
    console.log(`Imported feeds`);

    await new Promise(resolve => db.all('SELECT * FROM feeds', async (err, feeds: any) => {
        console.log(`Importing tokens from ${feeds.length} feeds`);
        await Promise.allSettled(feeds.map(async (feed: any) => {
            const text = feed.title + " " + feed.intro;
            const tokens = await Promise.allSettled((await tokenize(text, { dicPath: 'node_modules/kuromoji/dict/' })).filter((token: any) => {
                return token.pos_detail_1 === '固有名詞' && token.surface_form.length > 1 && !token.surface_form.match(/^[0-9a-zA-Z]+$/);
            }).map(async (token: any) => {
                return new Promise((resolve, reject) => db.serialize(() => {
                    const word = token.surface_form;
                    db.run('INSERT INTO tokens (word) VALUES (?) ON CONFLICT(word) DO NOTHING', [word]);
                    db.get('SELECT * FROM tokens WHERE word = ?', [word], (err, row: any) => resolve(row));
                }));
            }));
            await Promise.allSettled(tokens.map(async(token: any) => {
                await new Promise((resolve, reject) => db.run(
                    'INSERT INTO feed_token (feed_id, token_id) VALUES (?, ?) ON CONFLICT(feed_id, token_id) DO UPDATE SET count = count + 1'
                    ,[feed.id, token.value.id]
                    , resolve
                ));
            }));
        }));
        console.log(`Imported tokens`);
        resolve(feeds);
    }));
    console.log(`Completed`);
    db.close();
    process.exit(0);

})();
