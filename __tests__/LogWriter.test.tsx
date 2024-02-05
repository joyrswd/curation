import * as Log from '@/_/lib/LogWriter';
import { describe } from 'node:test';
import { AppConf } from '@/_/conf/app';
import fs from 'fs';

describe('getLogPath', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('ログパス', () => {
        const path = Log.getLogPath('test');
        expect(path).toBe(AppConf.logDir + '/test.log');
    });

    it('ログパス 日次', () => {
        jest.useFakeTimers().setSystemTime(new Date('2022-01-01 02:00:00'));
        const path = Log.getLogPath('test', 'd');
        expect(path).toBe(AppConf.logDir + '/test_20220101.log');        
    });

    it('ログパス 月次', () => {
        jest.setSystemTime(new Date('2022-01-01 02:00:00'));
        const path = Log.getLogPath('test', 'm');
        expect(path).toBe(AppConf.logDir + '/test_202201.log');        
    });

    it('ログパス 年次', () => {
        jest.setSystemTime(new Date('2022-01-01 02:00:00'));
        const path = Log.getLogPath('test', 'y');
        expect(path).toBe(AppConf.logDir + '/test_2022.log');        
    });
});

describe('formatMessage', () => {
    beforeEach(() => {
        jest.useFakeTimers('modern');
    });

    afterEach(() => {
        jest.useRealTimers();
    });
    it('メッセージフォーマット', () => {
        jest.setSystemTime(new Date('2022-01-01 02:00:00'));
        const message = Log.formatMessage('test message');
        expect(message).toBe(`2021-12-31T17:00:00.000Z test message\n`);
    });
});

describe('log', () => {
    const testPath = AppConf.logDir + '/test.log';
    beforeEach(() => {
        jest.useFakeTimers('modern');
    });

    afterEach(() => {
        if (fs.existsSync(testPath)) {
            fs.unlinkSync(testPath);
        }
        jest.useRealTimers();
    });
    it('ファイル出力確認', () => {
        jest.setSystemTime(new Date('2022-01-01 02:00:00'));
        Log.log('test', 'test message');
        expect(fs.existsSync(testPath)).toBeTruthy();
    });

    it('ファイル内容確認', () => {
        jest.setSystemTime(new Date('2022-01-01 02:00:00'));
        Log.log('test', 'test message');
        const log = fs.readFileSync(testPath, 'utf-8');
        expect(log).toBe(`2021-12-31T17:00:00.000Z test message\n`);
    });

    it('ファイル追記確認', () => {
        jest.setSystemTime(new Date('2022-01-01 02:00:00'));
        Log.log('test', 'test message');
        Log.log('test', 'test message2');
        const log = fs.readFileSync(testPath, 'utf-8');
        expect(log).toBe(`2021-12-31T17:00:00.000Z test message\n2021-12-31T17:00:00.000Z test message2\n`);
    });
});
