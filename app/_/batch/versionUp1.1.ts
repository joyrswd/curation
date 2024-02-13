#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { AppConf } from '../conf/app';
import Rss from '../conf/rss';
import { loadFeed } from '../lib/RssLoader';
import { getAll } from '../lib/MeiliSearch';
import { tokenize } from "kuromojin";

const db = new sqlite3.Database(AppConf.sqlite);
/*
//トランザクション開始
db.serialize(async () => {
    db.run('BEGIN TRANSACTION');
    //sitesテーブルの初期化
    db.run('DELETE FROM sites');
    //feedsテーブルの初期化
    db.run('DELETE FROM feeds');
    //tokensテーブルの初期化
    db.run('DELETE FROM tokens');
    //feed_tokensテーブルの初期化
    db.run('DELETE FROM feed_tokens');
    //sitesテーブルにデータを挿入
    const stmt = db.prepare('INSERT INTO sites (name, url, rss, frequency, skip, hidden, lastupdate) VALUES (?, ?, ?, ?, ?, ?, ?)');
    await Promise.allSettled(Rss.feeds.map(async (site: any) => {
        await loadFeed(site).then((feed) => {
            const current = (new Date()).toISOString();
            stmt.run(feed.title, feed.link, site.url, site.frequency, (site.skip ? 1 : 0), 0, current);
        }).catch((err) => {
            console.log(`Failed to load feed ${site.url}: ${err}`);
        });
    }));
    stmt.finalize();
    //トランザクションのコミット
    db.run('COMMIT');
});

db.each('SELECT * FROM sites where skip = 0', async (err, site: any) => {
    if (err) {
        console.log(err);
    }
    let current = 1;
    let total = 0;
    do {
        const result = await getAll({ page: current, hitsPerPage: 1000, filter: `site = "${site.name}"` });
        db.serialize(async () => {
            db.run('BEGIN TRANSACTION');
            const stmt = db.prepare('INSERT INTO feeds (site_id, title, link, date, intro, image, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            result.hits.forEach((feed: any) => {
                const date = new Date(feed.date).toISOString().split('T')[0];
                stmt.run(site.id, feed.title, feed.link, date, feed.intro, feed.image, feed.category, feed.timestamp);
            });
            total = result.totalHits;
            stmt.finalize();
            db.run('COMMIT');
        });
    } while (total > current++);
});
*/
db.each('SELECT * FROM feeds', async (err, feed: any) => {
    const text = feed.title + " " + feed.intro;
    const tokens = await Promise.allSettled((await tokenize(text, { dicPath: 'node_modules/kuromoji/dict/' })).filter((token: any) => {
        return token.pos_detail_1 === '固有名詞' && token.surface_form.length > 1 && !token.surface_form.match(/^[0-9a-zA-Z]+$/);
    }).map(async (token: any) => {
        return new Promise((resolve, reject) => {
            const word = token.surface_form;
            db.get('SELECT * FROM tokens WHERE word = ?', [word], (err, row: any) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(row);
                } else {
                    db.run('INSERT INTO tokens (word) VALUES (?)', [word]);
                    db.get('SELECT * FROM tokens WHERE word = ?', [word], (err, row: any) => (err) ? reject(err) : resolve(row));
                }
            });
        })
    }));
    db.serialize(async () => {
        db.run('BEGIN TRANSACTION');
        const relation = db.prepare('INSERT INTO feed_tokens (feed_id, token_id) VALUES (?, ?) ON CONFLICT(feed_id, token_id) DO UPDATE SET count = count + 1');
        tokens.forEach((token: any) => {
            relation.run(feed.id, token.value.id);
        });
        relation.finalize();
        db.run('COMMIT');
    });
});