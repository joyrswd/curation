import { NextResponse } from "next/server";
import {findDaily} from '@/_/lib/MeiliSearch';
import {tokenize} from "kuromojin";
import crypto from "crypto";
import nodeCache from "node-cache";

const cache = new nodeCache();

async function getKeywords (text:string): Promise<any> {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const cachedHighlights = cache.get(hash);
    if (cachedHighlights) {
        return cachedHighlights;
    }
    const words: any = {};
    const tokens = await tokenize(text, {dicPath:'node_modules/kuromoji/dict/'});
    tokens.forEach((result: any) => {
        if (result.pos_detail_1 === '固有名詞') {
            const word = result.surface_form;
            if(word.length > 1 && !word.match(/^[0-9a-zA-Z]+$/)){
                words[word] = (words[word] || 0) + 1;
            }
        }
    });
    const sorted = Object.keys(words).sort((a, b) => words[b] - words[a]);
    const highlights = sorted.slice(0, 10).map((word) => `${word}`);
    cache.set(hash, highlights);
    return highlights;
};


export async function POST(req: Request) {
    // JSONのリクエストを取得
    const params = await req.json();
    // 今日以降の日付は対象外とする。
    const today = new Date().toLocaleDateString('ja-JP', {year:'numeric', month: '2-digit', day: '2-digit'}).replaceAll('/', '-');
    if (new Date(today) <= new Date(params['date'])) {
      return new NextResponse('Not Found', { status: 404 });
    }
    // MeiliSearch.findにリクエストを渡す
    const data = await findDaily(params['date']);
    //NULLの場合はエラーを返す
    if (data === null) {
        return new NextResponse('Not Found', { status: 404 });
    } else {
        const texts:string[] = [];
        const ids = data.hits.map((record: any) => {
            texts.push(record.title + " " + record.intro);
            return record.id;
        });
        const keywords = await getKeywords(texts.join("\n"));
        // resultをJSONに変換
        const json = JSON.stringify([ids, keywords]);
        return new NextResponse(json, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
