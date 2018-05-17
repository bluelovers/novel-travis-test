/**
 * Created by user on 2018/5/16/016.
 */
/// <reference types="node" />
import { SpawnOptions } from 'child_process';
import * as crossSpawn from 'cross-spawn';
import { isGitRoot } from 'git-root2';
export { isGitRoot };
export declare let DIST_NOVEL: string;
export declare function crossSpawnAsync(bin: string, argv?: string[], optiobs?: SpawnOptions): Promise<ReturnType<typeof crossSpawn.sync> & {
    errorCrossSpawn?: Error;
}>;
export declare function crossSpawnSync(bin: string, argv?: string[], optiobs?: SpawnOptions): ReturnType<typeof crossSpawn.sync> & {
    errorCrossSpawn?: Error;
};
export declare function crossSpawnOutput(buf: ReturnType<typeof crossSpawn.sync>["output"] | Buffer, options?: {
    clearEol?: boolean;
}): string;
