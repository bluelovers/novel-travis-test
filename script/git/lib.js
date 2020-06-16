"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitSetUpstream = exports.pushGit = exports.gitSetRemote = void 0;
const __1 = require("../..");
const log_1 = require("../../lib/log");
const git_1 = require("../git");
const cross_spawn_1 = require("./cross-spawn");
const init_1 = require("../init");
const util_1 = require("../../lib/util");
function gitSetRemote(REPO_PATH, remoteUrl, remoteName) {
    remoteName = remoteName || 'origin';
    log_1.default.debug(`嘗試覆寫遠端設定於 ${REPO_PATH}`);
    log_1.default.debug(`移除舊的遠端 ${remoteName}`);
    __1.crossSpawnSync('git', [
        'remote',
        'rm',
        remoteName,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    log_1.default.debug(`設定遠端 ${remoteName}`);
    return cross_spawn_1.crossSpawnSyncGit('git', [
        'remote',
        'add',
        '--no-tags',
        remoteName,
        remoteUrl,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.gitSetRemote = gitSetRemote;
function pushGit(REPO_PATH, repo, force) {
    let argv = [
        'push',
        '--progress',
        force ? '--force' : undefined,
        repo,
    ];
    argv = util_1.filterArgv(argv);
    if (init_1.NO_PUSH) {
        return null;
    }
    log_1.default.debug(`嘗試推送 ${repo}`);
    let cp = __1.crossSpawnSync('git', argv, {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    return cp;
}
exports.pushGit = pushGit;
function gitSetUpstream(REPO_PATH, remoteAndBranch, localBranch) {
    let old_name = git_1.currentBranchName(REPO_PATH);
    __1.crossSpawnSync('git', [
        'branch',
        '-u',
        remoteAndBranch,
        localBranch,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    let new_name = git_1.currentBranchName(REPO_PATH);
    if (old_name && old_name != new_name) {
        __1.crossSpawnSync('git', [
            'checkout',
            old_name,
        ], {
            stdio: 'inherit',
            cwd: REPO_PATH,
        });
    }
}
exports.gitSetUpstream = gitSetUpstream;
//# sourceMappingURL=lib.js.map