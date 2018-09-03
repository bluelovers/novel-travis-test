"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const crlf_normalize_1 = require("crlf-normalize");
const crossSpawn = require("cross-spawn");
const fs = require("fs-extra");
const gitlog2_1 = require("gitlog2");
const __1 = require("..");
const index_1 = require("../index");
const moment = require("moment");
const log_1 = require("../lib/log");
const init_1 = require("./init");
exports.DATE_FORMAT = 'YYYY-MM-DD-HH-mm-ss';
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
    if (init_1.NO_PUSH) {
        return null;
    }
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
function fetchGitAll(REPO_PATH) {
    return __1.crossSpawnSync('git', [
        'fetch',
        '--all',
        '--prune',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.fetchGitAll = fetchGitAll;
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
    if (name == 'master' || !name) {
        throw new Error();
    }
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
function deleteBranchRemote(REPO_PATH, remote, name, force) {
    if (name == 'master' || !name || !remote) {
        throw new Error();
    }
    return __1.crossSpawnSync('git', [
        'push',
        remote,
        '--delete',
        name,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.deleteBranchRemote = deleteBranchRemote;
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
    log_1.default.log(log, log.length);
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
    log_1.default.info(`create git: ${targetName}`);
    if (options.on && options.on.create_before) {
        label = `--- CREATE_BEFORE ---`;
        log_1.default.info(label);
        log_1.default.time(label);
        options.on.create_before(data, temp);
        log_1.default.timeEnd(label);
    }
    label = `--- CREATE ---`;
    log_1.default.info(label);
    log_1.default.time(label);
    temp.cp = null;
    let _deleted;
    if (data.NOT_DONE && data.exists) {
        log_1.default.warn(`${targetName} already exists`);
        temp.cp = fetchGit(data.targetPath);
    }
    else if (data.exists) {
        log_1.default.warn(`${targetName} already exists`);
        log_1.default.log(`取得所有遠端分支`);
        fetchGitAll(data.targetPath);
        _deleted = gitRemoveBranchOutdate(data.targetPath);
        temp.cp = fetchGit(data.targetPath);
    }
    else {
        let CLONE_DEPTH = (options.CLONE_DEPTH || process && process.env && process.env.CLONE_DEPTH || 50);
        if (isNaN(CLONE_DEPTH) || !CLONE_DEPTH || CLONE_DEPTH <= 0) {
            CLONE_DEPTH = 50;
        }
        temp.cp = __1.crossSpawnSync('git', [
            'clone',
            `--depth=${CLONE_DEPTH}`,
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
    log_1.default.timeEnd(label);
    if (options.on && options.on.create_after) {
        label = `--- CREATE_AFTER ---`;
        log_1.default.info(label);
        log_1.default.time(label);
        options.on.create_after(data, temp);
        log_1.default.timeEnd(label);
    }
    label = `--- BEFORE_DONE ---`;
    log_1.default.info(label);
    log_1.default.time(label);
    if (_deleted) {
        gitGcAggressive(data.targetPath);
    }
    else {
        gitGc(data.targetPath);
    }
    log_1.default.timeEnd(label);
    return { data, temp };
}
exports.createGit = createGit;
function gitGc(REPO_PATH, argv) {
    argv = filterArgv([
        'gc',
    ].concat((argv && argv.length) ? argv : []));
    if (argv.length == 1) {
        argv.push('--prune="3 days"');
    }
    log_1.default.info(`優化 GIT 資料`, argv);
    return __1.crossSpawnSync('git', argv, {
        cwd: REPO_PATH,
        stdio: 'inherit',
    });
}
exports.gitGc = gitGc;
function gitGcAggressive(REPO_PATH, argv) {
    argv = filterArgv([
        'gc',
        '--aggressive',
    ].concat((argv && argv.length) ? argv : []));
    if (argv.length == 2) {
        argv.push('--prune="3 days"');
    }
    log_1.default.info(`優化 GIT 資料`, argv);
    return __1.crossSpawnSync('git', argv, {
        cwd: REPO_PATH,
        stdio: 'inherit',
    });
}
exports.gitGcAggressive = gitGcAggressive;
function branchNameToDate(br_name) {
    return moment(br_name.replace(/^.*auto\//, ''), exports.DATE_FORMAT);
}
exports.branchNameToDate = branchNameToDate;
function gitRemoveBranchOutdate(REPO_PATH) {
    log_1.default.info(`開始分析 GIT 分支`);
    let data_ret = false;
    let br_name = currentBranchName(REPO_PATH).toString().toLowerCase();
    let date_br = branchNameToDate(br_name);
    let date_now = moment();
    //console.log({br_name, date_br, date_now});
    let brs;
    brs = parseBranchGroup(gitBranchMergedList(REPO_PATH));
    if (brs) {
        log_1.default.log(`檢查並刪除已合併分支`);
        log_1.default.dir(brs, { colors: true, });
        let pre_name;
        pre_name = 'refs/heads/';
        brs.heads
            .forEach(function (value, index, array) {
            fn(value, pre_name + value);
        });
        pre_name = 'refs/remotes/';
        Object.keys(brs.remotes)
            .forEach(function (remote_name) {
            let prefix = pre_name + remote_name + '/';
            let brs_list = brs.remotes[remote_name];
            if (brs_list.length > 5) {
                brs_list = brs_list
                    .filter(function (value) {
                    let bool = /auto\//i.test(value);
                    return bool;
                })
                    .slice(0, -2);
                brs_list
                    .forEach(function (value, index, array) {
                    let bool = !/auto\//i.test(value);
                    let del_name = prefix + value;
                    fn(value, del_name, bool, true, remote_name);
                });
            }
        });
    }
    brs = parseBranchGroup(gitBranchMergedList(REPO_PATH, true));
    if (brs) {
        log_1.default.log(`檢查並刪除未合併過期分支`);
        log_1.default.dir(brs, { colors: true, });
        let pre_name;
        pre_name = 'refs/heads/';
        brs.heads
            .forEach(function (value, index, array) {
            fn(value, pre_name + value);
        });
        pre_name = 'refs/remotes/';
        Object.keys(brs.remotes)
            .forEach(function (remote_name) {
            if (remote_name == 'origin') {
                return;
            }
            let prefix = pre_name + remote_name + '/';
            let brs_list = brs.remotes[remote_name];
            if (brs_list.length > 5) {
                let max_date_unix = 0;
                brs_list = brs_list
                    .filter(function (value) {
                    let bool = /auto\//i.test(value);
                    if (bool) {
                        let d = branchNameToDate(value);
                        //console.log(d, d.unix());
                        max_date_unix = Math.max(max_date_unix, d.unix());
                    }
                    return bool;
                })
                    .slice(0, -3);
                let max_date = moment.unix(max_date_unix);
                brs_list
                    .forEach(function (value, index, array) {
                    let bool = !/^auto\//i.test(value);
                    let del_name = prefix + value;
                    fn(value, del_name, bool, true, remote_name);
                });
            }
        });
    }
    function fn(value, del_name, skip, is_remote, remote_name) {
        let value_lc = value.toLowerCase();
        if (skip) {
            log_1.default.log(`skip (1) ${del_name}`);
            return;
        }
        else if (!value || value_lc == br_name || value_lc == 'master' || value_lc == 'head') {
            log_1.default.log(`skip (2) ${del_name}`);
            return;
        }
        else if (is_remote) {
            if (!/auto\//i.test(value) || !remote_name) {
                log_1.default.log(`skip (3) ${del_name}`);
                return;
            }
            let d = moment(value.replace(/^.*auto\//, ''), exports.DATE_FORMAT);
            //console.log(d);
        }
        log_1.default.info(`try delete ${del_name}`);
        if (is_remote) {
            deleteBranchRemote(REPO_PATH, remote_name, value);
        }
        else {
            deleteBranch(REPO_PATH, value);
        }
        data_ret = true;
    }
    return data_ret;
}
exports.gitRemoveBranchOutdate = gitRemoveBranchOutdate;
function gitBranchMergedList(REPO_PATH, noMerged, BR_NAME) {
    let cp = __1.crossSpawnSync('git', filterArgv([
        'branch',
        '--format',
        '%(refname)',
        '-a',
        noMerged ? '--no-merged' : '--merged',
        BR_NAME,
    ]), {
        cwd: REPO_PATH,
    });
    if (cp.stderr && cp.stderr.length) {
        log_1.default.error(cp.stderr.toString());
        return null;
    }
    let name = index_1.crossSpawnOutput(cp.stdout);
    return name
        .split(crlf_normalize_1.LF);
}
exports.gitBranchMergedList = gitBranchMergedList;
function filterArgv(argv) {
    return argv
        .filter(v => typeof v !== 'undefined')
        .map(v => v.trim());
}
exports.filterArgv = filterArgv;
function parseBranchGroup(r) {
    if (!r || !r.length) {
        return null;
    }
    return r.sort().reduce(function (a, b) {
        if (/^refs\/remotes\/([^\/]+)\/(.+)$/.exec(b)) {
            let { $1, $2 } = RegExp;
            a.remotes[$1] = a.remotes[$1] || [];
            a.remotes[$1].push($2);
        }
        else if (/^refs\/heads\/(.+)$/.exec(b)) {
            let { $1, $2 } = RegExp;
            a.heads.push($1);
        }
        return a;
    }, {
        heads: [],
        remotes: {
            origin: [],
        },
    });
}
exports.parseBranchGroup = parseBranchGroup;
function gitCleanAll(REPO_PATH) {
    log_1.default.info(`[git:clean] Remove untracked files from the working tree`);
    return __1.crossSpawnSync('git', [
        'clean',
        '-d',
        '-fx',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.gitCleanAll = gitCleanAll;
