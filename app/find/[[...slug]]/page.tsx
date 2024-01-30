import Entry from '@/_/components/entry';
import MeiliSearch from '@/_/lib/MeiliSearch';

export const dynamic = 'force-dynamic'

async function getData(params?: string[], search?: Object) {
  return await MeiliSearch.find(params, search);
}

export default async function Page(request: Request) {
  const records = await getData(request?.params.slug, request?.searchParams);
  return (
        <>
          {records.length === 0 && <div className="text-center">No results found.</div>}
          {records.map(record => (<Entry record={record} key={record.id}  />))}
        </>
  );
}