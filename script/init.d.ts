import { IConfig } from '@node-novel/task';
/**
 * Created by user on 2018/5/17/017.
 */
export declare let DEBUG: boolean;
export declare const PROJECT_ROOT: string;
export declare let MyConfig: {
    config: IConfig;
    filepath: string;
};
export declare let CacheConfig: {
    config: {
        last: string | number;
        last_from?: string | number;
        done?: number;
        last_push_head?: string;
    };
    filepath: string;
};
export declare let GITEE_TOKEN: string;
export declare let GITLAB_TOKEN: string;
export declare const DIST_NOVEL: string;
export declare let CLONE_DEPTH: string | number;
export declare let NOT_DONE: boolean;
export declare const BR_NAME: string;
export declare const NO_PUSH: boolean;
