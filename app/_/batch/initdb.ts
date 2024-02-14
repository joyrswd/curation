#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { AppConf } from '../conf/app';
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
        path[path.length - 1] = name;
        AppConf.sqlite = path.join('/');
    }
    if (fs.existsSync(AppConf.sqlite)) {
        console.log('データベースファイルがすでに存在します。処理を中止します。');
        process.exit(1);
    }

    const db = new sqlite3.Database(AppConf.sqlite);

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT UNIQUE,
            rss TEXT UNIQUE,
            frequency integer NOT NULL,
            skip INTEGER CHECK (skip IN (0, 1)) DEFAULT 0,
            hidden INTEGER CHECK (skip IN (0, 1)) DEFAULT 0,
            lastupdate TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id INTEGER NOT NULL REFERENCES sites(id),
            title TEXT NOT NULL,
            link TEXT UNIQUE,
            date TEXT NOT NULL,
            intro TEXT,
            image TEXT,
            category TEXT,
            timestamp INTEGER NOT NULL
        )`);

        db.run(`CREATE INDEX idx_category ON feeds (category)`);
        db.run(`CREATE INDEX idx_date ON feeds (date)`);

        db.run(`CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT UNIQUE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS feed_token (
            feed_id INTEGER NOT NULL REFERENCES feeds(id),
            token_id INTEGER NOT NULL REFERENCES tokens(id),
            count INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (feed_id, token_id)
        )`, (err) => process.exit(err ? 1 : 0));
    });

})();
