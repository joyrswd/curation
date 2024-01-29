import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // defaults to auto
 
export async function GET() {
  const headersData = headers()
  const host = headersData.get('host')
  const protocol = headersData.get('x-forwarded-proto') ?? host?.startWith('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/find`;
  const response = await fetch(url, {cache: 'no-store'});
  const text = await response.text();
  return new Response(text,{headers: {'Content-Type': 'text/html'}});
}