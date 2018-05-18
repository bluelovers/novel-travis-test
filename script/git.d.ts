/// <reference types="node" />
import { SpawnSyncReturns } from '../index';
/**
 * Created by user on 2018/5/17/017.
 */
export declare function pushGit(): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function pullGit(): SpawnSyncReturns<Buffer>;
export declare function fetchGit(): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function newBranch(BR_NAME: string): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function currentBranchName(): string;
export declare function deleteBranch(name: string, force?: boolean): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function oldBranch(): string;
export declare function diffOrigin(): number;
