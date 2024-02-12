import Entry from '@/_/components/entry';
import { AppConf } from '@/_/conf/app';

export async function find(date: string): Promise<[string, string[], string[]] | null> {
    const response = await fetch(AppConf.appHost + '/api/daily', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: date }),
        next: {
            revalidate: false,
        }
    });
    if (!response.ok) {
        return null;
    }
    const [ids, keywords] = await response.json();
    return [date, ids, keywords];
};

export function List({ date, ids, keywords }: {date:string | null; ids: string[] | null; keywords: string[] | null }) {
    const thisdate = (date) ? new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    return (!ids) ? (
        <div className="text-center">No results found.</div>
    ) : (
        <>
            {keywords && (<dl id="keywords">
                <dt>{thisdate}</dt>
                <dd>
                    <ul>
                        {keywords && keywords.map((k: string) => <li key={k}><a href={"/" + k + '?date=' + date}>{k}</a></li>)}
                    </ul>
                </dd>
            </dl>)}
            <p id="total">{ids.length} items</p>
            {ids.map((i: string) => <Entry id={i} key={i} />)}
        </>
    );
}

