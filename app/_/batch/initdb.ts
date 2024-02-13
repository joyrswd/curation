#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { AppConf } from '../conf/app';

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

    db.run(`CREATE TABLE IF NOT EXISTS feed_tokens (
        feed_id INTEGER NOT NULL REFERENCES feeds(id),
        token_id INTEGER NOT NULL REFERENCES tokens(id),
        count INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (feed_id, token_id)
    )`);

});


