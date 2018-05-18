"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const crossSpawn = require("cross-spawn");
const fs = require("fs-extra");
const gitlog2_1 = require("gitlog2");
const __1 = require("..");
const index_1 = require("../index");
const init_1 = require("./init");
/**
 * Created by user on 2018/5/17/017.
 */
function pushGit(REPO_PATH, repo, force) {
    let argv = [
        'push',
        '--progress',
        force ? '--force' : undefined,
        repo,
    ];
    argv = argv.filter(v => v);
    let cp = __1.crossSpawnSync('git', argv, {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    return cp;
}
exports.pushGit = pushGit;
function pullGit(REPO_PATH) {
    return crossSpawn.sync('git', [
        'pull',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.pullGit = pullGit;
function fetchGit(REPO_PATH) {
    return __1.crossSpawnSync('git', [
        'fetch',
        '--force',
        'origin',
        'master',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.fetchGit = fetchGit;
function newBranch(REPO_PATH, BR_NAME) {
    return __1.crossSpawnSync('git', [
        'checkout',
        '-B',
        BR_NAME,
        'origin/master',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.newBranch = newBranch;
function currentBranchName(REPO_PATH) {
    let cp = __1.crossSpawnSync('git', [
        'rev-parse',
        '--abbrev-ref',
        'HEAD',
    ], {
        cwd: REPO_PATH,
    });
    let name = index_1.crossSpawnOutput(cp.stdout);
    return name;
}
exports.currentBranchName = currentBranchName;
function deleteBranch(REPO_PATH, name, force) {
    return __1.crossSpawnSync('git', [
        'branch',
        force ? '-D' : '-d',
        name,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.deleteBranch = deleteBranch;
function oldBranch(REPO_PATH) {
    let name = currentBranchName(REPO_PATH);
    if (name.indexOf('auto/') == 0) {
        return name;
    }
    return null;
}
exports.oldBranch = oldBranch;
function diffOrigin(REPO_PATH) {
    let log = gitlog2_1.default({
        repo: REPO_PATH,
        branch: [currentBranchName(REPO_PATH), 'origin/master'].join('..'),
        number: 3,
        nameStatus: false,
    });
    console.log(log, log.length);
    return log.length;
}
exports.diffOrigin = diffOrigin;
function getHashHEAD(REPO_PATH, branch = 'HEAD') {
    return gitlog2_1.default({ repo: REPO_PATH, number: 1, branch })[0].abbrevHash;
}
exports.getHashHEAD = getHashHEAD;
function getPushUrl(url) {
    return `https://${init_1.GITEE_TOKEN ? init_1.GITEE_TOKEN : ''}${url}`;
}
exports.getPushUrl = getPushUrl;
function createGit(options) {
    let targetName = path.basename(options.targetPath);
    let targetPath = path.normalize(options.targetPath);
    let REPO_PATH = targetPath;
    let exists = fs.pathExistsSync(REPO_PATH) && index_1.isGitRoot(REPO_PATH);
    let data = {
        targetName,
        targetPath,
        newBranchName: options.newBranchName,
        exists,
        existsBranchName: exists && oldBranch(REPO_PATH) || null,
        NOT_DONE: init_1.NOT_DONE,
        url: options.url,
        urlClone: options.urlClone,
        pushUrl: getPushUrl(options.url),
    };
    let temp = {
        cp: null,
    };
    let label;
    console.log(`create git: ${targetName}`);
    if (options.on && options.on.create_before) {
        label = `--- CREATE_BEFORE ---`;
        console.log(label);
        console.time(label);
        options.on.create_before(data, temp);
        console.timeEnd(label);
    }
    label = `--- CREATE ---`;
    console.log(label);
    console.time(label);
    temp.cp = null;
    if (data.NOT_DONE && data.exists) {
        console.warn(`${targetName} already exists`);
        temp.cp = fetchGit(data.targetPath);
    }
    else if (data.exists) {
        console.warn(`${targetName} already exists`);
        temp.cp = fetchGit(data.targetPath);
    }
    else {
        temp.cp = __1.crossSpawnSync('git', [
            'clone',
            //`--depth=${CLONE_DEPTH}`,
            //'--verbose',
            //'--progress ',
            data.urlClone,
            data.targetPath,
        ], {
            stdio: 'inherit',
            cwd: init_1.PROJECT_ROOT,
        });
    }
    if (options.on && options.on.create) {
        options.on.create(data, temp);
    }
    console.timeEnd(label);
    if (options.on && options.on.create_after) {
        label = `--- CREATE_AFTER ---`;
        console.log(label);
        console.time(label);
        options.on.create_before(data, temp);
        console.timeEnd(label);
    }
    return { data, temp };
}
exports.createGit = createGit;
