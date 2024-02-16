import { find, List } from "@/_/components/finder";
import { Metadata } from 'next'

export function generateMetadata({ params, searchParams }: { params: { slug: string[] }, searchParams: any }): Metadata {
  const meta:any = {};
  const titles:string[] = [];
  if (params?.slug) {
    titles.push(' - ' + params.slug.join(' '));
  }
  if (searchParams?.category) {
    titles.push(`<${searchParams.category}>`);
  }
  if (searchParams?.site) {
    titles.push(`~ ${searchParams.site}`);
  }
  if (searchParams?.date) {
    titles.push(`${new Date(searchParams.date).toLocaleDateString('ja-JP', {year:'numeric', month:'long', day:'numeric'})}`);
  }
  if (searchParams?.page) {
    titles.push(`(${searchParams.page})`);
  }
  if (titles.length > 0) {
    meta.title = decodeURIComponent(titles.join(' '));
  }
  return meta;
}

export default async function Page({ params, searchParams }: { params: { slug: string[] }, searchParams: any }) {
  const pagination = await find(params?.slug, searchParams);
  return <List pagination={pagination} />;
}