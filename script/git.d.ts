/// <reference types="node" />
import { SpawnSyncReturns } from '../index';
/**
 * Created by user on 2018/5/17/017.
 */
export declare function pushGit(REPO_PATH: string, repo: string, force?: boolean): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function pullGit(REPO_PATH: string): SpawnSyncReturns<Buffer>;
export declare function fetchGit(REPO_PATH: string): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function newBranch(REPO_PATH: string, BR_NAME: string): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function currentBranchName(REPO_PATH: string): string;
export declare function deleteBranch(REPO_PATH: string, name: string, force?: boolean): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function oldBranch(REPO_PATH: string): string;
export declare function diffOrigin(REPO_PATH: string): number;
export declare function getHashHEAD(REPO_PATH: string, branch?: string): string;
export declare type IOptionsCreateGit = {
    url: string;
    targetPath: string;
    newBranchName: string;
    urlClone: string;
    NOT_DONE: any;
    on?: {
        create_before?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]): any;
        create?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]): any;
        create_after?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]): any;
    };
};
export declare function getPushUrl(url: string): string;
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
        pushUrl: string;
    };
    temp: {
        [k: string]: any;
        cp: SpawnSyncReturns<Buffer> & {
            errorCrossSpawn?: Error;
        };
    };
};
