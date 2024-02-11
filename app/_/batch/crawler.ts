#!/usr/bin/env node
import {upsert, isNew} from '../lib/MeiliSearch';
import {startRssLoader} from '../lib/RssLoader';
const configPath = '../conf/rss.ts';
const args = process.argv.slice(2);
startRssLoader(args[0], configPath, isNew, upsert);
