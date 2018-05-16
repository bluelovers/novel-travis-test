/**
 * Created by user on 2018/5/16/016.
 */
import Segment from 'novel-segment/lib/Segment';
import TableDict from 'novel-segment/lib/table/dict';
import * as Promise from 'bluebird';
export declare let CACHE_TIMEOUT: number;
export declare let _segmentObject: Segment;
export declare function doSegmentGlob(options: {
    pathMain: string;
    pathMain_out?: string;
    novelID: string;
    segment?: Segment;
    novel_root?: string;
    globPattern?: string[];
}): Promise<{
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
