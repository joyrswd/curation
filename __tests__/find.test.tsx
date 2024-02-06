import "@testing-library/jest-dom";
import { describe } from 'node:test';
import { find} from '@/_/components/finder';

let mockResponse = {result: true, ids: ['test'] };
let mockStatus = 200;

global.fetch = jest.fn(() =>
  Promise.resolve(new Response(JSON.stringify(mockResponse), { status: mockStatus }))
);

describe('find', () => {
    it('検索', async () => {
        const finder = await find(['test']);
        expect(finder).not.toBeNull();
    });

    it('検索結果がない', async () => {
        mockStatus = 404;
        mockResponse = {result: false, ids: [] };
        const finder = await find(['test']);
        expect(finder).toBeNull();
    });
});