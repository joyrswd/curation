import "@testing-library/jest-dom";
import { render, screen, fireEvent } from '@testing-library/react';
import { describe } from 'node:test';
import Pagination from '@/_/components/pagination';
import { type Pagination as PaginationType } from '@/_/lib/types';

const pushMock = jest.fn();
let pathName = '';
let searchQuery = '';
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }) ,
    usePathname : () => pathName,
    useSearchParams: () => new URLSearchParams(searchQuery)
}));

const pages: PaginationType = {
    current: 2,
    last: 10,
    previous: 1,
    next: 3,
    ids: []
};

describe('Pagination', () => {

    beforeEach(() => {
        //検索関連モックをリセット
        pathName = '';
        searchQuery = '';
        pushMock.mockClear();
    })

    it('ページネーション表示の確認', async () => {
        render(<Pagination pages={pages} />);
        expect(screen.getByRole('spinbutton')).toHaveValue(2);
        expect(screen.getByTestId('last')).toHaveTextContent(10);
        expect(screen.getByTestId('previous')).toHaveAttribute('href', '?page=1');
        expect(screen.getByTestId('next')).toHaveAttribute('href', '?page=3');
    });

    it('ページネーション表示の確認（最初のページ）', async () => {
        pages.current = 1;
        pages.previous = 0;
        render(<Pagination pages={pages} />);
        expect(screen.queryByTestId('previous')).toBeNull();
    });

    it('ページネーション表示の確認（最後のページ）', async () => {
        pages.current = 10;
        pages.next = 0;
        render(<Pagination pages={pages} />);
        expect(screen.queryByTestId('next')).toBeNull();
    });

    it('ページ番号が変更された場合', async () => {
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 2 } });
        fireEvent.blur(input);
        expect(pushMock).toHaveBeenCalledWith('/?page=2');
    });

    it('form送信が行われた場合', async () => {
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 4 } });
        fireEvent.submit(input.form);
        expect(pushMock).toHaveBeenCalledWith('/?page=4');
    });

    it('他の検索項目を含んでページ番号が変更された場合', async () => {
        searchQuery = 'category=aaaa&site=sitea';
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 2 } });
        fireEvent.blur(input);
        expect(pushMock).toHaveBeenCalledWith('/?category=aaaa&site=sitea&page=2');
    });

    it('設定されたページ番号を書き換え', async () => {
        searchQuery = 'page=8';
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 4 } });
        fireEvent.blur(input);
        expect(pushMock).toHaveBeenCalledWith('/?page=4');
    });

    it('検索フレーズを含んだページ番号変更', async () => {
        pathName = '/searchKeyword';
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 4 } });
        fireEvent.blur(input);
        expect(pushMock).toHaveBeenCalledWith('/searchKeyword?page=4');
    });

    it('数字以外が入力された場合', async () => {
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 'a' } });
        fireEvent.blur(input);
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('0が入力された場合', async () => {
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 0 } });
        fireEvent.blur(input);
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('現在のページと同じ数字が入力された場合', async () => {
        pages.current = 7;
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 7 } });
        fireEvent.blur(input);
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('最終ページより大きい数字が入力された場合', async () => {
        pages.last = 10;
        const { getByRole } = render(<Pagination pages={pages} />);
        const input = getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 11 } });
        fireEvent.blur(input);
        expect(pushMock).not.toHaveBeenCalled();
    });

});