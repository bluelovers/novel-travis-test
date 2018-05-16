/**
 * Created by user on 2018/5/16/016.
 */
import Segment from 'novel-segment/lib/Segment';
import TableDict from 'novel-segment/lib/table/dict';
import * as Promise from 'bluebird';
export declare let CACHE_TIMEOUT: number;
export declare let _segmentObject: Segment;
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
    count: {
        file: number;
        changed: number;
    };
}>;
export declare function _doSegmentGlob(ls: string[], options: IOptions): Promise<{
    ls: string[];
    count: {
        file: number;
        changed: number;
    };
}>;
export declare function _path(pathMain: any, novelID: any, novel_root?: string): string;
export declare function getSegment(segment?: Segment): Segment;
export declare function createSegment(useCache?: boolean): Segment;
export declare function getDictMain(segment: Segment): TableDict;
