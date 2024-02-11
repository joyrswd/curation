#!/usr/bin/env node
import {upsert, isNew} from '../lib/MeiliSearch';
import {getDuration, startRssLoader} from '../lib/RssLoader';
const configPath = '../conf/rss.ts';
const args = process.argv.slice(2);
const triggerTime = getDuration(args[0]);
startRssLoader(triggerTime, configPath, isNew, upsert);
