/**
 * Created by user on 2018/5/16/016.
 */
import Segment from 'novel-segment/lib/Segment';
import Promise = require('bluebird');
export declare let DIST_NOVEL: string;
export declare let CACHE_TIMEOUT: number;
export declare let _segmentObject: Segment;
export declare const ERROR_MSG_001 = "\u6C92\u6709\u641C\u5C0B\u5230\u4EFB\u4F55\u6A94\u6848 \u8ACB\u6AA2\u67E5\u641C\u5C0B\u689D\u4EF6";
export declare const CACHE_FILE: string;
export declare type IOptions = {
    pathMain: string;
    pathMain_out?: string;
    novelID: string;
    segment?: Segment;
    novel_root?: string;
    globPattern?: string[];
    files?: string[];
    hideLog?: boolean;
    callback?(done_list: string[], file: string, index: number, length: number): any;
};
export declare function doSegmentGlob(options: IOptions): Promise<{
    ls: string[];
    done_list: string[];
    count: {
        file: number;
        changed: number;
        done: number;
    };
}>;
export declare function _doSegmentGlob(ls: string[], options: IOptions): Promise<{
    ls: string[];
    done_list: string[];
    count: {
        file: number;
        changed: number;
        done: number;
    };
}>;
export declare function _path(pathMain: any, novelID: any, novel_root?: string): string;
export declare function getSegment(segment?: Segment): Segment;
export declare function resetSegmentCache(): void;
export declare function createSegment(useCache?: boolean): Segment;
export declare function getDictMain(segment: Segment): import("novel-segment/lib/table/core").AbstractTableDictCore<any>;
export declare function runSegment(): Promise<number[]>;
