import * as ai from './ai';
import * as download from './download';
import * as tools from './tools';
export const allCommands = [
        ...Object.values(ai).flatMap(mod => Object.values(mod)),
        ...Object.values(download).flatMap(mod => Object.values(mod)),
        ...Object.values(tools).flatMap(mod => Object.values(mod))
    ];