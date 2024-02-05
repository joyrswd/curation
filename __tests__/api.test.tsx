/**
 * @jest-environment node
 */
import "@testing-library/jest-dom";
import { POST } from '@/api/route';
import { find } from '@/_/lib/MeiliSearch';
import { describe } from 'node:test';
import { NextResponse } from 'next/server';

jest.mock('@/_/lib/MeiliSearch');

describe('POST function', () => {
  it('passes the correct parameters to find', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue('mockParams'),
    };

    await POST(mockReq as any);

    expect(find).toHaveBeenCalledWith('mockParams');
  });

  it('returns a 404 response when find returns null', async () => {
    (find as jest.Mock).mockResolvedValue(null);

    const mockReq = {
      json: jest.fn().mockResolvedValue('mockParams'),
    };

    const response = await POST(mockReq as any);
    //404エラーが返ってくることを確認
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(404);

    
  });

  it('returns the data from find as JSON when it is not null', async () => {
    const mockData = { key: 'value' };
    (find as jest.Mock).mockResolvedValue(mockData);

    const mockReq = {
      json: jest.fn().mockResolvedValue('mockParams'),
    };

    const response = await POST(mockReq as any);

    expect(response).toBeInstanceOf(NextResponse);
    expect(await response.json()).toEqual(mockData);
  });

});