import novelDiffFromLog from '@node-novel/task';
import { IListNovelRow } from '@node-novel/task';
export declare function cacheDiffNovelList(data: ReturnType<typeof novelDiffFromLog>): Promise<{
    pathMain: string;
    novelID: string;
}[]>;
export declare function cacheFileList(data: IListNovelRow): Promise<string[]>;
