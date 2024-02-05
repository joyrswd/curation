import { find, List } from "@/_/components/finder";

export default async function Page({ params, searchParams }: { params: { slug: string[] }, searchParams: any }) {
  const pagination = await find(params?.slug, searchParams);
  return <List pagination={pagination} />;
}