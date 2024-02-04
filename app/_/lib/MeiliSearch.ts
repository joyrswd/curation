import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { MeiliSearch } from 'meilisearch';
import sanitizeHtml from 'sanitize-html';
import { type Document, type Pagination } from './types';
dotenv.config();

const host = process.env.MEILI_HTTP_ADDR;
const apiKey = process.env.MEILI_MASTER_KEY;
const indexName = process.env.CURATION_INDEX_NAME;
if (!host || !apiKey || !indexName) {
  throw new Error('Environment variables are required');
}
const filterables = { 'site': 'site', 'date': 'timestamp', 'category': 'category' };
const pageLimit = 24;
const client = new MeiliSearch({ host, apiKey });
const index = client.index(indexName);
index.updateSortableAttributes(['timestamp', 'site']);
index.updateFilterableAttributes(Object.values(filterables));

export type StatsType = {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldsDistribution?: Record<string, number>;
};

export type Feed = {
  [key: string]: any;
};

export const parseIntro = (content: string): string => {
  // contentからHTMLタグを除去
  const urlText = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
  // urlを除去
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const nlText = urlText.replace(urlRegex, '');
  // 連続した改行を除去
  const text = nlText.replace(/[\n\s*\n]+/g, '\n');
  return text;
}

export const parseImage = (content: string): string => {
  const regex = /<img.*?src\s*=\s*[\"|\'](.*?)[\"|\'].*?>/g;
  const match = regex.exec(content);
  if (match && match[1]) {
    return match[1];
  }
  return '';
}

export const parseKeyword = (keywords: string[]): string => {
  const result: string[] = [];
  keywords.forEach(keyword => {
    const decoded = decodeURIComponent(keyword);
    result.push(`"${decoded}"`);
  });
  return result.join(' ') + " ヰ𛀀ゑヱゐ";//日本語判定用に固有文字を追加
}

export const parseFilter = (params: {[key: string]: any}): string => {
  const filters: string[] = [];
  for (const [key, name] of Object.entries(filterables)) {
    if (params[key]) {
      const param = params[key];
      if (key === 'date') {
        const date = new Date(param + ' 00:00:00');
        //日本時間にする
        const timestamp = date.getTime();
        const nextdayTimestamp = timestamp + (24 * 60 * 60 * 1000);
        filters.push(`${name} > ${timestamp} AND ${name} < ${nextdayTimestamp}`);
      } else {
        const value = decodeURIComponent(param);
        filters.push(`${name} = "${value}"`);
      }
    }
  }
  return filters.join(' AND ');
}

export const convertToDocument = (item: Feed, siteTitle: string, siteUrl: string): Document => {
  const pubDate = item.pubDate ?? item.date;
  return {
    // linkのURLをmd5でハッシュ化してidとする
    id: crypto.createHash('md5').update(item.link).digest('hex'),
    title: item.title,
    link: item.link,
    date: new Date(pubDate).toISOString(),
    intro: parseIntro(item['content:encoded']),
    image: parseImage(item['content:encoded']),
    category: item.category ?? item['dc:subject'] ?? '',
    site: siteTitle,
    home: siteUrl,
    timestamp: new Date(pubDate).getTime(),
  };
}

export const convertToPagination = (results: any): Pagination => {
  const current = results.page;
  const last = results.totalPages;
  return {
    result: (results.hits.length > 0),
    ids: results.hits.map((hit: any) => hit.id),
    current: current,
    previous: (current > 1) ? current - 1 : 0,
    next: (current < last) ? current + 1 : 0,
    last: last,
  };
}

export const upsert = async (item: Feed, siteTitle: string, siteUrl: string) => {
  'use server'
  if (!item.link) {
    console.error('Item link is missing');
    return;
  }
  const document = convertToDocument(item, siteTitle, siteUrl);
  try {
    await index.addDocuments([document]);
  } catch (error) {
    console.error(error);
  }
};

export const stats = async () => {
  'use server'
  try {
    const stats: StatsType = await index.getStats();
    console.log(stats);
  } catch (error) {
    console.error(error);
  }
};

export const find = async (params?: any): Promise<Pagination | null> => {
  'use server'
  try {
    const keywordString = (params?.keyword) ? parseKeyword(params.keyword) : '';
    const filterString = (params) ? parseFilter(params) : '';
    const current = (params && params['page']) ? parseInt(params['page']) : 1;
    if (isNaN(current)) {
      throw new Error('Invalid page number');
    }
    const options: any = { page: current, hitsPerPage: pageLimit, sort: ['timestamp:desc'], attributesToSearchOn: ['title', 'intro', 'category'] };
    if (filterString) {
      options.filter = [filterString];
    }
    const results = await index.search(keywordString, options);
    return convertToPagination(results);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const get = async (id: string): Promise<Document | null> => {
  'use server'
  try {
    const result = await index.getDocument(id);
    const document = result as Document;
    return document;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const sites = async (): Promise<string[]> => {
  'use server'
  try {
    const results = await index.searchForFacetValues({ facetName: 'site' });
    const sites: string[] = [];
    results.facetHits.forEach((facetHit) => {
      sites.push(facetHit.value);
    });
    return sites;
  } catch (error) {
    console.error(error);
    return [];
  }
};
