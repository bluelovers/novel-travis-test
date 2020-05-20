"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitCleanAll = exports.parseBranchGroup = exports.gitBranchMergedList = exports.gitRemoveBranchOutdate = exports.gitGcAggressive = exports.gitGc = exports.createGit = exports.gitCheckRemote = exports.getHashHEAD = exports.diffOrigin = exports.oldBranch = exports.deleteBranchRemote = exports.deleteBranch = exports.currentBranchName = exports.newBranch = exports.fetchGitAll = exports.fetchGit = exports.pullGit = exports.DATE_FORMAT = void 0;
const fs = require("fs-extra");
const moment = require("moment");
const path = require("upath2");
const crlf_normalize_1 = require("crlf-normalize");
const gitlog2_1 = require("gitlog2");
const __1 = require("..");
const index_1 = require("../index");
const log_1 = require("../lib/log");
const share_1 = require("../lib/share");
const util_1 = require("../lib/util");
const cross_spawn_1 = require("./git/cross-spawn");
const lib_1 = require("./git/lib");
const util_2 = require("./git/util");
const init_1 = require("./init");
__exportStar(require("./git/lib"), exports);
__exportStar(require("./git/util"), exports);
exports.DATE_FORMAT = 'YYYY-MM-DD-HH-mm-ss';
function pullGit(REPO_PATH) {
    return __1.crossSpawnSync('git', [
        'pull',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.pullGit = pullGit;
function fetchGit(REPO_PATH, remote) {
    return cross_spawn_1.crossSpawnSyncGit('git', [
        'fetch',
        '--force',
        remote || 'origin',
        'master',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.fetchGit = fetchGit;
function fetchGitAll(REPO_PATH) {
    return cross_spawn_1.crossSpawnSyncGit('git', [
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
    log_1.default.debug(`嘗試建立新分支 ${BR_NAME}`);
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
    log_1.default.debug(`嘗試刪除本地分支 ${name}`);
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
/**
 * @FIXME 不知道為什麼沒有刪除 所以多做一次另外一種刪除步驟
 */
function deleteBranchRemote(REPO_PATH, remote, name, force) {
    if (name == 'master' || !name || !remote) {
        throw new Error();
    }
    log_1.default.debug(`嘗試刪除遠端分支 ${name}`);
    __1.crossSpawnSync('git', [
        'push',
        remote,
        '--delete',
        name,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    /**
     * 不知道為什麼沒有刪除 所以多做一次另外一種刪除步驟
     * https://zlargon.gitbooks.io/git-tutorial/content/remote/delete_branch.html
     */
    __1.crossSpawnSync('git', [
        'push',
        remote,
        ':' + name,
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
function gitCheckRemote(REPO_PATH, remote) {
    return cross_spawn_1.crossSpawnSyncGit('git', [
        'ls-remote',
        '--exit-code',
        '--heads',
        '--quiet',
        (remote || 'origin'),
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.gitCheckRemote = gitCheckRemote;
function createGit(options) {
    const wait_create_git = share_1.shareStates(share_1.EnumShareStates.WAIT_CREATE_GIT);
    wait_create_git.ensure();
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
        LOGIN_TOKEN: options.LOGIN_TOKEN,
        pushUrl: options.urlPush || util_2.getPushUrl(options.url, options.LOGIN_TOKEN),
    };
    let urlClone = data.urlClone;
    if (!urlClone) {
        log_1.default.red(`urlClone 不存在 嘗試自動生成`);
        if (data.LOGIN_TOKEN) {
            log_1.default.debug(`使用 LOGIN_TOKEN 自動生成 urlClone`);
            urlClone = util_2.getPushUrl(data.url, data.LOGIN_TOKEN);
        }
        else {
            log_1.default.debug(`使用 url 自動生成 urlClone`);
            urlClone = util_2.getPushUrl(data.url);
        }
    }
    let temp = {
        cp: null,
    };
    let _cp_error;
    let label;
    label = `--- CONFIG ---`;
    log_1.default.info(label);
    log_1.default.time(label);
    lib_1.gitSetRemote(data.targetPath, urlClone, 'origin');
    lib_1.gitSetRemote(data.targetPath, data.pushUrl, 'origin-push');
    log_1.default.timeEnd(label);
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
    temp.cp = gitCheckRemote(data.targetPath, urlClone);
    _cp_error = index_1.getCrossSpawnError(temp.cp);
    if (_cp_error) {
        throw _cp_error;
    }
    let _deleted;
    if (data.NOT_DONE && data.exists) {
        log_1.default.warn(`${targetName} already exists`);
        temp.cp = fetchGit(data.targetPath, urlClone);
    }
    else if (data.exists) {
        log_1.default.warn(`${targetName} already exists`);
        log_1.default.info(`取得所有遠端分支`);
        fetchGitAll(data.targetPath);
        _deleted = gitRemoveBranchOutdate(data.targetPath);
        temp.cp = fetchGit(data.targetPath, urlClone);
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
            urlClone,
            data.targetPath,
        ], {
            stdio: 'inherit',
            cwd: init_1.PROJECT_ROOT,
        });
    }
    _cp_error = index_1.getCrossSpawnError(temp.cp);
    if (_cp_error) {
        throw _cp_error;
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
    label = `--- REMOVE_WAIT ---`;
    log_1.default.info(label);
    log_1.default.time(label);
    wait_create_git.remove();
    log_1.default.timeEnd(label);
    return { data, temp };
}
exports.createGit = createGit;
function gitGc(REPO_PATH, argv) {
    argv = util_1.filterArgv([
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
    argv = util_1.filterArgv([
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
function gitRemoveBranchOutdate(REPO_PATH) {
    log_1.default.info(`開始分析 GIT 分支`);
    let data_ret = false;
    let br_name = currentBranchName(REPO_PATH).toString().toLowerCase();
    let date_br = util_2.branchNameToDate(br_name);
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
                        let d = util_2.branchNameToDate(value);
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
            //deleteBranchRemote(REPO_PATH, remote_name, value);
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
    let cp = __1.crossSpawnSync('git', util_1.filterArgv([
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBZ0M7QUFDaEMsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQyxtREFBb0M7QUFDcEMscUNBQTZCO0FBQzdCLDBCQUFzRDtBQUN0RCxvQ0FBNkY7QUFDN0Ysb0NBQWlDO0FBQ2pDLHdDQUE0RDtBQUM1RCxzQ0FBeUM7QUFDekMsbURBQXNEO0FBQ3RELG1DQUF5QztBQUV6QyxxQ0FBMkU7QUFFM0UsaUNBQXlEO0FBRXpELDRDQUEwQjtBQUMxQiw2Q0FBMkI7QUFFZCxRQUFBLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQztBQUVqRCxTQUFnQixPQUFPLENBQUMsU0FBaUI7SUFFeEMsT0FBTyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM1QixNQUFNO0tBQ04sRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVJELDBCQVFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLFNBQWlCLEVBQUUsTUFBZTtJQUUxRCxPQUFPLCtCQUFpQixDQUFDLEtBQUssRUFBRTtRQUMvQixPQUFPO1FBQ1AsU0FBUztRQUNULE1BQU0sSUFBSSxRQUFRO1FBQ2xCLFFBQVE7S0FDUixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBWEQsNEJBV0M7QUFFRCxTQUFnQixXQUFXLENBQUMsU0FBaUI7SUFFNUMsT0FBTywrQkFBaUIsQ0FBQyxLQUFLLEVBQUU7UUFDL0IsT0FBTztRQUNQLE9BQU87UUFDUCxTQUFTO0tBQ1QsRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVZELGtDQVVDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLFNBQWlCLEVBQUUsT0FBZTtJQUUzRCxhQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUVwQyxPQUFPLGtCQUFjLENBQUMsS0FBSyxFQUFFO1FBQzVCLFVBQVU7UUFDVixJQUFJO1FBQ0osT0FBTztRQUNQLGVBQWU7S0FDZixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBYkQsOEJBYUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxTQUFpQjtJQUVsRCxJQUFJLEVBQUUsR0FBRyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM5QixXQUFXO1FBQ1gsY0FBYztRQUNkLE1BQU07S0FDTixFQUFFO1FBQ0YsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7SUFFSCxJQUFJLElBQUksR0FBRyx3QkFBZ0IsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdkMsT0FBTyxJQUFJLENBQUM7QUFDYixDQUFDO0FBYkQsOENBYUM7QUFFRCxTQUFnQixZQUFZLENBQUMsU0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBZTtJQUU1RSxJQUFJLElBQUksSUFBSSxRQUFRLElBQUksQ0FBQyxJQUFJLEVBQzdCO1FBQ0MsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO0tBQ2xCO0lBRUQsYUFBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDLENBQUM7SUFFbEMsT0FBTyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM1QixRQUFRO1FBQ1IsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDbkIsSUFBSTtLQUNKLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUFqQkQsb0NBaUJDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxTQUFpQixFQUFFLE1BQWMsRUFBRSxJQUFZLEVBQUUsS0FBZTtJQUVsRyxJQUFJLElBQUksSUFBSSxRQUFRLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ3hDO1FBQ0MsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO0tBQ2xCO0lBRUQsYUFBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDLENBQUM7SUFFbEMsa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDckIsTUFBTTtRQUNOLE1BQU07UUFDTixVQUFVO1FBQ1YsSUFBSTtLQUNKLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztJQUVIOzs7T0FHRztJQUNILGtCQUFjLENBQUMsS0FBSyxFQUFFO1FBQ3JCLE1BQU07UUFDTixNQUFNO1FBQ04sR0FBRyxHQUFHLElBQUk7S0FDVixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBL0JELGdEQStCQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxTQUFpQjtJQUUxQyxJQUFJLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUV4QyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUM5QjtRQUNDLE9BQU8sSUFBSSxDQUFDO0tBQ1o7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUFWRCw4QkFVQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxTQUFpQjtJQUUzQyxJQUFJLEdBQUcsR0FBRyxpQkFBTSxDQUFDO1FBQ2hCLElBQUksRUFBRSxTQUFTO1FBQ2YsTUFBTSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsRSxNQUFNLEVBQUUsQ0FBQztRQUNULFVBQVUsRUFBRSxLQUFLO0tBQ2pCLENBQUMsQ0FBQztJQUVILGFBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDbkIsQ0FBQztBQVpELGdDQVlDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLFNBQWlCLEVBQUUsU0FBaUIsTUFBTTtJQUVyRSxPQUFPLGlCQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7QUFDckUsQ0FBQztBQUhELGtDQUdDO0FBMEJELFNBQWdCLGNBQWMsQ0FBQyxTQUFpQixFQUFFLE1BQWU7SUFFaEUsT0FBTywrQkFBaUIsQ0FBQyxLQUFLLEVBQUU7UUFDL0IsV0FBVztRQUNYLGFBQWE7UUFDYixTQUFTO1FBQ1QsU0FBUztRQUNULENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQztLQUNwQixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBWkQsd0NBWUM7QUFFRCxTQUFnQixTQUFTLENBQUMsT0FBMEI7SUFFbkQsTUFBTSxlQUFlLEdBQUcsbUJBQVcsQ0FBQyx1QkFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBRXJFLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUV6QixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUVwRCxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUM7SUFFM0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRWxFLElBQUksSUFBSSxHQUFHO1FBQ1YsVUFBVTtRQUNWLFVBQVU7UUFFVixhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWE7UUFFcEMsTUFBTTtRQUNOLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSTtRQUV4RCxRQUFRLEVBQVIsZUFBUTtRQUVSLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRztRQUNoQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7UUFFMUIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1FBRWhDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLGlCQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDO0tBQ3hFLENBQUM7SUFFRixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBRTdCLElBQUksQ0FBQyxRQUFRLEVBQ2I7UUFDQyxhQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFFbkMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUNwQjtZQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUM5QyxRQUFRLEdBQUcsaUJBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNsRDthQUVEO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3RDLFFBQVEsR0FBRyxpQkFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNoQztLQUNEO0lBRUQsSUFBSSxJQUFJLEdBSUo7UUFDSCxFQUFFLEVBQUUsSUFBSTtLQUNSLENBQUM7SUFFRixJQUFJLFNBQTJCLENBQUM7SUFFaEMsSUFBSSxLQUFhLENBQUM7SUFFbEIsS0FBSyxHQUFHLGdCQUFnQixDQUFDO0lBRXpCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVwQixrQkFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xELGtCQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTNELGFBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFdkIsYUFBTyxDQUFDLElBQUksQ0FBQyxlQUFlLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFMUMsSUFBSSxPQUFPLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUMxQztRQUNDLEtBQUssR0FBRyx1QkFBdUIsQ0FBQztRQUNoQyxhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JDLGFBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdkI7SUFFRCxLQUFLLEdBQUcsZ0JBQWdCLENBQUM7SUFDekIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQixhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXBCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBRWYsSUFBSSxDQUFDLEVBQUUsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVwRCxTQUFTLEdBQUcsMEJBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRXhDLElBQUksU0FBUyxFQUNiO1FBQ0MsTUFBTSxTQUFTLENBQUE7S0FDZjtJQUVELElBQUksUUFBaUIsQ0FBQztJQUV0QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDaEM7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxpQkFBaUIsQ0FBQyxDQUFDO1FBRTdDLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDOUM7U0FDSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsaUJBQWlCLENBQUMsQ0FBQztRQUU3QyxhQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFN0IsUUFBUSxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVuRCxJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQzlDO1NBRUQ7UUFDQyxJQUFJLFdBQVcsR0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFXLENBQUM7UUFFckgsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxJQUFJLENBQUMsRUFDMUQ7WUFDQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1NBQ2pCO1FBRUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxrQkFBYyxDQUFDLEtBQUssRUFBRTtZQUMvQixPQUFPO1lBQ1AsV0FBVyxXQUFXLEVBQUU7WUFDeEIsY0FBYztZQUNkLGdCQUFnQjtZQUNoQixRQUFRO1lBQ1IsSUFBSSxDQUFDLFVBQVU7U0FDZixFQUFFO1lBQ0YsS0FBSyxFQUFFLFNBQVM7WUFDaEIsR0FBRyxFQUFFLG1CQUFZO1NBQ2pCLENBQUMsQ0FBQztLQUNIO0lBRUQsU0FBUyxHQUFHLDBCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUV4QyxJQUFJLFNBQVMsRUFDYjtRQUNDLE1BQU0sU0FBUyxDQUFBO0tBQ2Y7SUFFRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQ25DO1FBQ0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzlCO0lBRUQsYUFBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV2QixJQUFJLE9BQU8sQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQ3pDO1FBQ0MsS0FBSyxHQUFHLHNCQUFzQixDQUFDO1FBQy9CLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQixPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsYUFBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN2QjtJQUVELEtBQUssR0FBRyxxQkFBcUIsQ0FBQztJQUM5QixhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFcEIsSUFBSSxRQUFRLEVBQ1o7UUFDQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ2pDO1NBRUQ7UUFDQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3ZCO0lBRUQsYUFBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV2QixLQUFLLEdBQUcscUJBQXFCLENBQUM7SUFDOUIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQixhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXBCLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUV6QixhQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXZCLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUE7QUFDdEIsQ0FBQztBQTFMRCw4QkEwTEM7QUFFRCxTQUFnQixLQUFLLENBQUMsU0FBaUIsRUFBRSxJQUFlO0lBRXZELElBQUksR0FBRyxpQkFBVSxDQUFDO1FBQ2pCLElBQUk7S0FDSixDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU3QyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUNwQjtRQUNDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUM5QjtJQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRWhDLE9BQU8sa0JBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ2xDLEdBQUcsRUFBRSxTQUFTO1FBQ2QsS0FBSyxFQUFFLFNBQVM7S0FDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpCRCxzQkFpQkM7QUFFRCxTQUFnQixlQUFlLENBQUMsU0FBaUIsRUFBRSxJQUFlO0lBRWpFLElBQUksR0FBRyxpQkFBVSxDQUFDO1FBQ2pCLElBQUk7UUFDSixjQUFjO0tBQ2QsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFN0MsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDcEI7UUFDQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7S0FDOUI7SUFFRCxhQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVoQyxPQUFPLGtCQUFjLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNsQyxHQUFHLEVBQUUsU0FBUztRQUNkLEtBQUssRUFBRSxTQUFTO0tBQ2hCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFsQkQsMENBa0JDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsU0FBaUI7SUFFdkQsYUFBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUU1QixJQUFJLFFBQVEsR0FBWSxLQUFLLENBQUM7SUFFOUIsSUFBSSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFFcEUsSUFBSSxPQUFPLEdBQUcsdUJBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsSUFBSSxRQUFRLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFFeEIsNENBQTRDO0lBRTVDLElBQUksR0FBd0MsQ0FBQztJQUU3QyxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUV2RCxJQUFJLEdBQUcsRUFDUDtRQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUVwQyxJQUFJLFFBQWdCLENBQUM7UUFFckIsUUFBUSxHQUFHLGFBQWEsQ0FBQztRQUV6QixHQUFHLENBQUMsS0FBSzthQUNQLE9BQU8sQ0FBQyxVQUFVLEtBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSztZQUU3QyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FDRjtRQUVELFFBQVEsR0FBRyxlQUFlLENBQUM7UUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO2FBQ3RCLE9BQU8sQ0FBQyxVQUFVLFdBQVc7WUFFN0IsSUFBSSxNQUFNLEdBQUcsUUFBUSxHQUFHLFdBQVcsR0FBRyxHQUFHLENBQUM7WUFFMUMsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUV4QyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN2QjtnQkFDQyxRQUFRLEdBQUcsUUFBUTtxQkFDakIsTUFBTSxDQUFDLFVBQVUsS0FBSztvQkFFdEIsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFFakMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDO3FCQUNELEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDYjtnQkFFRCxRQUFRO3FCQUNOLE9BQU8sQ0FBQyxVQUFVLEtBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSztvQkFFN0MsSUFBSSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNsQyxJQUFJLFFBQVEsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDO29CQUU5QixFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM5QyxDQUFDLENBQUMsQ0FDRjthQUNEO1FBQ0YsQ0FBQyxDQUFDLENBQ0Y7S0FDRDtJQUVELEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU3RCxJQUFJLEdBQUcsRUFDUDtRQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDNUIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUVwQyxJQUFJLFFBQWdCLENBQUM7UUFFckIsUUFBUSxHQUFHLGFBQWEsQ0FBQztRQUV6QixHQUFHLENBQUMsS0FBSzthQUNQLE9BQU8sQ0FBQyxVQUFVLEtBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSztZQUU3QyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FDRjtRQUVELFFBQVEsR0FBRyxlQUFlLENBQUM7UUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO2FBQ3RCLE9BQU8sQ0FBQyxVQUFVLFdBQVc7WUFFN0IsSUFBSSxXQUFXLElBQUksUUFBUSxFQUMzQjtnQkFDQyxPQUFPO2FBQ1A7WUFFRCxJQUFJLE1BQU0sR0FBRyxRQUFRLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUUxQyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXhDLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3ZCO2dCQUNDLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFFdEIsUUFBUSxHQUFHLFFBQVE7cUJBQ2pCLE1BQU0sQ0FBQyxVQUFVLEtBQUs7b0JBRXRCLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBRWpDLElBQUksSUFBSSxFQUNSO3dCQUNDLElBQUksQ0FBQyxHQUFHLHVCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUVoQywyQkFBMkI7d0JBRTNCLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztxQkFDbEQ7b0JBRUQsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDO3FCQUNELEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDYjtnQkFFRCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUUxQyxRQUFRO3FCQUNOLE9BQU8sQ0FBQyxVQUFVLEtBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSztvQkFFN0MsSUFBSSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQyxJQUFJLFFBQVEsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDO29CQUU5QixFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM5QyxDQUFDLENBQUMsQ0FDRjthQUNEO1FBQ0YsQ0FBQyxDQUFDLENBQ0Y7S0FDRDtJQUVELFNBQVMsRUFBRSxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLElBQWMsRUFBRSxTQUFtQixFQUFFLFdBQW9CO1FBRXJHLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVuQyxJQUFJLElBQUksRUFDUjtZQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE9BQU87U0FDUDthQUNJLElBQUksQ0FBQyxLQUFLLElBQUksUUFBUSxJQUFJLE9BQU8sSUFBSSxRQUFRLElBQUksUUFBUSxJQUFJLFFBQVEsSUFBSSxNQUFNLEVBQ3BGO1lBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEMsT0FBTztTQUNQO2FBQ0ksSUFBSSxTQUFTLEVBQ2xCO1lBQ0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQzFDO2dCQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNwQyxPQUFPO2FBQ1A7WUFFRCxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsbUJBQVcsQ0FBQyxDQUFDO1lBRTVELGlCQUFpQjtTQUNqQjtRQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLElBQUksU0FBUyxFQUNiO1lBQ0Msb0RBQW9EO1NBQ3BEO2FBRUQ7WUFDQyxZQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9CO1FBRUQsUUFBUSxHQUFHLElBQUksQ0FBQztJQUNqQixDQUFDO0lBRUQsT0FBTyxRQUFRLENBQUM7QUFDakIsQ0FBQztBQXJMRCx3REFxTEM7QUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLFFBQWtCLEVBQUUsT0FBZ0I7SUFFMUYsSUFBSSxFQUFFLEdBQUcsa0JBQWMsQ0FBQyxLQUFLLEVBQUUsaUJBQVUsQ0FBQztRQUN6QyxRQUFRO1FBQ1IsVUFBVTtRQUNWLFlBQVk7UUFDWixJQUFJO1FBQ0osUUFBUSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFVBQVU7UUFDckMsT0FBTztLQUNQLENBQUMsRUFBRTtRQUNILEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUNqQztRQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRXBDLE9BQU8sSUFBSSxDQUFBO0tBQ1g7SUFFRCxJQUFJLElBQUksR0FBRyx3QkFBZ0IsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdkMsT0FBTyxJQUFJO1NBQ1QsS0FBSyxDQUFDLG1CQUFFLENBQUMsQ0FDVDtBQUNILENBQUM7QUF6QkQsa0RBeUJDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsQ0FBVztJQVEzQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFDbkI7UUFDQyxPQUFPLElBQUksQ0FBQztLQUNaO0lBRUQsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFFcEMsSUFBSSxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQzdDO1lBQ0MsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUM7WUFDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN2QjthQUNJLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUN0QztZQUNDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsTUFBTSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pCO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDLEVBQUU7UUFDRixLQUFLLEVBQUUsRUFBRTtRQUNULE9BQU8sRUFBRTtZQUNSLE1BQU0sRUFBRSxFQUFFO1NBQ1Y7S0FDRCxDQUFDLENBQUE7QUFDSCxDQUFDO0FBbENELDRDQWtDQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxTQUFpQjtJQUU1QyxhQUFPLENBQUMsSUFBSSxDQUFDLDBEQUEwRCxDQUFDLENBQUM7SUFDekUsT0FBTyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM1QixPQUFPO1FBQ1AsSUFBSTtRQUNKLEtBQUs7S0FDTCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBWEQsa0NBV0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCB7IExGIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IGdpdGxvZyBmcm9tICdnaXRsb2cyJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jLCBTcGF3blN5bmNSZXR1cm5zIH0gZnJvbSAnLi4nO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bk91dHB1dCwgZ2V0Q3Jvc3NTcGF3bkVycm9yLCBpc0dpdFJvb3QsIElTcGF3bkFTeW5jRXJyb3IgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IEVudW1TaGFyZVN0YXRlcywgc2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgZmlsdGVyQXJndiB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jR2l0IH0gZnJvbSAnLi9naXQvY3Jvc3Mtc3Bhd24nO1xuaW1wb3J0IHsgZ2l0U2V0UmVtb3RlIH0gZnJvbSAnLi9naXQvbGliJztcbmltcG9ydCB7IEdJVF9UT0tFTiB9IGZyb20gJy4vZ2l0L3Rva2VuJztcbmltcG9ydCB7IGJyYW5jaE5hbWVUb0RhdGUsIGdldFB1c2hVcmwsIGdldFB1c2hVcmxHaXRlZSB9IGZyb20gJy4vZ2l0L3V0aWwnO1xuXG5pbXBvcnQgeyBOT19QVVNILCBOT1RfRE9ORSwgUFJPSkVDVF9ST09UIH0gZnJvbSAnLi9pbml0JztcblxuZXhwb3J0ICogZnJvbSAnLi9naXQvbGliJztcbmV4cG9ydCAqIGZyb20gJy4vZ2l0L3V0aWwnO1xuXG5leHBvcnQgY29uc3QgREFURV9GT1JNQVQgPSAnWVlZWS1NTS1ERC1ISC1tbS1zcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWxsR2l0KFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncHVsbCcsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoR2l0KFJFUE9fUEFUSDogc3RyaW5nLCByZW1vdGU/OiBzdHJpbmcpXG57XG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdmZXRjaCcsXG5cdFx0Jy0tZm9yY2UnLFxuXHRcdHJlbW90ZSB8fCAnb3JpZ2luJyxcblx0XHQnbWFzdGVyJyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hHaXRBbGwoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdmZXRjaCcsXG5cdFx0Jy0tYWxsJyxcblx0XHQnLS1wcnVuZScsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0JyYW5jaChSRVBPX1BBVEg6IHN0cmluZywgQlJfTkFNRTogc3RyaW5nKVxue1xuXHRjb25zb2xlLmRlYnVnKGDlmJfoqablu7rnq4vmlrDliIbmlK8gJHtCUl9OQU1FfWApO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdjaGVja291dCcsXG5cdFx0Jy1CJyxcblx0XHRCUl9OQU1FLFxuXHRcdCdvcmlnaW4vbWFzdGVyJyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3Jldi1wYXJzZScsXG5cdFx0Jy0tYWJicmV2LXJlZicsXG5cdFx0J0hFQUQnLFxuXHRdLCB7XG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGxldCBuYW1lID0gY3Jvc3NTcGF3bk91dHB1dChjcC5zdGRvdXQpO1xuXG5cdHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlQnJhbmNoKFJFUE9fUEFUSDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbilcbntcblx0aWYgKG5hbWUgPT0gJ21hc3RlcicgfHwgIW5hbWUpXG5cdHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoKTtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuWIqumZpOacrOWcsOWIhuaUryAke25hbWV9YCk7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J2JyYW5jaCcsXG5cdFx0Zm9yY2UgPyAnLUQnIDogJy1kJyxcblx0XHRuYW1lLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbi8qKlxuICogQEZJWE1FIOS4jeefpemBk+eCuuS7gOm6vOaykuacieWIqumZpCDmiYDku6XlpJrlgZrkuIDmrKHlj6blpJbkuIDnqK7liKrpmaTmraXpqZ9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUJyYW5jaFJlbW90ZShSRVBPX1BBVEg6IHN0cmluZywgcmVtb3RlOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKVxue1xuXHRpZiAobmFtZSA9PSAnbWFzdGVyJyB8fCAhbmFtZSB8fCAhcmVtb3RlKVxuXHR7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCk7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabliKrpmaTpgaDnq6/liIbmlK8gJHtuYW1lfWApO1xuXG5cdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3B1c2gnLFxuXHRcdHJlbW90ZSxcblx0XHQnLS1kZWxldGUnLFxuXHRcdG5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHQvKipcblx0ICog5LiN55+l6YGT54K65LuA6bq85rKS5pyJ5Yiq6ZmkIOaJgOS7peWkmuWBmuS4gOasoeWPpuWkluS4gOeoruWIqumZpOatpempn1xuXHQgKiBodHRwczovL3psYXJnb24uZ2l0Ym9va3MuaW8vZ2l0LXR1dG9yaWFsL2NvbnRlbnQvcmVtb3RlL2RlbGV0ZV9icmFuY2guaHRtbFxuXHQgKi9cblx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncHVzaCcsXG5cdFx0cmVtb3RlLFxuXHRcdCc6JyArIG5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9sZEJyYW5jaChSRVBPX1BBVEg6IHN0cmluZylcbntcblx0bGV0IG5hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShSRVBPX1BBVEgpO1xuXG5cdGlmIChuYW1lLmluZGV4T2YoJ2F1dG8vJykgPT0gMClcblx0e1xuXHRcdHJldHVybiBuYW1lO1xuXHR9XG5cblx0cmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmT3JpZ2luKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRsZXQgbG9nID0gZ2l0bG9nKHtcblx0XHRyZXBvOiBSRVBPX1BBVEgsXG5cdFx0YnJhbmNoOiBbY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIKSwgJ29yaWdpbi9tYXN0ZXInXS5qb2luKCcuLicpLFxuXHRcdG51bWJlcjogMyxcblx0XHRuYW1lU3RhdHVzOiBmYWxzZSxcblx0fSk7XG5cblx0Y29uc29sZS5sb2cobG9nLCBsb2cubGVuZ3RoKTtcblxuXHRyZXR1cm4gbG9nLmxlbmd0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc2hIRUFEKFJFUE9fUEFUSDogc3RyaW5nLCBicmFuY2g6IHN0cmluZyA9ICdIRUFEJylcbntcblx0cmV0dXJuIGdpdGxvZyh7IHJlcG86IFJFUE9fUEFUSCwgbnVtYmVyOiAxLCBicmFuY2ggfSlbMF0uYWJicmV2SGFzaDtcbn1cblxuZXhwb3J0IHR5cGUgSU9wdGlvbnNDcmVhdGVHaXQgPSB7XG5cdHVybDogc3RyaW5nLFxuXHR0YXJnZXRQYXRoOiBzdHJpbmcsXG5cblx0bmV3QnJhbmNoTmFtZTogc3RyaW5nLFxuXG5cdHVybENsb25lPzogc3RyaW5nLFxuXHR1cmxQdXNoPzogc3RyaW5nLFxuXG5cdE5PVF9ET05FLFxuXG5cdENMT05FX0RFUFRIPzogbnVtYmVyLFxuXG5cdExPR0lOX1RPS0VOPzogc3RyaW5nLFxuXG5cdG9uPzoge1xuXHRcdGNyZWF0ZV9iZWZvcmU/KGRhdGE6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJkYXRhXCJdLCB0ZW1wPzogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcInRlbXBcIl0pLFxuXHRcdGNyZWF0ZT8oZGF0YTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcImRhdGFcIl0sIHRlbXA/OiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1widGVtcFwiXSksXG5cdFx0Y3JlYXRlX2FmdGVyPyhkYXRhOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1wiZGF0YVwiXSwgdGVtcD86IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJ0ZW1wXCJdKSxcblx0fSxcbn07XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0Q2hlY2tSZW1vdGUoUkVQT19QQVRIOiBzdHJpbmcsIHJlbW90ZT86IHN0cmluZylcbntcblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jR2l0KCdnaXQnLCBbXG5cdFx0J2xzLXJlbW90ZScsXG5cdFx0Jy0tZXhpdC1jb2RlJyxcblx0XHQnLS1oZWFkcycsXG5cdFx0Jy0tcXVpZXQnLFxuXHRcdChyZW1vdGUgfHwgJ29yaWdpbicpLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHaXQob3B0aW9uczogSU9wdGlvbnNDcmVhdGVHaXQpXG57XG5cdGNvbnN0IHdhaXRfY3JlYXRlX2dpdCA9IHNoYXJlU3RhdGVzKEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVQpO1xuXG5cdHdhaXRfY3JlYXRlX2dpdC5lbnN1cmUoKTtcblxuXHRsZXQgdGFyZ2V0TmFtZSA9IHBhdGguYmFzZW5hbWUob3B0aW9ucy50YXJnZXRQYXRoKTtcblx0bGV0IHRhcmdldFBhdGggPSBwYXRoLm5vcm1hbGl6ZShvcHRpb25zLnRhcmdldFBhdGgpO1xuXG5cdGxldCBSRVBPX1BBVEggPSB0YXJnZXRQYXRoO1xuXG5cdGxldCBleGlzdHMgPSBmcy5wYXRoRXhpc3RzU3luYyhSRVBPX1BBVEgpICYmIGlzR2l0Um9vdChSRVBPX1BBVEgpO1xuXG5cdGxldCBkYXRhID0ge1xuXHRcdHRhcmdldE5hbWUsXG5cdFx0dGFyZ2V0UGF0aCxcblxuXHRcdG5ld0JyYW5jaE5hbWU6IG9wdGlvbnMubmV3QnJhbmNoTmFtZSxcblxuXHRcdGV4aXN0cyxcblx0XHRleGlzdHNCcmFuY2hOYW1lOiBleGlzdHMgJiYgb2xkQnJhbmNoKFJFUE9fUEFUSCkgfHwgbnVsbCxcblxuXHRcdE5PVF9ET05FLFxuXG5cdFx0dXJsOiBvcHRpb25zLnVybCxcblx0XHR1cmxDbG9uZTogb3B0aW9ucy51cmxDbG9uZSxcblxuXHRcdExPR0lOX1RPS0VOOiBvcHRpb25zLkxPR0lOX1RPS0VOLFxuXG5cdFx0cHVzaFVybDogb3B0aW9ucy51cmxQdXNoIHx8IGdldFB1c2hVcmwob3B0aW9ucy51cmwsIG9wdGlvbnMuTE9HSU5fVE9LRU4pLFxuXHR9O1xuXG5cdGxldCB1cmxDbG9uZSA9IGRhdGEudXJsQ2xvbmU7XG5cblx0aWYgKCF1cmxDbG9uZSlcblx0e1xuXHRcdGNvbnNvbGUucmVkKGB1cmxDbG9uZSDkuI3lrZjlnKgg5ZiX6Kmm6Ieq5YuV55Sf5oiQYCk7XG5cblx0XHRpZiAoZGF0YS5MT0dJTl9UT0tFTilcblx0XHR7XG5cdFx0XHRjb25zb2xlLmRlYnVnKGDkvb/nlKggTE9HSU5fVE9LRU4g6Ieq5YuV55Sf5oiQIHVybENsb25lYCk7XG5cdFx0XHR1cmxDbG9uZSA9IGdldFB1c2hVcmwoZGF0YS51cmwsIGRhdGEuTE9HSU5fVE9LRU4pO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5kZWJ1Zyhg5L2/55SoIHVybCDoh6rli5XnlJ/miJAgdXJsQ2xvbmVgKTtcblx0XHRcdHVybENsb25lID0gZ2V0UHVzaFVybChkYXRhLnVybCk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IHRlbXA6IHtcblx0XHRjcDogU3Bhd25TeW5jUmV0dXJucyxcblxuXHRcdFtrOiBzdHJpbmddOiBhbnksXG5cdH0gPSB7XG5cdFx0Y3A6IG51bGwsXG5cdH07XG5cblx0bGV0IF9jcF9lcnJvcjogSVNwYXduQVN5bmNFcnJvcjtcblxuXHRsZXQgbGFiZWw6IHN0cmluZztcblxuXHRsYWJlbCA9IGAtLS0gQ09ORklHIC0tLWA7XG5cblx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRnaXRTZXRSZW1vdGUoZGF0YS50YXJnZXRQYXRoLCB1cmxDbG9uZSwgJ29yaWdpbicpO1xuXHRnaXRTZXRSZW1vdGUoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwsICdvcmlnaW4tcHVzaCcpO1xuXG5cdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cblx0Y29uc29sZS5pbmZvKGBjcmVhdGUgZ2l0OiAke3RhcmdldE5hbWV9YCk7XG5cblx0aWYgKG9wdGlvbnMub24gJiYgb3B0aW9ucy5vbi5jcmVhdGVfYmVmb3JlKVxuXHR7XG5cdFx0bGFiZWwgPSBgLS0tIENSRUFURV9CRUZPUkUgLS0tYDtcblx0XHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cdFx0b3B0aW9ucy5vbi5jcmVhdGVfYmVmb3JlKGRhdGEsIHRlbXApO1xuXHRcdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cdH1cblxuXHRsYWJlbCA9IGAtLS0gQ1JFQVRFIC0tLWA7XG5cdGNvbnNvbGUuaW5mbyhsYWJlbCk7XG5cdGNvbnNvbGUudGltZShsYWJlbCk7XG5cblx0dGVtcC5jcCA9IG51bGw7XG5cblx0dGVtcC5jcCA9IGdpdENoZWNrUmVtb3RlKGRhdGEudGFyZ2V0UGF0aCwgdXJsQ2xvbmUpO1xuXG5cdF9jcF9lcnJvciA9IGdldENyb3NzU3Bhd25FcnJvcih0ZW1wLmNwKTtcblxuXHRpZiAoX2NwX2Vycm9yKVxuXHR7XG5cdFx0dGhyb3cgX2NwX2Vycm9yXG5cdH1cblxuXHRsZXQgX2RlbGV0ZWQ6IGJvb2xlYW47XG5cblx0aWYgKGRhdGEuTk9UX0RPTkUgJiYgZGF0YS5leGlzdHMpXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYCR7dGFyZ2V0TmFtZX0gYWxyZWFkeSBleGlzdHNgKTtcblxuXHRcdHRlbXAuY3AgPSBmZXRjaEdpdChkYXRhLnRhcmdldFBhdGgsIHVybENsb25lKTtcblx0fVxuXHRlbHNlIGlmIChkYXRhLmV4aXN0cylcblx0e1xuXHRcdGNvbnNvbGUud2FybihgJHt0YXJnZXROYW1lfSBhbHJlYWR5IGV4aXN0c2ApO1xuXG5cdFx0Y29uc29sZS5pbmZvKGDlj5blvpfmiYDmnInpgaDnq6/liIbmlK9gKTtcblx0XHRmZXRjaEdpdEFsbChkYXRhLnRhcmdldFBhdGgpO1xuXG5cdFx0X2RlbGV0ZWQgPSBnaXRSZW1vdmVCcmFuY2hPdXRkYXRlKGRhdGEudGFyZ2V0UGF0aCk7XG5cblx0XHR0ZW1wLmNwID0gZmV0Y2hHaXQoZGF0YS50YXJnZXRQYXRoLCB1cmxDbG9uZSk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bGV0IENMT05FX0RFUFRIOiBudW1iZXIgPSAob3B0aW9ucy5DTE9ORV9ERVBUSCB8fCBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LkNMT05FX0RFUFRIIHx8IDUwKSBhcyBudW1iZXI7XG5cblx0XHRpZiAoaXNOYU4oQ0xPTkVfREVQVEgpIHx8ICFDTE9ORV9ERVBUSCB8fCBDTE9ORV9ERVBUSCA8PSAwKVxuXHRcdHtcblx0XHRcdENMT05FX0RFUFRIID0gNTA7XG5cdFx0fVxuXG5cdFx0dGVtcC5jcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHQnY2xvbmUnLFxuXHRcdFx0YC0tZGVwdGg9JHtDTE9ORV9ERVBUSH1gLFxuXHRcdFx0Ly8nLS12ZXJib3NlJyxcblx0XHRcdC8vJy0tcHJvZ3Jlc3MgJyxcblx0XHRcdHVybENsb25lLFxuXHRcdFx0ZGF0YS50YXJnZXRQYXRoLFxuXHRcdF0sIHtcblx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRjd2Q6IFBST0pFQ1RfUk9PVCxcblx0XHR9KTtcblx0fVxuXG5cdF9jcF9lcnJvciA9IGdldENyb3NzU3Bhd25FcnJvcih0ZW1wLmNwKTtcblxuXHRpZiAoX2NwX2Vycm9yKVxuXHR7XG5cdFx0dGhyb3cgX2NwX2Vycm9yXG5cdH1cblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZSlcblx0e1xuXHRcdG9wdGlvbnMub24uY3JlYXRlKGRhdGEsIHRlbXApO1xuXHR9XG5cblx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZV9hZnRlcilcblx0e1xuXHRcdGxhYmVsID0gYC0tLSBDUkVBVEVfQUZURVIgLS0tYDtcblx0XHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cdFx0b3B0aW9ucy5vbi5jcmVhdGVfYWZ0ZXIoZGF0YSwgdGVtcCk7XG5cdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblx0fVxuXG5cdGxhYmVsID0gYC0tLSBCRUZPUkVfRE9ORSAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdGlmIChfZGVsZXRlZClcblx0e1xuXHRcdGdpdEdjQWdncmVzc2l2ZShkYXRhLnRhcmdldFBhdGgpO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGdpdEdjKGRhdGEudGFyZ2V0UGF0aCk7XG5cdH1cblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdGxhYmVsID0gYC0tLSBSRU1PVkVfV0FJVCAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdHdhaXRfY3JlYXRlX2dpdC5yZW1vdmUoKTtcblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdHJldHVybiB7IGRhdGEsIHRlbXAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0R2MoUkVQT19QQVRIOiBzdHJpbmcsIGFyZ3Y/OiBzdHJpbmdbXSlcbntcblx0YXJndiA9IGZpbHRlckFyZ3YoW1xuXHRcdCdnYycsXG5cdF0uY29uY2F0KChhcmd2ICYmIGFyZ3YubGVuZ3RoKSA/IGFyZ3YgOiBbXSkpO1xuXG5cdGlmIChhcmd2Lmxlbmd0aCA9PSAxKVxuXHR7XG5cdFx0YXJndi5wdXNoKCctLXBydW5lPVwiMyBkYXlzXCInKTtcblx0fVxuXG5cdGNvbnNvbGUuaW5mbyhg5YSq5YyWIEdJVCDos4fmlplgLCBhcmd2KTtcblxuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdEdjQWdncmVzc2l2ZShSRVBPX1BBVEg6IHN0cmluZywgYXJndj86IHN0cmluZ1tdKVxue1xuXHRhcmd2ID0gZmlsdGVyQXJndihbXG5cdFx0J2djJyxcblx0XHQnLS1hZ2dyZXNzaXZlJyxcblx0XS5jb25jYXQoKGFyZ3YgJiYgYXJndi5sZW5ndGgpID8gYXJndiA6IFtdKSk7XG5cblx0aWYgKGFyZ3YubGVuZ3RoID09IDIpXG5cdHtcblx0XHRhcmd2LnB1c2goJy0tcHJ1bmU9XCIzIGRheXNcIicpO1xuXHR9XG5cblx0Y29uc29sZS5pbmZvKGDlhKrljJYgR0lUIOizh+aWmWAsIGFyZ3YpO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgYXJndiwge1xuXHRcdGN3ZDogUkVQT19QQVRILFxuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0UmVtb3ZlQnJhbmNoT3V0ZGF0ZShSRVBPX1BBVEg6IHN0cmluZylcbntcblx0Y29uc29sZS5pbmZvKGDplovlp4vliIbmnpAgR0lUIOWIhuaUr2ApO1xuXG5cdGxldCBkYXRhX3JldDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGxldCBicl9uYW1lID0gY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cblx0bGV0IGRhdGVfYnIgPSBicmFuY2hOYW1lVG9EYXRlKGJyX25hbWUpO1xuXHRsZXQgZGF0ZV9ub3cgPSBtb21lbnQoKTtcblxuXHQvL2NvbnNvbGUubG9nKHticl9uYW1lLCBkYXRlX2JyLCBkYXRlX25vd30pO1xuXG5cdGxldCBicnM6IFJldHVyblR5cGU8dHlwZW9mIHBhcnNlQnJhbmNoR3JvdXA+O1xuXG5cdGJycyA9IHBhcnNlQnJhbmNoR3JvdXAoZ2l0QnJhbmNoTWVyZ2VkTGlzdChSRVBPX1BBVEgpKTtcblxuXHRpZiAoYnJzKVxuXHR7XG5cdFx0Y29uc29sZS5sb2coYOaqouafpeS4puWIqumZpOW3suWQiOS9teWIhuaUr2ApO1xuXHRcdGNvbnNvbGUuZGlyKGJycywgeyBjb2xvcnM6IHRydWUsIH0pO1xuXG5cdFx0bGV0IHByZV9uYW1lOiBzdHJpbmc7XG5cblx0XHRwcmVfbmFtZSA9ICdyZWZzL2hlYWRzLyc7XG5cblx0XHRicnMuaGVhZHNcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nLCBpbmRleCwgYXJyYXkpXG5cdFx0XHR7XG5cdFx0XHRcdGZuKHZhbHVlLCBwcmVfbmFtZSArIHZhbHVlKTtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0cHJlX25hbWUgPSAncmVmcy9yZW1vdGVzLyc7XG5cblx0XHRPYmplY3Qua2V5cyhicnMucmVtb3Rlcylcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChyZW1vdGVfbmFtZSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IHByZWZpeCA9IHByZV9uYW1lICsgcmVtb3RlX25hbWUgKyAnLyc7XG5cblx0XHRcdFx0bGV0IGJyc19saXN0ID0gYnJzLnJlbW90ZXNbcmVtb3RlX25hbWVdO1xuXG5cdFx0XHRcdGlmIChicnNfbGlzdC5sZW5ndGggPiA1KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YnJzX2xpc3QgPSBicnNfbGlzdFxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbiAodmFsdWUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBib29sID0gL2F1dG9cXC8vaS50ZXN0KHZhbHVlKTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYm9vbDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuc2xpY2UoMCwgLTIpXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0YnJzX2xpc3Rcblx0XHRcdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nLCBpbmRleCwgYXJyYXkpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBib29sID0gIS9hdXRvXFwvL2kudGVzdCh2YWx1ZSk7XG5cdFx0XHRcdFx0XHRcdGxldCBkZWxfbmFtZSA9IHByZWZpeCArIHZhbHVlO1xuXG5cdFx0XHRcdFx0XHRcdGZuKHZhbHVlLCBkZWxfbmFtZSwgYm9vbCwgdHJ1ZSwgcmVtb3RlX25hbWUpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXHR9XG5cblx0YnJzID0gcGFyc2VCcmFuY2hHcm91cChnaXRCcmFuY2hNZXJnZWRMaXN0KFJFUE9fUEFUSCwgdHJ1ZSkpO1xuXG5cdGlmIChicnMpXG5cdHtcblx0XHRjb25zb2xlLmxvZyhg5qqi5p+l5Lim5Yiq6Zmk5pyq5ZCI5L216YGO5pyf5YiG5pSvYCk7XG5cdFx0Y29uc29sZS5kaXIoYnJzLCB7IGNvbG9yczogdHJ1ZSwgfSk7XG5cblx0XHRsZXQgcHJlX25hbWU6IHN0cmluZztcblxuXHRcdHByZV9uYW1lID0gJ3JlZnMvaGVhZHMvJztcblxuXHRcdGJycy5oZWFkc1xuXHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcsIGluZGV4LCBhcnJheSlcblx0XHRcdHtcblx0XHRcdFx0Zm4odmFsdWUsIHByZV9uYW1lICsgdmFsdWUpO1xuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRwcmVfbmFtZSA9ICdyZWZzL3JlbW90ZXMvJztcblxuXHRcdE9iamVjdC5rZXlzKGJycy5yZW1vdGVzKVxuXHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHJlbW90ZV9uYW1lKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocmVtb3RlX25hbWUgPT0gJ29yaWdpbicpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgcHJlZml4ID0gcHJlX25hbWUgKyByZW1vdGVfbmFtZSArICcvJztcblxuXHRcdFx0XHRsZXQgYnJzX2xpc3QgPSBicnMucmVtb3Rlc1tyZW1vdGVfbmFtZV07XG5cblx0XHRcdFx0aWYgKGJyc19saXN0Lmxlbmd0aCA+IDUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgbWF4X2RhdGVfdW5peCA9IDA7XG5cblx0XHRcdFx0XHRicnNfbGlzdCA9IGJyc19saXN0XG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uICh2YWx1ZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGJvb2wgPSAvYXV0b1xcLy9pLnRlc3QodmFsdWUpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChib29sKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGQgPSBicmFuY2hOYW1lVG9EYXRlKHZhbHVlKTtcblxuXHRcdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZCwgZC51bml4KCkpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bWF4X2RhdGVfdW5peCA9IE1hdGgubWF4KG1heF9kYXRlX3VuaXgsIGQudW5peCgpKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiBib29sO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5zbGljZSgwLCAtMylcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRsZXQgbWF4X2RhdGUgPSBtb21lbnQudW5peChtYXhfZGF0ZV91bml4KTtcblxuXHRcdFx0XHRcdGJyc19saXN0XG5cdFx0XHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWU6IHN0cmluZywgaW5kZXgsIGFycmF5KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgYm9vbCA9ICEvXmF1dG9cXC8vaS50ZXN0KHZhbHVlKTtcblx0XHRcdFx0XHRcdFx0bGV0IGRlbF9uYW1lID0gcHJlZml4ICsgdmFsdWU7XG5cblx0XHRcdFx0XHRcdFx0Zm4odmFsdWUsIGRlbF9uYW1lLCBib29sLCB0cnVlLCByZW1vdGVfbmFtZSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBmbih2YWx1ZTogc3RyaW5nLCBkZWxfbmFtZTogc3RyaW5nLCBza2lwPzogYm9vbGVhbiwgaXNfcmVtb3RlPzogYm9vbGVhbiwgcmVtb3RlX25hbWU/OiBzdHJpbmcpXG5cdHtcblx0XHRsZXQgdmFsdWVfbGMgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0aWYgKHNraXApXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYHNraXAgKDEpICR7ZGVsX25hbWV9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVsc2UgaWYgKCF2YWx1ZSB8fCB2YWx1ZV9sYyA9PSBicl9uYW1lIHx8IHZhbHVlX2xjID09ICdtYXN0ZXInIHx8IHZhbHVlX2xjID09ICdoZWFkJylcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhgc2tpcCAoMikgJHtkZWxfbmFtZX1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoaXNfcmVtb3RlKVxuXHRcdHtcblx0XHRcdGlmICghL2F1dG9cXC8vaS50ZXN0KHZhbHVlKSB8fCAhcmVtb3RlX25hbWUpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBza2lwICgzKSAke2RlbF9uYW1lfWApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGxldCBkID0gbW9tZW50KHZhbHVlLnJlcGxhY2UoL14uKmF1dG9cXC8vLCAnJyksIERBVEVfRk9STUFUKTtcblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhkKTtcblx0XHR9XG5cblx0XHRjb25zb2xlLmluZm8oYHRyeSBkZWxldGUgJHtkZWxfbmFtZX1gKTtcblxuXHRcdGlmIChpc19yZW1vdGUpXG5cdFx0e1xuXHRcdFx0Ly9kZWxldGVCcmFuY2hSZW1vdGUoUkVQT19QQVRILCByZW1vdGVfbmFtZSwgdmFsdWUpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZGVsZXRlQnJhbmNoKFJFUE9fUEFUSCwgdmFsdWUpO1xuXHRcdH1cblxuXHRcdGRhdGFfcmV0ID0gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBkYXRhX3JldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdEJyYW5jaE1lcmdlZExpc3QoUkVQT19QQVRIOiBzdHJpbmcsIG5vTWVyZ2VkPzogYm9vbGVhbiwgQlJfTkFNRT86IHN0cmluZylcbntcblx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGZpbHRlckFyZ3YoW1xuXHRcdCdicmFuY2gnLFxuXHRcdCctLWZvcm1hdCcsXG5cdFx0JyUocmVmbmFtZSknLFxuXHRcdCctYScsXG5cdFx0bm9NZXJnZWQgPyAnLS1uby1tZXJnZWQnIDogJy0tbWVyZ2VkJyxcblx0XHRCUl9OQU1FLFxuXHRdKSwge1xuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRpZiAoY3Auc3RkZXJyICYmIGNwLnN0ZGVyci5sZW5ndGgpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGNwLnN0ZGVyci50b1N0cmluZygpKTtcblxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRsZXQgbmFtZSA9IGNyb3NzU3Bhd25PdXRwdXQoY3Auc3Rkb3V0KTtcblxuXHRyZXR1cm4gbmFtZVxuXHRcdC5zcGxpdChMRilcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJyYW5jaEdyb3VwKHI6IHN0cmluZ1tdKToge1xuXHRoZWFkczogc3RyaW5nW107XG5cdHJlbW90ZXM6IHtcblx0XHRvcmlnaW46IHN0cmluZ1tdO1xuXHRcdFtrOiBzdHJpbmddOiBzdHJpbmdbXTtcblx0fTtcbn1cbntcblx0aWYgKCFyIHx8ICFyLmxlbmd0aClcblx0e1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0cmV0dXJuIHIuc29ydCgpLnJlZHVjZShmdW5jdGlvbiAoYSwgYilcblx0e1xuXHRcdGlmICgvXnJlZnNcXC9yZW1vdGVzXFwvKFteXFwvXSspXFwvKC4rKSQvLmV4ZWMoYikpXG5cdFx0e1xuXHRcdFx0bGV0IHsgJDEsICQyIH0gPSBSZWdFeHA7XG5cdFx0XHRhLnJlbW90ZXNbJDFdID0gYS5yZW1vdGVzWyQxXSB8fCBbXTtcblx0XHRcdGEucmVtb3Rlc1skMV0ucHVzaCgkMik7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKC9ecmVmc1xcL2hlYWRzXFwvKC4rKSQvLmV4ZWMoYikpXG5cdFx0e1xuXHRcdFx0bGV0IHsgJDEsICQyIH0gPSBSZWdFeHA7XG5cdFx0XHRhLmhlYWRzLnB1c2goJDEpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhO1xuXHR9LCB7XG5cdFx0aGVhZHM6IFtdLFxuXHRcdHJlbW90ZXM6IHtcblx0XHRcdG9yaWdpbjogW10sXG5cdFx0fSxcblx0fSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdENsZWFuQWxsKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRjb25zb2xlLmluZm8oYFtnaXQ6Y2xlYW5dIFJlbW92ZSB1bnRyYWNrZWQgZmlsZXMgZnJvbSB0aGUgd29ya2luZyB0cmVlYCk7XG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdjbGVhbicsXG5cdFx0Jy1kJyxcblx0XHQnLWZ4Jyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuIl19