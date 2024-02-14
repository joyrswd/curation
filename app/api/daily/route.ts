import { NextResponse } from "next/server";
import {findDaily} from '@/_/lib/MeiliSearch';
import sqlite3 from 'sqlite3';
import { AppConf } from '@/_/conf/app';


async function getKeywords (ids:number[]): Promise<any> {    
    const words:string[] = [];
    const placeholder = ids.map(() => '?').join(',');
    const db = new sqlite3.Database(AppConf.sqlite);
    const tokens:any = await new Promise(resolve => db.all(`
                    SELECT word, sum(feed_token.count) as total FROM tokens 
                    JOIN feed_token ON tokens.id = feed_token.token_id 
                    WHERE feed_token.feed_id in (${placeholder})
                    GROUP BY word
                    ORDER BY total DESC
                    LIMIT 10`
                , ids, (err, rows) => resolve(rows)));
    db.close();
    tokens.forEach((token: any) => {
        words.push(token.word);
    });
    return words;
};

async function getNext() {
    const db = new sqlite3.Database(AppConf.sqlite);
    const result = await new Promise(resolve => db.get('SELECT date FROM feeds ORDER BY timestamp DESC LIMIT 1', (err, row) => resolve(row)));
    db.close();
    return result.date;
}

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
        const keywords = await getKeywords(data.ids);
        // resultをJSONに変換
        const json = JSON.stringify([data, keywords]);
        return new NextResponse(json, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
