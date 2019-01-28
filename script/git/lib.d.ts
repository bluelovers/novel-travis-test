/// <reference types="node" />
export declare function gitSetRemote(REPO_PATH: string, remoteUrl: string, remoteName: string): import("cross-spawn-extra/core").SpawnSyncReturns<Buffer>;
export declare function pushGit(REPO_PATH: string, repo: string, force?: boolean): import("cross-spawn-extra/core").SpawnSyncReturns<Buffer>;
export declare function gitSetUpstream(REPO_PATH: string, remoteAndBranch: string, localBranch: string): void;
