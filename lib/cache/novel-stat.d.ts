/**
 * Created by user on 2018/12/17/017.
 */
export interface INovelStatCache {
    novels: {
        [pathMain: string]: {
            [novelID: string]: INovelStatCacheNovel;
        };
    };
    history: {
        [date: string]: INovelStatCacheHistory;
        [date: number]: INovelStatCacheHistory;
    };
}
export interface INovelStatCacheNovel {
    segment_date?: number;
    epub_date?: number;
    volume?: number;
    chapter?: number;
    volume_old?: number;
    chapter_old?: number;
}
export interface INovelStatCacheHistory {
    epub_count?: number;
    epub?: Array<[string, string]>;
}
export interface INovelStatCacheOptions {
}
export declare class NovelStatCache {
    file: string;
    data: INovelStatCache;
    options: INovelStatCacheOptions;
    inited: boolean;
    /**
     * @deprecated
     */
    constructor(options?: INovelStatCacheOptions);
    protected open(): this;
    pathMain(pathMain: string): {
        [novelID: string]: INovelStatCacheNovel;
    };
    novel(pathMain: string, novelID: string): INovelStatCacheNovel;
    /**
     * @deprecated
     */
    _beforeSave(): this;
    save(): this;
    readonly timestamp: number;
    historyPrev(): INovelStatCacheHistory;
    historyToday(): INovelStatCacheHistory;
    static create(options?: INovelStatCacheOptions): NovelStatCache;
    toJSON(bool?: boolean): INovelStatCache;
}
export declare function getNovelStatCache(): NovelStatCache;
