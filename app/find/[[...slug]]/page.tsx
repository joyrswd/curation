import Entry from '@/_/components/entry';
import Pagination from '@/_/components/pagination';
import { Suspense } from 'react';

const getData = async (params?: string[], search?: Object): Promise<any> => {
  const data:any = search?? {};
  data.keyword = params;
  let res = await fetch(process.env.CURATION_APP_HOST + '/api', {
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
  let content = await res.json();
  return content;
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