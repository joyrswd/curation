import "@testing-library/jest-dom";
import { render, screen } from '@testing-library/react';
import { describe } from 'node:test';
import {EntryContainer, EntryPresenter} from '@/_/components/entry';
import {type Document} from '@/_/lib/types';

const dummyData = {
    id: 'testdata',
    title: 'test title',
    link: 'https://example.com/entry1',
    date:  '2021-02-01T09:00:00+09:00',
    intro: 'test intro aaaaaaa',
    image: 'https://example.com/image.jpg',
    category: 'test category',
    site: 'example',
    home: 'https://example.com',
    timestamp: 1612137600000
};

jest.mock('@/_/lib/MeiliSearch', () => {return {
    get: async () => dummyData as Document
};});

describe('Presentation', () => {
    it('entry表示の確認', async () => {
        render(<EntryPresenter record={dummyData} />);
        expect(screen.getByRole('img').getAttribute('src')).toEqual(expect.stringMatching(encodeURIComponent(dummyData.image)));
        expect(screen.getByTestId('time')).toHaveTextContent('09:00');
        expect(screen.getByTestId('link')).toHaveAttribute('href', dummyData.link);
        expect(screen.getByRole('heading')).toHaveTextContent(dummyData.title);
        expect(screen.getByTestId('intro')).toHaveAttribute('href', dummyData.link);
        expect(screen.getByTestId('intro')).toHaveTextContent(dummyData.intro);
        expect(screen.getByTestId('date')).toHaveAttribute('href', '/?date=2021-02-01');
        expect(screen.getByTestId('month')).toHaveTextContent('Feb');
        expect(screen.getByTestId('day')).toHaveTextContent('01');
        expect(screen.getByTestId('category')).toHaveAttribute('href', '/?category=' + dummyData.category);
        expect(screen.getByTestId('category')).toHaveTextContent(dummyData.category);
        expect(screen.getByTestId('site')).toHaveAttribute('href', '/?site=' + dummyData.site);
        expect(screen.getByTestId('site')).toHaveTextContent(dummyData.site);
    });

    it ('entry表示の確認（imageなし）', async () => {
        delete dummyData.image;
        render(<EntryPresenter record={dummyData} />);
        expect(screen.queryByRole('img')).toBeNull();
    });

    it ('entry表示の確認（categoryなし）', async () => {
        delete dummyData.category;
        render(<EntryPresenter record={dummyData} />);
        expect(screen.queryByTestId('category')).toBeNull();
    });

    it ('introが200文字を超える場合、表示が省略されること', async () => {
        dummyData.intro = 'a'.repeat(201);
        render(<EntryPresenter record={dummyData} />);
        expect(screen.getByTestId('intro')).toHaveTextContent('a'.repeat(200));
    });
});

describe('Container', () => {
    it('entry取得の確認', async () => {
        const {type, props} = await EntryContainer({id: 0});
        expect(type).toBe(EntryPresenter);
        expect(props.record).toEqual(dummyData);
    });
});
