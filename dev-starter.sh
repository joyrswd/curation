#!/bin/sh

cd `dirname $0`
npm run batch:crawl &
npm run dev &
exit 0