import Entry from '@/_/components/entry';
import Pagination from '@/_/components/pagination';
import { Suspense } from 'react';
import {type Pagination as PaginationType} from '@/_/lib/types';
import {AppConf} from '@/_/conf/app';

const getData = async (params?: string[], search?: Object): Promise<PaginationType|null> => {
  const data:any = search?? {};
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

export default async function Page({ params, searchParams }: { params: { slug: string[] }, searchParams: any }) {

  const pages = await getData(params?.slug, searchParams);
  return (!pages || pages.result === false) ? (
    <div className="text-center">No results found.</div>
  ):(
    <>
      {pages.ids.map((i:string) => <Entry id={i} key={i} />)}
      <Suspense>
        <Pagination pages={pages} />
      </Suspense>
    </>
  );
}