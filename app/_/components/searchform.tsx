"use client";
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { type SearchKeys } from '@/_/lib/types';

export function parseQueryAndKeyword(formData: FormData): [Partial<SearchKeys>, string] {
    const params: Partial<SearchKeys> = {};
    let keyword: string = '';
    formData.forEach((value, key) => {
        if (typeof value === 'string' && value.length > 0) {
            if (key === 'keyword') {
                keyword = value;                
            } else {
                params[key as keyof SearchKeys] = value;
            }
        }
    });
    return [params, keyword];
}

export function FormContainer() {
    const router = useRouter();
    async function searchFeed(formData: FormData) {
        const [search, keyword] = parseQueryAndKeyword(formData);
        const query = new URLSearchParams(search).toString();
        let path = (keyword.length > 0) ? `/${keyword}` : '/';
        if(query.length > 0) path += '?' + query;
        router.push(`${path}`);
    }

    return <FormPresenter action={searchFeed} />
}

export function FormPresenter({ action }: { action: string | ((formData: FormData) => void) | undefined }) {
    const searchParams = useSearchParams();
    const dateValue = searchParams.get('date') ?? '';
    const siteValue = searchParams.get('site') ?? '';
    const keywordValue = usePathname().split('/').slice(1).join('');
    const today = new Date().toISOString().split('T')[0];
    return (
        <form action={action} className="md:max-w-prose">
            <p>
                <input name="keyword" data-testid="keyword" defaultValue={decodeURIComponent(keywordValue)} type="text" placeholder="キーワード" className="border border-gray-300 bg-white h-7 px-5 pr-16 rounded-lg text-sm focus:outline-none" />
            </p>
            <p>
                <input type="date" data-testid="date" defaultValue={dateValue} name="date" max={today} className='border border-gray-300 bg-white h-7 rounded-lg text-sm focus:outline-none' />
                <input type="text" data-testid="site" defaultValue={siteValue} list="site-name" placeholder="掲載元" name='site' className='border border-gray-300 bg-white h-7 rounded-lg text-sm focus:outline-none' />
            </p>
            <p><button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold text-xs p-2 rounded whitespace-nowrap">検索</button></p>
        </form>
    )
}

export default FormContainer;