/**
 * Created by user on 2019/1/16/016.
 */
/// <reference types="node" />
import { async as crossSpawnAsync, sync as crossSpawnSync } from 'cross-spawn-extra';
import { SpawnASyncReturns, SpawnASyncReturnsPromise, ISpawnASyncError, SpawnSyncReturns, SpawnOptions, SpawnSyncOptions, CrossSpawnExtra } from 'cross-spawn-extra/core';
export declare const stripAnsi: typeof CrossSpawnExtra.stripAnsi;
export { crossSpawnAsync, crossSpawnSync };
export { SpawnASyncReturns, SpawnASyncReturnsPromise, SpawnSyncReturns, SpawnOptions, SpawnSyncOptions, ISpawnASyncError };
export declare function getCrossSpawnError<T extends SpawnASyncReturns>(cp: T | any): ISpawnASyncError<T>;
export declare function crossSpawnOutput(buf: SpawnSyncReturns["output"] | Buffer, options?: {
    clearEol?: boolean;
}): string;
