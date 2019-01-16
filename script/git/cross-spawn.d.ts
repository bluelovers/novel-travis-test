/**
 * Created by user on 2019/1/16/016.
 */
/// <reference types="node" />
import { SpawnSyncReturns, SpawnSyncOptions } from '../..';
/**
 * use for some git cmd
 */
export declare function crossSpawnSyncGit(bin: string, args: string[], options?: SpawnSyncOptions): SpawnSyncReturns<Buffer>;
