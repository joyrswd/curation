'use server';
import Entry from '@/_/components/entry';
import Pagination from '@/_/components/pagination';
import MeiliSearch from '@/_/lib/MeiliSearch';

async function getData(params?: string[], search?: Object) {
  return await MeiliSearch.find(params, search);
}

export default async function Page(request: Request) {
  const pages = await getData(request?.params.slug, request?.searchParams);
  return (pages === null || pages.result === false) ? (
    <div className="text-center">No results found.</div>
  ):(
    <>
      {pages && pages.result === true && (pages.items.map(record => <Entry record={record} key={record.id} />))}
      <Pagination pages={pages} />
    </>
  );
}