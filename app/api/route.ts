import { NextResponse } from "next/server";
import {find} from '@/_/lib/MeiliSearch';

export async function POST(req: Request) {
    // JSONのリクエストを取得
    const params = await req.json();
    // MeiliSearch.findにリクエストを渡す
    const data = await find(params);
    //NULLの場合はエラーを返す
    if (data === null) {
        return new NextResponse('Not Found', { status: 404 });
    } else {
        // resultをJSONに変換
        const json = JSON.stringify(data);
        return new NextResponse(json, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
