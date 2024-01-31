'use client';
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'


function Pagination ({ pages }: { pages: any }) {
    const router = useRouter();
    const params = useSearchParams();
    const keyword = usePathname().split('/').slice(2).join('');
    const redirectTo = (keyword) ? `/find/${keyword}` : '/';
    const query: any = {};
    params.forEach((value, key) => {
        query[key] = value;
    });
    async function jumpPage (event: any) {
        //ページ番号が変更されたらそのページに飛ぶ
        const page = event.target.value;
        if (isNaN(page) === false && page > 0 && page <= pages.last) {
            router.push(`${redirectTo}?${new URLSearchParams({ ...query, page: page }).toString()}`);
        }
    }

    return (
        <nav className="flex gap-x-1 w-full justify-center">
            {pages.previous > 0 && (<>
                <Link href={{ query: { ...query, page: pages.previous } }} className="min-h-[32px] min-w-[32px] py-2 px-2 inline-flex justify-center items-center gap-x-2 text-sm rounded-full text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10">
                    <svg className="flex-shrink-0 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    <span aria-hidden="true" className="sr-only">Previous</span>
                </Link>
            </>)}
            <div className="flex items-center gap-x-1">
                <input type="number" onChange={jumpPage} min={1} max={pages.last} name="page" value={pages.current} className="min-h-[24px] ps-2 text-center text-black min-h-[24px] min-w-[24px] border border-gray-200 text-gray-800 text-sm rounded-full focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none" />
                <span className="min-h-[32px] flex justify-center items-center text-gray-500 py-1.5 px-1.5 text-sm dark:text-gray-500">/</span>
                <span className="min-h-[32px] flex justify-center items-center text-gray-500 py-1.5 px-1.5 text-sm dark:text-gray-500">{pages.last}</span>
            </div>
            {pages.next > 0 && (<>
                <Link href={{ query: { ...query, page: pages.next } }} className="min-h-[32px] min-w-[32px] py-2 px-2 inline-flex justify-center items-center gap-x-2 text-sm rounded-full text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10">
                    <span aria-hidden="true" className="sr-only">Next</span>
                    <svg className="flex-shrink-0 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </Link>
            </>)}
        </nav>
    );
}

export default Pagination;