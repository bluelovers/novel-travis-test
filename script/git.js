"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crossSpawn = require("cross-spawn");
const git_diff_from_1 = require("git-diff-from");
const __1 = require("..");
const index_1 = require("../index");
const init_1 = require("./init");
/**
 * Created by user on 2018/5/17/017.
 */
function pushGit() {
    let cp = __1.crossSpawnSync('git', [
        'push',
        '--progress',
        '--force',
        `https://${init_1.GITEE_TOKEN ? init_1.GITEE_TOKEN : ''}gitee.com/demogitee/novel.git`,
    ], {
        stdio: 'inherit',
        cwd: init_1.DIST_NOVEL,
    });
    if (cp.output) {
        let s = index_1.crossSpawnOutput(cp.output);
        if (s.indexOf('Everything up-to-date') != -1) {
            console.log(s);
        }
        else if (init_1.DEBUG) {
            console.log(s);
        }
    }
    return cp;
}
exports.pushGit = pushGit;
function pullGit() {
    return crossSpawn.sync('git', [
        'pull',
    ], {
        stdio: 'inherit',
        cwd: init_1.DIST_NOVEL,
    });
}
exports.pullGit = pullGit;
function fetchGit() {
    return __1.crossSpawnSync('git', [
        'fetch',
        'origin',
        'master',
    ], {
        stdio: 'inherit',
        cwd: init_1.DIST_NOVEL,
    });
}
exports.fetchGit = fetchGit;
function newBranch(BR_NAME) {
    return __1.crossSpawnSync('git', [
        'checkout',
        '-B',
        BR_NAME,
        'origin/master',
    ], {
        stdio: 'inherit',
        cwd: init_1.DIST_NOVEL,
    });
}
exports.newBranch = newBranch;
function currentBranchName() {
    let cp = __1.crossSpawnSync('git', [
        'rev-parse',
        '--abbrev-ref',
        'HEAD',
    ], {
        cwd: init_1.DIST_NOVEL,
    });
    let name = index_1.crossSpawnOutput(cp.stdout);
    return name;
}
exports.currentBranchName = currentBranchName;
function deleteBranch(name) {
    return __1.crossSpawnSync('git', [
        'branch',
        '-d',
        name,
    ], {
        stdio: 'inherit',
        cwd: init_1.DIST_NOVEL,
    });
}
exports.deleteBranch = deleteBranch;
function oldBranch() {
    let name = currentBranchName();
    if (name.indexOf('auto/') == 0) {
        return name;
    }
    return null;
}
exports.oldBranch = oldBranch;
function diffOrigin() {
    return git_diff_from_1.gitDiffFrom(currentBranchName(), 'origin/master', {
        cwd: init_1.DIST_NOVEL,
    });
}
exports.diffOrigin = diffOrigin;
