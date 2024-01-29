import List from '@/components/list';
import { headers } from 'next/headers'

export default async () => {
  const headersData = headers()
  const host = headersData.get('host')
  const protocol = headersData.get('x-forwarded-proto') ?? host?.startWith('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/find`;
  const response = await fetch(url);
  return response.
  console.log(response);
  //const records = await response.json();
  //return (<List records={records} />);
}
