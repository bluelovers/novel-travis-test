/// <reference types="node" />
import { SpawnSyncReturns } from '../index';
/**
 * Created by user on 2018/5/17/017.
 */
export declare function pushGit(): SpawnSyncReturns<Buffer> & {
    errorCrossSpawn?: Error;
};
export declare function pullGit(): SpawnSyncReturns<Buffer>;
