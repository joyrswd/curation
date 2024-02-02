'use client';
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'


function Pagination ({ pages }: { pages: any }) {
    const router = useRouter();
    const params = useSearchParams();
    const keyword = usePathname().split('/').slice(2).join('');
    const redirectTo = (keyword) ? `/find/${keyword}` : '/';
    const query: any = {};
    const currentPage = params.get('page') || pages.current;
    params.forEach((value, key) => {
        query[key] = value;
    });
    async function jumpPage (event: any) {
        event.preventDefault();
        const form = event.target.form?? event.target;
        const page = form.page.value;
        //ページ番号が変更されたらそのページに飛ぶ
        if (isNaN(page) === false && page != currentPage && page > 0 && page <= pages.last) {
            router.push(`${redirectTo}?${new URLSearchParams({ ...query, page: page }).toString()}`);
        }
    }

    return (
        <nav className="flex gap-x-1 w-full justify-center my-3">
            {pages.previous > 0 && (<>
                <Link href={{ query: { ...query, page: pages.previous } }} className="min-h-[1rem] min-w-[1rem] inline-flex justify-center items-center hover:opacity-50 mr-1.5">
                    <svg className="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    <span aria-hidden="true" className="sr-only">Previous</span>
                </Link>
            </>)}
            <form className="flex items-center gap-x-1" onSubmit={jumpPage}>
                <input type="number" onBlur={jumpPage} min={1} max={pages.last} name="page" defaultValue={currentPage} className="ps-2 text-center text-black w-[3rem] border border-gray-200 text-gray-800 text-sm rounded-full " />
                <span className="min-h-[32px] flex justify-center items-center text-gray-500 py-1.5 px-1.5 text-sm dark:text-gray-500">/</span>
                <span className="min-h-[32px] flex justify-center items-center text-gray-500 py-1.5 px-1.5 text-sm dark:text-gray-500">{pages.last}</span>
            </form>
            {pages.next > 0 && (<>
                <Link href={{ query: { ...query, page: pages.next } }} className="min-h-[1rem] min-w-[1rem] inline-flex justify-center items-center hover:opacity-50">
                    <span aria-hidden="true" className="sr-only">Next</span>
                    <svg className="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </Link>
            </>)}
        </nav>
    );
}

export default Pagination;