/// <reference types="node" />
import moment = require('moment');
import { SpawnSyncReturns } from '..';
export * from './git/lib';
export declare const DATE_FORMAT = "YYYY-MM-DD-HH-mm-ss";
/**
 * Created by user on 2018/5/17/017.
 */
export declare function pushGit(REPO_PATH: string, repo: string, force?: boolean, upstream?: boolean): SpawnSyncReturns<Buffer>;
export declare function pullGit(REPO_PATH: string): SpawnSyncReturns<Buffer>;
export declare function fetchGit(REPO_PATH: string, remote?: string): SpawnSyncReturns<Buffer>;
export declare function fetchGitAll(REPO_PATH: string): SpawnSyncReturns<Buffer>;
export declare function newBranch(REPO_PATH: string, BR_NAME: string): SpawnSyncReturns<Buffer>;
export declare function currentBranchName(REPO_PATH: string): string;
export declare function deleteBranch(REPO_PATH: string, name: string, force?: boolean): SpawnSyncReturns<Buffer>;
/**
 * @FIXME 不知道為什麼沒有刪除 所以多做一次另外一種刪除步驟
 */
export declare function deleteBranchRemote(REPO_PATH: string, remote: string, name: string, force?: boolean): void;
export declare function oldBranch(REPO_PATH: string): string;
export declare function diffOrigin(REPO_PATH: string): number;
export declare function getHashHEAD(REPO_PATH: string, branch?: string): string;
export declare type IOptionsCreateGit = {
    url: string;
    targetPath: string;
    newBranchName: string;
    urlClone?: string;
    urlPush?: string;
    NOT_DONE: any;
    CLONE_DEPTH?: number;
    LOGIN_TOKEN?: string;
    on?: {
        create_before?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]): any;
        create?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]): any;
        create_after?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]): any;
    };
};
export declare function getPushUrl(url: string, login_token?: string): string;
export declare function getPushUrlGitee(url: string, login_token?: string): string;
export declare function gitCheckRemote(REPO_PATH: string, remote?: string): SpawnSyncReturns<Buffer>;
export declare function createGit(options: IOptionsCreateGit): {
    data: {
        targetName: string;
        targetPath: string;
        newBranchName: string;
        exists: boolean;
        existsBranchName: string;
        NOT_DONE: boolean;
        url: string;
        urlClone: string;
        LOGIN_TOKEN: string;
        pushUrl: string;
    };
    temp: {
        [k: string]: any;
        cp: SpawnSyncReturns<Buffer>;
    };
};
export declare function gitGc(REPO_PATH: string, argv?: string[]): SpawnSyncReturns<Buffer>;
export declare function gitGcAggressive(REPO_PATH: string, argv?: string[]): SpawnSyncReturns<Buffer>;
export declare function branchNameToDate(br_name: string): moment.Moment;
export declare function gitRemoveBranchOutdate(REPO_PATH: string): boolean;
export declare function gitBranchMergedList(REPO_PATH: string, noMerged?: boolean, BR_NAME?: string): string[];
export declare function parseBranchGroup(r: string[]): {
    heads: string[];
    remotes: {
        origin: string[];
        [k: string]: string[];
    };
};
export declare function gitCleanAll(REPO_PATH: string): SpawnSyncReturns<Buffer>;
