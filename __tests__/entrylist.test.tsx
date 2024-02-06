import "@testing-library/jest-dom";
import { render, screen } from '@testing-library/react';
import { describe } from 'node:test';
import { List } from '@/_/components/finder';
import { type Pagination as PaginationType } from '@/_/lib/types';

let mockPagination:PaginationType = {
    result: true,
    ids: ['test'],
    current: 2,
    last: 10,
    previous: 1,
    next: 3
};

jest.mock('@/_/components/entry', () => {
    return function Entry() {
        return <div>Entry</div>;
    };
});

jest.mock('@/_/components/pagination', () => {
    return function Pagination() {
        return <div>Pagination</div>;
    };
});

describe('List', () => {
    it('検索結果がない', async () => {
        render(<List pagination={null} />);
        expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('検索結果がある', async () => {
        render(<List pagination={mockPagination} />);
        expect(screen.getByText('Entry')).toBeInTheDocument();
    });
});
