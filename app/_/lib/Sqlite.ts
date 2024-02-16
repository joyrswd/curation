import sqlite3 from 'sqlite3';
import { AppConf } from '../conf/app';
import fs from 'fs';
import { tokenize } from "kuromojin";

if (!fs.existsSync(AppConf.sqlite)) {
    throw new Error('データベースファイルが見つかりません。');
}
const db = new sqlite3.Database(AppConf.sqlite);

export async function run(sql: string, params: any[] = []): Promise<boolean> {
    return new Promise((resolve, reject) => db.run(sql, params, (err) => err ? reject(err) : resolve(true)));
}

export async function all(sql: string, params: any[] = []): Promise<any[]>{
    return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}

export async function get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}

export async function sites(): Promise<any[]>{
    return all('SELECT * FROM sites where skip = 0');
}

export async function siteStats(): Promise<any[]>{
    return all('SELECT sites.*, (SELECT count(id) FROM feeds WHERE site_id = sites.id) AS items FROM sites');
}


export async function afterInsert(callback: Function) {
    db.on('insert', async (record, resolve) => {
        await callback(record);
        resolve(true);
    });
}

export async function insert(item: any, siteId:number): Promise<any> {

    const feed = await get('SELECT feeds.*, sites.name as site FROM feeds JOIN sites ON sites.id = feeds.site_id WHERE link = ? and sites.skip = 0', [item.link]);
    if (feed) {
        await new Promise(resolve => db.emit('insert', feed, resolve));
        return false;
    }
    const result = await run('INSERT INTO feeds (site_id, title, link, date, intro, image, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                    , [siteId, item.title, item.link, item.date, item.intro, item.image, item.category, item.timestamp]);
    if (result) {
        const record = await get('SELECT feeds.*, sites.name as site FROM feeds JOIN sites ON sites.id = feeds.site_id WHERE link = ? and sites.skip = 0', [item.link]);
        await run(`UPDATE sites set lastupdate = ? WHERE id = ? `, [new Date(record.timestamp).toISOString(), record.site_id]);
        await token(record.title + ' ' + record.intro, record.id);
        await new Promise(resolve => db.emit('insert', record, resolve));
    }
    return true;
}

export async function token(text:string, feedId:number): Promise<boolean> {
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
            ,[feedId, token.value.id]
            , resolve
        ));
    }));
    return true;
}

export async function siteByRss(rss:string): Promise<any> {
    const site = await get('SELECT * FROM sites WHERE rss = ?', [rss]);
    return site??null;
}

export async function addSite(rss:string, name:string, url:string) {
    await run(`INSERT INTO sites (rss, name, url, frequency) VALUES(?,?,?,60)`, [rss, name, url]);
    const site = await get(`SELECT * from sites WHERE rss = ?`, [rss]);
    return site;
}

export async function updateSite(value:string|number, key:string, id:number):Promise<boolean>{
    await run (`UPDATE sites SET ${key} = ? WHERE id = ?`, [value, id]);
    return true;
}
