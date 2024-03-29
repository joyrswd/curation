import { find, List } from "@/_/components/daily";
import { Metadata } from 'next'

export function generateMetadata({ params }: { params: { date: string } }): Metadata {
  return {
    title: params.date,
  }
}

export default async function Page({ params}: { params: { date: string } }) {
  const [date, data, keywords] = await find(params.date) ?? [null,null,null];
  return <List date={date} data={data} keywords={keywords} />;
}

