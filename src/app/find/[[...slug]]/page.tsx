import List from '@/components/list';
import MeiliSearch from '@/lib/MeiliSearch';

async function getData(params?: string[], search?: Object) {
  return await MeiliSearch.find(params, search);
}

export default async function Page(request:Request) {
  const records = await getData(request?.params.slug, request?.searchParams);
  return (<List records={records} />);
}
