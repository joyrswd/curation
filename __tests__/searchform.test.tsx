import "@testing-library/jest-dom";
import { render, screen, fireEvent } from '@testing-library/react';
import { describe } from 'node:test';
import {FormContainer, FormPresenter, parseQueryAndKeyword} from '@/_/components/searchform';

const pushMock = jest.fn();
let pathName = '';
let searchQuery = '';
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }) ,
    usePathname : () => pathName,
    useSearchParams: () => new URLSearchParams(searchQuery),
}));

describe('FormPresenter', () => {

    beforeEach(() => {
        //検索関連モックをリセット
        pathName = '';
        searchQuery = '';
    });

    it('検索フォーム表示の確認', async () => {
        render(<FormPresenter action="" />);
        expect(screen.getByTestId('keyword')).toHaveValue('');
        expect(screen.getByTestId('date')).toHaveValue('');
        expect(screen.getByTestId('site')).toHaveValue('');
    });

    it('検索フォーム入力済み表示の確認', async () => {
        searchQuery = 'date=2022-01-01&site=sitea';
        pathName = '/searchKeyword';
        render(<FormPresenter action="" />);
        expect(screen.getByTestId('keyword')).toHaveValue('searchKeyword');
        expect(screen.getByTestId('date')).toHaveValue('2022-01-01');
        expect(screen.getByTestId('site')).toHaveValue('sitea');
    });
});

describe('parseQueryAndKeyword', () => {
    it('検索フォームパーサーの確認', async () => {
        const formData = new FormData();
        formData.append('keyword', 'keyword');
        formData.append('date', '2022-01-01');
        formData.append('site', 'sitea');
        const [params, keyword] = parseQueryAndKeyword(formData);
        expect(params).toEqual({'date':'2022-01-01', 'site':'sitea'});
        expect(keyword).toEqual('keyword');
    });

    it('検索フォームパーサー空文字確認', async () => {
        const formData = new FormData();
        formData.append('keyword', '');
        formData.append('date', '');
        formData.append('site', '');
        const [params, keyword] = parseQueryAndKeyword(formData);
        expect(params).toEqual({});
        expect(keyword).toEqual('');
    });
});

describe('FormContainer', () => {
    beforeEach(() => {
        //検索関連モックをリセット
        pushMock.mockClear();
    });

    it('フォームリダイレクト確認', async () => {
        const searchForm = FormContainer();
        searchForm.props.action(new FormData());
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('フォームリダイレクト確認（キーワード・日付・サイトあり）', async () => {
        const searchForm = FormContainer();
        const formData = new FormData();
        formData.append('keyword', 'searchKeyword');
        formData.append('date', '2022-01-01');
        formData.append('site', 'sitea');
        searchForm.props.action(formData);
        expect(pushMock).toHaveBeenCalledWith('/searchKeyword?date=2022-01-01&site=sitea');
    });

    it('フォームリダイレクト確認（キーワードのみ）', async () => {
        const searchForm = FormContainer();
        const formData = new FormData();
        formData.append('keyword', 'searchKeyword');
        searchForm.props.action(formData);
        expect(pushMock).toHaveBeenCalledWith('/searchKeyword');
    });

    it('フォームリダイレクト確認（キーワードなし、日付・サイトあり）', async () => {
        const searchForm = FormContainer();
        const formData = new FormData();
        formData.append('date', '2022-01-01');
        formData.append('site', 'sitea');
        searchForm.props.action(formData);
        expect(pushMock).toHaveBeenCalledWith('/?date=2022-01-01&site=sitea');
    });   
    
});