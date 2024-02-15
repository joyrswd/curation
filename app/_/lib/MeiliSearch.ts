import * as crypto from 'crypto';
import { MeiliSearch } from 'meilisearch';
import sanitizeHtml from 'sanitize-html';
import { type Document, type Pagination } from './types';
import AppConf from '../conf/app';

const host = AppConf.db.host;
const apiKey = AppConf.db.key;
const indexName = AppConf.db.index;
if (!host || !apiKey || !indexName) {
  throw new Error('Environment variables are required');
}
const filterables = ['site', 'date', 'category', 'timestamp'];
const pageLimit = 24;
const client = new MeiliSearch({ host, apiKey });
const index = client.index(indexName);
index.updateSortableAttributes(['timestamp', 'site']);
index.updateFilterableAttributes(filterables);

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
  filterables.forEach((key) => {
    if (params[key]) {
      const param = params[key];
      const value = decodeURIComponent(param);
      filters.push(`${key} = "${value}"`);
    }
  });
  return filters.join(' AND ');
}

export const convertToDocument = (item: Feed, siteTitle: string, siteUrl: string): Document => {
  const pubDate = item.pubDate ?? item.date;
  return {
    // linkのURLをmd5でハッシュ化してidとする
    id: item.id,
    title: item.title,
    link: item.link,
    date: new Date(pubDate).toISOString(),
    intro: parseIntro(item['content:encoded']),
    image: parseImage(item['content:encoded']),
    category: item.category ?? item['dc:subject'] ?? '',
    site: siteTitle,
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

export const insert = async (item: any): Promise<boolean> => {
  await index.addDocuments([item as Object]).catch((err) => console.log(err));
  return true;
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

export const isNew = async (item: Feed, siteTitle: string, siteUrl: string): Promise<boolean> => {
  'use server'
  try {
    const document = convertToDocument(item, siteTitle, siteUrl);
    const newest = document.timestamp;
    const result = await index.search('', {limit: 1, filter: `site = "${siteTitle}" AND timestamp >= ${newest}` });
    return (result.hits.length === 0);
  } catch (error) {
    console.error(error);
    return false;
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

export const getAll = async (params: any, keywordString?:string): Promise<any> => {
  'use server'
  try {
    const options: any = { sort: ['timestamp:desc'], attributesToSearchOn: ['title', 'intro', 'category'] };
    Object.keys(params).forEach((key:string) => {
      options[key] = params[key];
    });
    const results = await index.search(keywordString, options);
    return results;
  } catch (error) {
    console.error(error);
    return null;
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
    const options: any = { page: current, hitsPerPage: pageLimit};
    if (filterString) {
      options.filter = [filterString];
    }
    const results = await getAll(options, keywordString);
    return convertToPagination(results);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const findDaily = async (targetDate: string): Promise<any | null> => {
  'use server'
  try {
    const filterString = parseFilter({date: targetDate});
    const options: any = { filter:filterString, limit: 1000};
    const results = await getAll(options);
    if (!results || results.hits.length === 0) {
      return null;
    }
    const nextTimestamp = results.hits[0].timestamp;
    const nextoption = { filter:`timestamp > ${nextTimestamp}` , limit: 1, sort: ['timestamp:asc']};
    const next = await getAll(nextoption);

    const previousTimestamp = results.hits[results.hits.length - 1].timestamp;
    const previousoption = { filter:`timestamp < ${previousTimestamp}` , limit: 1, sort: ['timestamp:desc']};
    const previous = await getAll(previousoption);
    
    return {
      ids: results.hits.map((hit: any) => hit.id),
      next: (next.hits.length > 0) ? next.hits[0].date : null,
      previous: (previous.hits.length > 0) ? previous.hits[0].date : null,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};


export const get = async (id: number): Promise<Document | null> => {
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

export const lastPubDate = async (): Promise<string> => {
  'use server'
  //最新のdateを取得
  const results = await index.search('', {limit:1, sort: ['timestamp:desc']});
  const item = results.hits[0];
  return item.date;
}

export const firstPubDate =  async (): Promise<string> => {
  'use server'
  //最新のdateを取得
  const results = await index.search('', {limit:1, sort: ['timestamp:asc']});
  const item = results.hits[0];
  return item.date;
}

export const deleteIndex = async (target:string) => {
  client.deleteIndexIfExists(target);
}