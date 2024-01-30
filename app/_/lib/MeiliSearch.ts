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
const filterables = {'site' : 'site', 'date' : 'timestamp', 'category':'category'};
const client = new MeiliSearch({ host, apiKey });
//client.deleteIndex(indexName);
const index = client.index(indexName);
index.updateSortableAttributes(['timestamp', 'site']);
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
    const decoded = decodeURIComponent(keyword);
    result.push(`"${decoded}"`);
  });
  return result.join(' ') + " ヰ𛀀ゑヱゐ";//日本語判定用に固有文字を追加
}

const parseFilter = (params: Item): string => {
  const filters: string[] = [];
  for (const [key, name] of Object.entries(filterables)) {
    if (params[key]) {
      const param = params[key];
      if (key === 'date') {
        const date = new Date(param + ' 00:00:00');
        //日本時間にする
        const timestamp = date.getTime();
        const nextdayTimestamp = timestamp + (24*60*60*1000);
        filters.push(`${name} > ${timestamp} AND ${name} < ${nextdayTimestamp}`);
      } else {
        const value = decodeURIComponent(param);
        filters.push(`${name} = "${value}"`);
      }
    }
  }
  return filters.join(' AND ');
}

const convertToDocument = (item: Item, siteTitle: string, siteUrl: string): Item => {
    return {
      // linkのURLをmd5でハッシュ化してidとする
      id: crypto.createHash('md5').update(item.link).digest('hex'),
      title: item.title,
      link: item.link,
      date: item.date,
      intro: parseIntro(item['content:encoded']),
      image: parseImage(item['content:encoded']),
      category: item['dc:subject']??'',
      site: siteTitle,
      home: siteUrl,
      timestamp: new Date(item.date).getTime(),
    };
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
      const options: any = { limit: 24, sort: ['timestamp:desc'], attributesToSearchOn: ['title', 'intro', 'category']};
      if (filterString) {
        options.filter = [filterString];
      }
      const results = await index.search(keywordString, options);
      return results.hits;
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  sites: async (): Promise<string[]> => {
    'use server'
    try {
      const results = await index.searchForFacetValues({ facetName:'site' });
      const sites:string[] = [];
      results.facetHits.forEach((facetHit) => {
        sites.push(facetHit.value);
      });
      return sites;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
};

