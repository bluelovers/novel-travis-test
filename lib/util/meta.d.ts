import { IMdconfMeta } from 'node-novel-info';
export declare function get_idsSync(rootPath: string): string[];
export declare function filterIDs(rootPath: string): {
    pathMain: string;
    novelID: string;
}[];
export declare function getMdconfMeta(pathMain: string, novelID: string, reload?: boolean): IMdconfMeta;
export declare function getMdconfMetaByPath(basePath: string, reload?: boolean): IMdconfMeta;
