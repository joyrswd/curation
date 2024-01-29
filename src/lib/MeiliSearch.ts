import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { MeiliSearch } from 'meilisearch';
dotenv.config();

const host = process.env.MEILI_HTTP_ADDR;
const apiKey = process.env.MEILI_MASTER_KEY;
const indexName = process.env.CURATION_INDEX_NAME;
if (!host || !apiKey || !indexName) {
  throw new Error('Environment variables are required');
}
const filterables = {'site' : 'siteName', 'date' : 'dateTimestamp', 'category':'category'};
const client = new MeiliSearch({ host, apiKey });
//client.deleteIndex(indexName);
const index = client.index(indexName);
index.updateSortableAttributes(['dateTimestamp', 'date']);
index.updateFilterableAttributes(Object.values(filterables));

type StatsType = {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldsDistribution?: Record<string, number>;
};

type Item = {
  [key: string]: any;
};

type SearchResult = Array<{
  [key: string]: any;
}>;

const parseIntro = (content: string): string => {
  // contentからHTMLタグを除去
  const regex = /<("[^"]*"|'[^']*'|[^'">])*>/g;
  const text = content.replace(regex, '');
  // urlを除去
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '');
}

const parseImage = (content: string): string => {
  const regex = /<img.*?src\s*=\s*[\"|\'](.*?)[\"|\'].*?>/g;
  const match = regex.exec(content);
  if (match && match[1]) {
    return match[1];
  }
  return '';
}

const parseKeyword = (keywords: string[]): string => {
  const result: string[] = [];
  keywords.forEach(keyword => {
    result.push(`${keyword}`);
  });
  return result.join(' ');
}

const parseFilter = (params: Item): string => {
  const filters: string[] = [];
  for (const [key, name] of Object.entries(filterables)) {
    if (params[key]) {
      const param = params[key];
      if (key === 'date') {
        const date = new Date(param);
        const timestamp = date.getTime();
        const nextdayTimestamp = timestamp + (24*60*60*1000);
        filters.push(`${name} > ${timestamp} AND ${name} < ${nextdayTimestamp}`);
      } else {
        filters.push(`${name} = "${param}"`);
      }
    }
  }
  return filters.join(' AND ');
}

const convertToDocument = (item: Item, siteTitle: string, siteUrl: string): Item => {
    // linkのURLをmd5でハッシュ化してidとする
    item.id = crypto.createHash('md5').update(item.link).digest('hex');
    item.siteName = siteTitle;
    item.siteUrl = siteUrl;
    item.category = item['dc:subject']??'';
    item.intro = parseIntro(item['content:encoded']);
    item.image = parseImage(item['content:encoded']);
    item.dateTimestamp = new Date(item.date).getTime();
    return item;
}

export default {

  upsert: async (item: Item, siteTitle: string, siteUrl: string) => {
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
  },
  stats: async () => {
    'use server'
    try {
      const stats: StatsType = await index.getStats();
      console.log(stats);
    } catch (error) {
      console.error(error);
    }
  },
  find: async (keyword?: string[], params?: URLSearchParams): Promise<SearchResult> => {
    'use server'
    try {
      const keywordString = (keyword) ? parseKeyword(keyword) : '';
      const filterString = (params) ? parseFilter(params) : '';
      const results = await index.search(keywordString, { limit: 24, sort: ['dateTimestamp:desc'], filter: [filterString] });
      return results.hits;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
};

