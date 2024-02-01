import Entry from '@/_/components/entry';
import Pagination from '@/_/components/pagination';

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

export default async function Page(request: Request) {

  const pages = await getData(request?.params.slug, request?.searchParams);
  return (!pages || pages.result === false) ? (
    <div className="text-center">No results found.</div>
  ):(
    <>
      {pages.ids.map(i => <Entry id={i} key={i} />)}
      <Pagination pages={pages} />
    </>
  );
}