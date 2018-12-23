/**
 * Created by user on 2018/12/17/017.
 */
import moment = require('moment');
import { EnumNovelStatus } from 'node-novel-info/lib/const';
import { IMdconfMeta } from 'node-novel-info';
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
    mdconf: {
        [pathMain: string]: {
            [novelID: string]: IMdconfMeta;
        };
    };
}
export interface INovelStatCacheNovel {
    /**
     * segment 更新時間
     */
    segment_date?: number;
    /**
     * epub 更新時間
     */
    epub_date?: number;
    /**
     * 初始化時間
     */
    init_date?: number;
    /**
     * 總章/卷數量
     */
    volume?: number;
    /**
     * 總話數
     */
    chapter?: number;
    /**
     * 上次的總章/卷數量
     */
    volume_old?: number;
    /**
     * 上次的總話數
     */
    chapter_old?: number;
    /**
     * segment 變動數量
     */
    segment?: number;
    /**
     * 上次的 segment 變動數量
     */
    segment_old?: number;
    /**
     * 小說狀態 根據 readme,md 內設定
     */
    novel_status?: EnumNovelStatus;
    /**
     * 最後變動時間
     */
    update_date?: number;
    /**
     * 紀錄變動次數
     */
    update_count?: number;
    /**
     * epub filename
     */
    epub_basename?: string;
    txt_basename?: string;
}
export interface INovelStatCacheHistory {
    epub_count?: number;
    epub?: Array<[string, string, INovelStatCacheNovel?]>;
    segment_count?: number;
    segment?: Array<[string, string, INovelStatCacheNovel?]>;
}
export interface INovelStatCacheOptions {
}
export declare class NovelStatCache {
    file: string;
    file_git: string;
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
    mdconf_get(pathMain: string, novelID: string): IMdconfMeta;
    mdconf_set(pathMain: string, novelID: string, meta: IMdconfMeta): this;
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
export declare function createMoment(...argv: any[]): moment.Moment;
