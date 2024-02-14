import Entry from '@/_/components/entry';
import { AppConf } from '@/_/conf/app';
import Link from 'next/link'

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
    const [data, keywords] = await response.json();
    return [date, data, keywords];
};

export function List({ date, data, keywords }: { date: string | null; data: { ids: number[], next: string | null, previous: string | null } | null; keywords: string[] | null }) {
    const thisdate = (date) ? new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    return (!data) ? (
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
            <p id="total">{data.ids.length} items</p>
            {data.ids.map((i: number) => <Entry id={i} key={i} />)}
            <nav className="flex gap-x-1 w-full justify-center my-3">
                {data.next && (<>
                    <Link href={"/daily/" + data.next} className="min-h-[1rem] min-w-[1rem] inline-flex justify-center items-center hover:opacity-50 mr-1.5" data-testid="previous">
                        <svg className="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        <span aria-hidden="true" className="sr-only">Next</span>
                    </Link>
                </>)}
                {data.previous && (<>
                    <Link href={"/daily/" + data.previous} className="min-h-[1rem] min-w-[1rem] inline-flex justify-center items-center hover:opacity-50" data-testid="next">
                        <span aria-hidden="true" className="sr-only">Previous</span>
                        <svg className="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </Link>
                </>)}
            </nav>
        </>
    );
}

