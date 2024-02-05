import Entry from '@/_/components/entry';
import Pagination from '@/_/components/pagination';
import { Suspense } from 'react';
import { type Pagination as PaginationType } from '@/_/lib/types';
import { AppConf } from '@/_/conf/app';

export const find = async (params?: string[], search?: Object): Promise<PaginationType | null> => {
    const data: any = search ?? {};
    data.keyword = params;
    let res = await fetch(AppConf.appHost + '/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        cache: 'no-store'
    });
    if (!res.ok) {
        return null;
    }
    const content = await res.json();
    const pagination = content as PaginationType;
    return pagination;
};

export function List({ pagination }: { pagination: PaginationType | null }) {
    return (!pagination || pagination.result === false) ? (
        <div className="text-center">No results found.</div>
    ) : (
        <>
            {pagination.ids.map((i: string) => <Entry id={i} key={i} />)}
            <Suspense>
                <Pagination pages={pagination} />
            </Suspense>
        </>
    );
}

