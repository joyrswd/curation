"use client";
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function Form() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const keywordValue = usePathname().split('/').slice(2).join('');
    const dateValue = searchParams.get('date')??'';
    const siteValue = searchParams.get('site')??'';
    async function searchFeed(formData: FormData) {
        const params: string[][] = [];
        let keyword = '';
        formData.forEach((value, key) => {
            if (typeof value !== 'string') {
                return;
            } else if (value.length === 0) {
                return;
            } else if (key === 'keyword') {
                keyword = value;
            } else {
                params.push([key, value]);
            }
        });
        const query = new URLSearchParams(params).toString();
        if (query.length + keyword.length === 0) {
            router.push(`/`);
        } else {
            router.push(`/find/${keyword}?${query}`);
        }
    }

    return (
        <form action={searchFeed} className="md:max-w-prose">
            <p>
                <input name="keyword" defaultValue={decodeURIComponent(keywordValue)} type="text" placeholder="キーワード" className="border border-gray-300 bg-white h-7 px-5 pr-16 rounded-lg text-sm focus:outline-none"/>
            </p>
            <p>
                <input type="date" defaultValue={dateValue} name="date" className='border border-gray-300 bg-white h-7 rounded-lg text-sm focus:outline-none' />
                <input type="text" defaultValue={siteValue} list="site-name" placeholder="掲載元" name='site' className='border border-gray-300 bg-white h-7 rounded-lg text-sm focus:outline-none' />
            </p>
            <p><button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold text-xs p-2 rounded whitespace-nowrap">検索</button></p>
        </form>
    )
}
