import fs from 'fs';
import {AppConf} from '../conf/app';

const dir = AppConf.logDir;

type Rotation = 'd' | 'm' | 'y' | null;

export const getLogPath = (filename:string, rotation:Rotation) => {
    const date = new Date();
    let suffix = '';
    switch (rotation) {
        case 'd':
            suffix = '_' + date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '');
            break;
        case 'm':
            suffix = '_' + date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit' }).replace(/\//g, '');
            break;
        case 'y':
            suffix = '_' + date.toLocaleString('en-US', { year: 'numeric' });
            break;
    }
    const name = `${dir}/${filename}${suffix}.log`;
    return name;
}

export const formatMessage = (message:string) => {
    const date = new Date();
    const timestamp = date.toISOString();
    return `${timestamp} ${message}\n`;
}

export const log = (filename:string, message:string, rotation:Rotation = null) => {
    const path = getLogPath(filename, rotation);
    const contents = formatMessage(message);
    fs.writeFileSync(path, contents, { flag: 'a' });
}

export default log;