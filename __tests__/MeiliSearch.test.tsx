import * as MeiliSearch from '@/_/lib/MeiliSearch';
import { describe } from 'node:test';
import * as crypto from 'crypto';

describe('parseIntro', () => {
  it('HTMLタグ除去', async () => {
    const input = '<p href="aaaaa">こんに<span>ちは</span></p>';
    const output = MeiliSearch.parseIntro(input);
    expect(output).toBe('こんにちは');
  });

  it('URL除去', async () => {
    const input = 'リンクを参照https://example.com';
    const output = MeiliSearch.parseIntro(input);
    expect(output).toBe('リンクを参照');
  });

  it('連続改行の除去', async () => {
    const input = 'こんにちは\n\n\nこんにちは';
    const output = MeiliSearch.parseIntro(input);
    expect(output).toBe('こんにちは\nこんにちは');
  });
  
});

describe('parseImage', () => {

  it('画像URL取得', async () => {
    const input = 'ああああああ<img src="https://example.com/image.jpg" />https://example.com/image2.jpg';
    const output = MeiliSearch.parseImage(input);
    expect(output).toBe('https://example.com/image.jpg');
  });

});

describe('parseKeyword', () => {
  const suffix = " ヰ𛀀ゑヱゐ";
  it('キーワード生成', async () => {
    const input = ['%E3%83%86%E3%82%B9%E3%83%88%E3%82%AD%E3%83%BC%E3%83%AF%E3%83%BC%E3%83%89'];
    const output = MeiliSearch.parseKeyword(input);
    expect(output).toBe('"テストキーワード"' + suffix);
  });
});

describe('parseFilter', () => {
  it('site', async () => {
    const input = {'site': '%E3%83%86%E3%82%B9%E3%83%88%E3%82%B5%E3%82%A4%E3%83%88'};
    const output = MeiliSearch.parseFilter(input);
    expect(output).toBe('site = "テストサイト"');
  });

  it('timestamp', async () => {
    const targetDate = '2022-01-01';
    const timestamp = new Date(targetDate + ' 00:00:00').getTime();
    const nextdayTimestamp = new Date('2022-01-02 00:00:00').getTime();
    const input = {'date': targetDate};
    const output = MeiliSearch.parseFilter(input);
    expect(output).toBe('timestamp > ' + timestamp + ' AND timestamp < ' + nextdayTimestamp);
  });

  it('cateory', async () => {
    const input = {'category': '%E3%83%86%E3%82%B9%E3%83%88%E3%82%AB%E3%83%86%E3%82%B4%E3%83%AA%E3%83%BC'};
    const output = MeiliSearch.parseFilter(input);
    expect(output).toBe('category = "テストカテゴリー"');
  });

  it('site & timestamp & category', async () => {
    const targetDate = '2022-01-01';
    const timestamp = new Date(targetDate + ' 00:00:00').getTime();
    const nextdayTimestamp = new Date('2022-01-02 00:00:00').getTime();
    const input = {'site': '%E3%83%86%E3%82%B9%E3%83%88%E3%82%B5%E3%82%A4%E3%83%88', 'date': targetDate, 'category': '%E3%83%86%E3%82%B9%E3%83%88%E3%82%AB%E3%83%86%E3%82%B4%E3%83%AA%E3%83%BC'};
    const output = MeiliSearch.parseFilter(input);
    expect(output).toBe('site = "テストサイト" AND timestamp > ' + timestamp + ' AND timestamp < ' + nextdayTimestamp +  ' AND category = "テストカテゴリー"');
  });

  it('不正なパラメータ', async () => {
    const input = {'invalid': '%E3%83%86%E3%82%B9%E3%83%88%E3%82%B5%E3%82%A4%E3%83%88'};
    const output = MeiliSearch.parseFilter(input);
    expect(output).toBe('');
  });

});

describe('convertToDocument', () => {
  it('正常なデータ', async () => {
    const title = 'テストサイト';
    const url = 'https://example.com';
    const input = {
      title: 'テストタイトル',
      link: 'https://example.com/id/111111',
      date: '2022-01-01T01:00:00+09:00',
      'content:encoded': 'テスト<img src="https://example.com/image.jpg" />コメント',
      'dc:subject': 'テストカテゴリー',
    };
    const output = MeiliSearch.convertToDocument(input, title, url);
    expect(output).toStrictEqual({
      id: crypto.createHash('md5').update(input.link).digest('hex'),
      title: input.title,
      link: input.link,
      date: new Date(input.date).toISOString(),
      intro: 'テストコメント',
      image: 'https://example.com/image.jpg',
      category: input['dc:subject'],
      site: title,
      home: url,
      timestamp: new Date(input.date).getTime(),
    });
  });
  it('pubDate & category', async () => {
    const title = 'テストサイト';
    const url = 'https://example.com';
    const input = {
      title: 'テストタイトル',
      link: 'https://example.com/id/111111',
      pubDate: '2022-01-01T01:00:00+09:00',
      category: 'テストカテゴリー',
    };
    const output = MeiliSearch.convertToDocument(input, title, url);
    expect(output).toMatchObject({
      category: input.category,
      date: new Date(input.pubDate).toISOString(),
      timestamp: new Date(input.pubDate).getTime(),
    });
  });
});

describe('convertToPagination', () => {
  it('正常なデータ', async () => {
    const input = {
      page: 2,
      totalPages: 10,
      hits: [{id:'aaaaaaaaa'}, {id:'bbbbbbbbb'}],
    };
    const output = MeiliSearch.convertToPagination(input);
    expect(output).toStrictEqual({
      result: true,
      ids: ['aaaaaaaaa', 'bbbbbbbbb'],
      current: input.page,
      previous: input.page - 1,
      next: input.page + 1,
      last: input.totalPages,
    });
  });

  it('最初のページ', async () => {
    const input = {
      page: 1,
      totalPages: 10,
      hits: [{id:'aaaaaaaaa'}, {id:'bbbbbbbbb'}],
    };
    const output = MeiliSearch.convertToPagination(input);
    expect(output).toStrictEqual({
      result: true,
      ids: ['aaaaaaaaa', 'bbbbbbbbb'],
      current: input.page,
      previous: 0,
      next: input.page + 1,
      last: input.totalPages,
    });
  });

  it('最後のページ', async () => {
    const input = {
      page: 10,
      totalPages: 10,
      hits: [{id:'aaaaaaaaa'}, {id:'bbbbbbbbb'}],
    };
    const output = MeiliSearch.convertToPagination(input);
    expect(output).toStrictEqual({
      result: true,
      ids: ['aaaaaaaaa', 'bbbbbbbbb'],
      current: input.page,
      previous: input.page - 1,
      next: 0,
      last: input.totalPages,
    });
  });

  it('0件', async () => {
    const input = {
      page: 0,
      totalPages: 0,
      hits: [],
    };
    const output = MeiliSearch.convertToPagination(input);
    expect(output).toStrictEqual({
      result: false,
      ids: [],
      current: 0,
      previous: 0,
      next: 0,
      last: 0,
    });
  });

});