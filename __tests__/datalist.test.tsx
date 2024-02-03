import "@testing-library/jest-dom";
import { render, screen } from '@testing-library/react';
import { describe } from 'node:test';
import {Container, Presentaion} from '@/_/components/datalist';


const dummyData = ['site1', 'site2', 'site3'];

jest.mock('@/_/lib/MeiliSearch', () => {return {sites: async () => dummyData};});

describe('Presentation', () => {
    it('datalist表示の確認', async () => {
        render(<Presentaion list={dummyData} id="site-name" />);
        const datalist = screen.getByRole('listbox', { hidden: true });
        expect(datalist).toBeInTheDocument();
        expect(datalist).toHaveAttribute('id', 'site-name');
        const options = screen.getAllByRole('option', { hidden: true });
        expect(options[0]).toHaveTextContent('site1');
        expect(options[1]).toHaveTextContent('site2');
        expect(options[2]).toHaveTextContent('site3');
    });
});

describe('Container', () => {
    it('datalist取得の確認', async () => {
        const {type, props} = await Container({id: 'site-name'});
        expect(type).toBe(Presentaion);
        expect(props.list).toEqual(dummyData);
    });
});
