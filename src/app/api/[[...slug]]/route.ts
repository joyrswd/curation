import MeiliSearch from '@/lib/MeiliSearch';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { slug?: string[] }} ) {
  const { searchParams } = new URL(request.url);
  const records = await MeiliSearch.find(params?.slug, searchParams);
  return Response.json(records);
}