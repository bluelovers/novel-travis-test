/**
 * Created by user on 2018/5/15/015.
 */
import { IListFileRow, IListMainRow, IListNovelRow } from '@node-novel/task';
declare const _default: {
    cwd: string;
    task: {
        main(data: IListMainRow, name: string): void;
        novel(data: IListNovelRow, name: string): Promise<void>;
        file(data: IListFileRow, file: string): Promise<void>;
    };
};
export default _default;
