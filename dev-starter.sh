#!/bin/sh

cd `dirname $0`
npm run batch:crawl &
npm run dev &
npm run batch:sitemap &
exit 0