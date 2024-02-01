import * as RssLoader from '@/_/lib/RssLoader';
import { describe } from 'node:test';

jest.mock('@/_/lib/RssLoader', () => {
  const actualModule = jest.requireActual('@/_/lib/RssLoader');
  return {
    ...actualModule,
    loadConfig: jest.fn(),
    loadFeed: jest.fn(),
  };
});

describe('loadConfig', () => {
  it('正常読込', async () => {
    const mockConfig = { foo: 'bar' };
    RssLoader.loadConfig.mockResolvedValue(mockConfig);

    const config = await RssLoader.loadConfig();
    expect(config).toEqual(mockConfig);
  });

  it('読込失敗', async () => {
    const mockError = new Error('Failed to load config');
    RssLoader.loadConfig.mockRejectedValue(mockError);

    await expect(RssLoader.loadConfig()).rejects.toThrow('Failed to load config');
  });
});

describe('isSleeping', () => {

  beforeEach(() => {
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('時間内', () => {
    jest.setSystemTime(new Date('2022-01-01 02:00:00')); // 現在の時間を2時に設定
    expect(RssLoader.isSleeping([1, 3])).toBeTruthy();
  });

  it('時間外', () => {
    jest.setSystemTime(new Date('2022-01-01 04:00:00')); // 現在の時間を4時に設定
    expect(RssLoader.isSleeping([1, 3])).toBeFalsy();
  });
});

describe('isSkip', () => {

  beforeEach(() => {
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('skip判定 true', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 0,
      skip: 'test',
    };
    expect(RssLoader.isSkip(mockConfig)).toBeTruthy();
  });

  it('インスタント実行判定 false', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 0,
    };
    expect(RssLoader.isSkip(mockConfig, true)).toBeFalsy();
  });

  it('skip判定 インスタント実行判定 true', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 0,
      skip: 'test',
    };
    expect(RssLoader.isSkip(mockConfig, true)).toBeTruthy();
  });

  it('frequency5 14分 true', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 5,
    };
    jest.setSystemTime(new Date('2022-01-01 00:14:00')); // 0:14に設定
    expect(RssLoader.isSkip(mockConfig)).toBeTruthy();
  });

  it('frequency5 14分 インスタント実行 false', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 5,
    };
    jest.setSystemTime(new Date('2022-01-01 00:14:00')); // 0:14に設定
    expect(RssLoader.isSkip(mockConfig, true)).toBeFalsy();
  });

  it('frequency5 15分 false', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 5,
    };
    jest.setSystemTime(new Date('2022-01-01 00:15:00')); // 0:15に設定
    expect(RssLoader.isSkip(mockConfig)).toBeFalsy();
  });

  it('frequency5 15分 skip判定 true', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 5,
      skip: 'test',
    };
    jest.setSystemTime(new Date('2022-01-01 00:15:00')); // 0:15に設定
    expect(RssLoader.isSkip(mockConfig, true)).toBeTruthy();
  });

  it('frequency0 59分 true', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 5,
    };
    jest.setSystemTime(new Date('2022-01-01 00:59:00')); // 0:59に設定
    expect(RssLoader.isSkip(mockConfig)).toBeTruthy();
  });

  it('frequency0 0分 false', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 5,
    };
    jest.setSystemTime(new Date('2022-01-01 00:00:00')); // 0:00に設定
    expect(RssLoader.isSkip(mockConfig)).toBeFalsy();
  });

  it('frequency6 0分 false', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 6,
    };
    jest.setSystemTime(new Date('2022-01-01 00:00:00')); // 0:00に設定
    expect(RssLoader.isSkip(mockConfig)).toBeFalsy();
  });

  it('frequency7 0分 true', () => {
    const mockConfig = {
      url: 'https://example.com/rss.xml',
      frequency: 7,
    };
    jest.setSystemTime(new Date('2022-01-01 00:00:00')); // 0:00に設定
    expect(RssLoader.isSkip(mockConfig)).toBeTruthy();
  });

});

describe('loadFeed', () => {
  it('正常読込', async () => {
    const mockFeed = { items: [] };
    RssLoader.loadFeed.mockResolvedValue(mockFeed);

    const feed = await RssLoader.loadFeed('https://example.com/rss.xml');
    expect(feed).toEqual(mockFeed);
  });

  it('読込失敗', async () => {
    const mockError = new Error('Failed to load feed');
    RssLoader.loadFeed.mockRejectedValue(mockError);

    await expect(RssLoader.loadFeed('https://example.com/rss.xml')).rejects.toThrow('Failed to load feed');
  });
});