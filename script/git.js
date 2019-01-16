"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const path = require("upath2");
const crlf_normalize_1 = require("crlf-normalize");
const fs = require("fs-extra");
const gitlog2_1 = require("gitlog2");
const __1 = require("..");
const index_1 = require("../index");
const log_1 = require("../lib/log");
const share_1 = require("../lib/share");
const cross_spawn_1 = require("./git/cross-spawn");
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
    log_1.default.debug(`嘗試推送 ${repo}`);
    let cp = __1.crossSpawnSync('git', argv, {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    return cp;
}
exports.pushGit = pushGit;
function pullGit(REPO_PATH) {
    return __1.crossSpawnSync('git', [
        'pull',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.pullGit = pullGit;
function fetchGit(REPO_PATH) {
    return cross_spawn_1.crossSpawnSyncGit('git', [
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
function getPushUrl(url, login_token) {
    if (login_token && !/@$/.test(login_token)) {
        login_token += '@';
    }
    return `https://${login_token ? login_token : ''}${url}`;
}
exports.getPushUrl = getPushUrl;
function getPushUrlGitee(url, login_token = init_1.GITEE_TOKEN) {
    return getPushUrl(url, login_token);
}
exports.getPushUrlGitee = getPushUrlGitee;
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
        pushUrl: options.urlPush || getPushUrl(options.url, options.LOGIN_TOKEN),
    };
    let temp = {
        cp: null,
    };
    let _cp_error;
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
    temp.cp = gitCheckRemote(data.targetPath, data.urlClone);
    _cp_error = index_1.getCrossSpawnError(temp.cp);
    if (_cp_error) {
        throw _cp_error;
    }
    let _deleted;
    if (data.NOT_DONE && data.exists) {
        log_1.default.warn(`${targetName} already exists`);
        temp.cp = fetchGit(data.targetPath);
    }
    else if (data.exists) {
        log_1.default.warn(`${targetName} already exists`);
        log_1.default.info(`取得所有遠端分支`);
        fetchGitAll(data.targetPath);
        _deleted = gitRemoveBranchOutdate(data.targetPath);
        temp.cp = fetchGit(data.targetPath);
    }
    else {
        let CLONE_DEPTH = (options.CLONE_DEPTH || process && process.env && process.env.CLONE_DEPTH || 50);
        if (isNaN(CLONE_DEPTH) || !CLONE_DEPTH || CLONE_DEPTH <= 0) {
            CLONE_DEPTH = 50;
        }
        let urlClone = data.urlClone;
        if (!urlClone) {
            log_1.default.red(`urlClone 不存在 嘗試自動生成`);
            if (data.LOGIN_TOKEN) {
                log_1.default.debug(`使用 LOGIN_TOKEN 自動生成 urlClone`);
                urlClone = getPushUrl(data.url, data.LOGIN_TOKEN);
            }
            else {
                log_1.default.debug(`使用 url 自動生成 urlClone`);
                urlClone = getPushUrl(data.url);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQyxtREFBb0M7QUFDcEMsK0JBQStCO0FBQy9CLHFDQUE2QjtBQUM3QiwwQkFBc0Q7QUFDdEQsb0NBQTZGO0FBQzdGLG9DQUFpQztBQUNqQyx3Q0FBNEQ7QUFFNUQsbURBQXNEO0FBRXRELGlDQUFzRTtBQUV6RCxRQUFBLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQztBQUVqRDs7R0FFRztBQUVILFNBQWdCLE9BQU8sQ0FBQyxTQUFpQixFQUFFLElBQVksRUFBRSxLQUFlO0lBRXZFLElBQUksSUFBSSxHQUFHO1FBQ1YsTUFBTTtRQUNOLFlBQVk7UUFDWixLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUztRQUM3QixJQUFJO0tBQ0osQ0FBQztJQUVGLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFM0IsSUFBSSxjQUFPLEVBQ1g7UUFDQyxPQUFPLElBQUksQ0FBQztLQUNaO0lBRUQsYUFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUM7SUFFOUIsSUFBSSxFQUFFLEdBQUcsa0JBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BDLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsT0FBTyxFQUFFLENBQUM7QUFDWCxDQUFDO0FBeEJELDBCQXdCQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxTQUFpQjtJQUV4QyxPQUFPLGtCQUFjLENBQUMsS0FBSyxFQUFFO1FBQzVCLE1BQU07S0FDTixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBUkQsMEJBUUM7QUFFRCxTQUFnQixRQUFRLENBQUMsU0FBaUI7SUFFekMsT0FBTywrQkFBaUIsQ0FBQyxLQUFLLEVBQUU7UUFDL0IsT0FBTztRQUNQLFNBQVM7UUFDVCxRQUFRO1FBQ1IsUUFBUTtLQUNSLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUFYRCw0QkFXQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxTQUFpQjtJQUU1QyxPQUFPLCtCQUFpQixDQUFDLEtBQUssRUFBRTtRQUMvQixPQUFPO1FBQ1AsT0FBTztRQUNQLFNBQVM7S0FDVCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBVkQsa0NBVUM7QUFFRCxTQUFnQixTQUFTLENBQUMsU0FBaUIsRUFBRSxPQUFlO0lBRTNELGFBQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBRXBDLE9BQU8sa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDNUIsVUFBVTtRQUNWLElBQUk7UUFDSixPQUFPO1FBQ1AsZUFBZTtLQUNmLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUFiRCw4QkFhQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLFNBQWlCO0lBRWxELElBQUksRUFBRSxHQUFHLGtCQUFjLENBQUMsS0FBSyxFQUFFO1FBQzlCLFdBQVc7UUFDWCxjQUFjO1FBQ2QsTUFBTTtLQUNOLEVBQUU7UUFDRixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztJQUVILElBQUksSUFBSSxHQUFHLHdCQUFnQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV2QyxPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUFiRCw4Q0FhQztBQUVELFNBQWdCLFlBQVksQ0FBQyxTQUFpQixFQUFFLElBQVksRUFBRSxLQUFlO0lBRTVFLElBQUksSUFBSSxJQUFJLFFBQVEsSUFBSSxDQUFDLElBQUksRUFDN0I7UUFDQyxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7S0FDbEI7SUFFRCxhQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVsQyxPQUFPLGtCQUFjLENBQUMsS0FBSyxFQUFFO1FBQzVCLFFBQVE7UUFDUixLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTtRQUNuQixJQUFJO0tBQ0osRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpCRCxvQ0FpQkM7QUFFRDs7R0FFRztBQUNILFNBQWdCLGtCQUFrQixDQUFDLFNBQWlCLEVBQUUsTUFBYyxFQUFFLElBQVksRUFBRSxLQUFlO0lBRWxHLElBQUksSUFBSSxJQUFJLFFBQVEsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDeEM7UUFDQyxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7S0FDbEI7SUFFRCxhQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVsQyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUNyQixNQUFNO1FBQ04sTUFBTTtRQUNOLFVBQVU7UUFDVixJQUFJO0tBQ0osRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0lBRUg7OztPQUdHO0lBQ0gsa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDckIsTUFBTTtRQUNOLE1BQU07UUFDTixHQUFHLEdBQUcsSUFBSTtLQUNWLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUEvQkQsZ0RBK0JDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLFNBQWlCO0lBRTFDLElBQUksSUFBSSxHQUFHLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXhDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQzlCO1FBQ0MsT0FBTyxJQUFJLENBQUM7S0FDWjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQVZELDhCQVVDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLFNBQWlCO0lBRTNDLElBQUksR0FBRyxHQUFHLGlCQUFNLENBQUM7UUFDaEIsSUFBSSxFQUFFLFNBQVM7UUFDZixNQUFNLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xFLE1BQU0sRUFBRSxDQUFDO1FBQ1QsVUFBVSxFQUFFLEtBQUs7S0FDakIsQ0FBQyxDQUFDO0lBRUgsYUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTdCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUNuQixDQUFDO0FBWkQsZ0NBWUM7QUFFRCxTQUFnQixXQUFXLENBQUMsU0FBaUIsRUFBRSxTQUFpQixNQUFNO0lBRXJFLE9BQU8saUJBQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztBQUNyRSxDQUFDO0FBSEQsa0NBR0M7QUF3QkQsU0FBZ0IsVUFBVSxDQUFDLEdBQVcsRUFBRSxXQUFvQjtJQUUzRCxJQUFJLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQzFDO1FBQ0MsV0FBVyxJQUFJLEdBQUcsQ0FBQztLQUNuQjtJQUVELE9BQU8sV0FBVyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQzFELENBQUM7QUFSRCxnQ0FRQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxHQUFXLEVBQUUsY0FBc0Isa0JBQVc7SUFFN0UsT0FBTyxVQUFVLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFIRCwwQ0FHQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxTQUFpQixFQUFFLE1BQWU7SUFFaEUsT0FBTywrQkFBaUIsQ0FBQyxLQUFLLEVBQUU7UUFDL0IsV0FBVztRQUNYLGFBQWE7UUFDYixTQUFTO1FBQ1QsU0FBUztRQUNULENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQztLQUNwQixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBWkQsd0NBWUM7QUFFRCxTQUFnQixTQUFTLENBQUMsT0FBMEI7SUFFbkQsTUFBTSxlQUFlLEdBQUcsbUJBQVcsQ0FBQyx1QkFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBRXJFLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUV6QixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUVwRCxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUM7SUFFM0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRWxFLElBQUksSUFBSSxHQUFHO1FBQ1YsVUFBVTtRQUNWLFVBQVU7UUFFVixhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWE7UUFFcEMsTUFBTTtRQUNOLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSTtRQUV4RCxRQUFRLEVBQVIsZUFBUTtRQUVSLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRztRQUNoQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7UUFFMUIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1FBRWhDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUM7S0FDeEUsQ0FBQztJQUVGLElBQUksSUFBSSxHQUlKO1FBQ0gsRUFBRSxFQUFFLElBQUk7S0FDUixDQUFDO0lBRUYsSUFBSSxTQUEyQixDQUFDO0lBRWhDLElBQUksS0FBYSxDQUFDO0lBRWxCLGFBQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRTFDLElBQUksT0FBTyxDQUFDLEVBQUUsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFDMUM7UUFDQyxLQUFLLEdBQUcsdUJBQXVCLENBQUM7UUFDaEMsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQixhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxhQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3ZCO0lBRUQsS0FBSyxHQUFHLGdCQUFnQixDQUFDO0lBQ3pCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVwQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztJQUVmLElBQUksQ0FBQyxFQUFFLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXpELFNBQVMsR0FBRywwQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFeEMsSUFBSSxTQUFTLEVBQ2I7UUFDQyxNQUFNLFNBQVMsQ0FBQTtLQUNmO0lBRUQsSUFBSSxRQUFpQixDQUFDO0lBRXRCLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNoQztRQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLGlCQUFpQixDQUFDLENBQUM7UUFFN0MsSUFBSSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO1NBQ0ksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNwQjtRQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLGlCQUFpQixDQUFDLENBQUM7UUFFN0MsYUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QixXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRTdCLFFBQVEsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFbkQsSUFBSSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO1NBRUQ7UUFDQyxJQUFJLFdBQVcsR0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFXLENBQUM7UUFFckgsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxJQUFJLENBQUMsRUFDMUQ7WUFDQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1NBQ2pCO1FBRUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUU3QixJQUFJLENBQUMsUUFBUSxFQUNiO1lBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRW5DLElBQUksSUFBSSxDQUFDLFdBQVcsRUFDcEI7Z0JBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2dCQUM5QyxRQUFRLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ2xEO2lCQUVEO2dCQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDdEMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDaEM7U0FDRDtRQUVELElBQUksQ0FBQyxFQUFFLEdBQUcsa0JBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDL0IsT0FBTztZQUNQLFdBQVcsV0FBVyxFQUFFO1lBQ3hCLGNBQWM7WUFDZCxnQkFBZ0I7WUFDaEIsUUFBUTtZQUNSLElBQUksQ0FBQyxVQUFVO1NBQ2YsRUFBRTtZQUNGLEtBQUssRUFBRSxTQUFTO1lBQ2hCLEdBQUcsRUFBRSxtQkFBWTtTQUNqQixDQUFDLENBQUM7S0FDSDtJQUVELFNBQVMsR0FBRywwQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFeEMsSUFBSSxTQUFTLEVBQ2I7UUFDQyxNQUFNLFNBQVMsQ0FBQTtLQUNmO0lBRUQsSUFBSSxPQUFPLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUNuQztRQUNDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM5QjtJQUVELGFBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFdkIsSUFBSSxPQUFPLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUN6QztRQUNDLEtBQUssR0FBRyxzQkFBc0IsQ0FBQztRQUMvQixhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BDLGFBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdkI7SUFFRCxLQUFLLEdBQUcscUJBQXFCLENBQUM7SUFDOUIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQixhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXBCLElBQUksUUFBUSxFQUNaO1FBQ0MsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNqQztTQUVEO1FBQ0MsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUN2QjtJQUVELGFBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFdkIsS0FBSyxHQUFHLHFCQUFxQixDQUFDO0lBQzlCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVwQixlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7SUFFekIsYUFBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV2QixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFBO0FBQ3RCLENBQUM7QUFoTEQsOEJBZ0xDO0FBRUQsU0FBZ0IsS0FBSyxDQUFDLFNBQWlCLEVBQUUsSUFBZTtJQUV2RCxJQUFJLEdBQUcsVUFBVSxDQUFDO1FBQ2pCLElBQUk7S0FDSixDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU3QyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUNwQjtRQUNDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUM5QjtJQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRWhDLE9BQU8sa0JBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ2xDLEdBQUcsRUFBRSxTQUFTO1FBQ2QsS0FBSyxFQUFFLFNBQVM7S0FDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpCRCxzQkFpQkM7QUFFRCxTQUFnQixlQUFlLENBQUMsU0FBaUIsRUFBRSxJQUFlO0lBRWpFLElBQUksR0FBRyxVQUFVLENBQUM7UUFDakIsSUFBSTtRQUNKLGNBQWM7S0FDZCxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU3QyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUNwQjtRQUNDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUM5QjtJQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRWhDLE9BQU8sa0JBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ2xDLEdBQUcsRUFBRSxTQUFTO1FBQ2QsS0FBSyxFQUFFLFNBQVM7S0FDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWxCRCwwQ0FrQkM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxPQUFlO0lBRS9DLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLG1CQUFXLENBQUMsQ0FBQTtBQUM3RCxDQUFDO0FBSEQsNENBR0M7QUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxTQUFpQjtJQUV2RCxhQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTVCLElBQUksUUFBUSxHQUFZLEtBQUssQ0FBQztJQUU5QixJQUFJLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUVwRSxJQUFJLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxJQUFJLFFBQVEsR0FBRyxNQUFNLEVBQUUsQ0FBQztJQUV4Qiw0Q0FBNEM7SUFFNUMsSUFBSSxHQUF3QyxDQUFDO0lBRTdDLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBRXZELElBQUksR0FBRyxFQUNQO1FBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxQixhQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRXBDLElBQUksUUFBZ0IsQ0FBQztRQUVyQixRQUFRLEdBQUcsYUFBYSxDQUFDO1FBRXpCLEdBQUcsQ0FBQyxLQUFLO2FBQ1AsT0FBTyxDQUFDLFVBQVUsS0FBYSxFQUFFLEtBQUssRUFBRSxLQUFLO1lBRTdDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUNGO1FBRUQsUUFBUSxHQUFHLGVBQWUsQ0FBQztRQUUzQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7YUFDdEIsT0FBTyxDQUFDLFVBQVUsV0FBVztZQUU3QixJQUFJLE1BQU0sR0FBRyxRQUFRLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUUxQyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXhDLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3ZCO2dCQUNDLFFBQVEsR0FBRyxRQUFRO3FCQUNqQixNQUFNLENBQUMsVUFBVSxLQUFLO29CQUV0QixJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUVqQyxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDLENBQUM7cUJBQ0QsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNiO2dCQUVELFFBQVE7cUJBQ04sT0FBTyxDQUFDLFVBQVUsS0FBYSxFQUFFLEtBQUssRUFBRSxLQUFLO29CQUU3QyxJQUFJLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2xDLElBQUksUUFBUSxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUM7b0JBRTlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzlDLENBQUMsQ0FBQyxDQUNGO2FBQ0Q7UUFDRixDQUFDLENBQUMsQ0FDRjtLQUNEO0lBRUQsR0FBRyxHQUFHLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTdELElBQUksR0FBRyxFQUNQO1FBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM1QixhQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRXBDLElBQUksUUFBZ0IsQ0FBQztRQUVyQixRQUFRLEdBQUcsYUFBYSxDQUFDO1FBRXpCLEdBQUcsQ0FBQyxLQUFLO2FBQ1AsT0FBTyxDQUFDLFVBQVUsS0FBYSxFQUFFLEtBQUssRUFBRSxLQUFLO1lBRTdDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUNGO1FBRUQsUUFBUSxHQUFHLGVBQWUsQ0FBQztRQUUzQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7YUFDdEIsT0FBTyxDQUFDLFVBQVUsV0FBVztZQUU3QixJQUFJLFdBQVcsSUFBSSxRQUFRLEVBQzNCO2dCQUNDLE9BQU87YUFDUDtZQUVELElBQUksTUFBTSxHQUFHLFFBQVEsR0FBRyxXQUFXLEdBQUcsR0FBRyxDQUFDO1lBRTFDLElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFeEMsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDdkI7Z0JBQ0MsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUV0QixRQUFRLEdBQUcsUUFBUTtxQkFDakIsTUFBTSxDQUFDLFVBQVUsS0FBSztvQkFFdEIsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFFakMsSUFBSSxJQUFJLEVBQ1I7d0JBQ0MsSUFBSSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBRWhDLDJCQUEyQjt3QkFFM0IsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO3FCQUNsRDtvQkFFRCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDLENBQUM7cUJBQ0QsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNiO2dCQUVELElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRTFDLFFBQVE7cUJBQ04sT0FBTyxDQUFDLFVBQVUsS0FBYSxFQUFFLEtBQUssRUFBRSxLQUFLO29CQUU3QyxJQUFJLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ25DLElBQUksUUFBUSxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUM7b0JBRTlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzlDLENBQUMsQ0FBQyxDQUNGO2FBQ0Q7UUFDRixDQUFDLENBQUMsQ0FDRjtLQUNEO0lBRUQsU0FBUyxFQUFFLENBQUMsS0FBYSxFQUFFLFFBQWdCLEVBQUUsSUFBYyxFQUFFLFNBQW1CLEVBQUUsV0FBb0I7UUFFckcsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRW5DLElBQUksSUFBSSxFQUNSO1lBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEMsT0FBTztTQUNQO2FBQ0ksSUFBSSxDQUFDLEtBQUssSUFBSSxRQUFRLElBQUksT0FBTyxJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksUUFBUSxJQUFJLE1BQU0sRUFDcEY7WUFDQyxhQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwQyxPQUFPO1NBQ1A7YUFDSSxJQUFJLFNBQVMsRUFDbEI7WUFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFDMUM7Z0JBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLE9BQU87YUFDUDtZQUVELElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxtQkFBVyxDQUFDLENBQUM7WUFFNUQsaUJBQWlCO1NBQ2pCO1FBRUQsYUFBTyxDQUFDLElBQUksQ0FBQyxjQUFjLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFdkMsSUFBSSxTQUFTLEVBQ2I7WUFDQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2xEO2FBRUQ7WUFDQyxZQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9CO1FBRUQsUUFBUSxHQUFHLElBQUksQ0FBQztJQUNqQixDQUFDO0lBRUQsT0FBTyxRQUFRLENBQUM7QUFDakIsQ0FBQztBQXJMRCx3REFxTEM7QUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLFFBQWtCLEVBQUUsT0FBZ0I7SUFFMUYsSUFBSSxFQUFFLEdBQUcsa0JBQWMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDO1FBQ3pDLFFBQVE7UUFDUixVQUFVO1FBQ1YsWUFBWTtRQUNaLElBQUk7UUFDSixRQUFRLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVTtRQUNyQyxPQUFPO0tBQ1AsQ0FBQyxFQUFFO1FBQ0gsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7SUFFSCxJQUFJLEVBQUUsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ2pDO1FBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFcEMsT0FBTyxJQUFJLENBQUE7S0FDWDtJQUVELElBQUksSUFBSSxHQUFHLHdCQUFnQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV2QyxPQUFPLElBQUk7U0FDVCxLQUFLLENBQUMsbUJBQUUsQ0FBQyxDQUNUO0FBQ0gsQ0FBQztBQXpCRCxrREF5QkM7QUFFRCxTQUFnQixVQUFVLENBQUMsSUFBYztJQUV4QyxPQUFPLElBQUk7U0FDVCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxXQUFXLENBQUM7U0FDckMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQ2xCO0FBQ0gsQ0FBQztBQU5ELGdDQU1DO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsQ0FBVztJQVEzQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFDbkI7UUFDQyxPQUFPLElBQUksQ0FBQztLQUNaO0lBRUQsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFFcEMsSUFBSSxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQzdDO1lBQ0MsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUM7WUFDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN2QjthQUNJLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUN0QztZQUNDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsTUFBTSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pCO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDLEVBQUU7UUFDRixLQUFLLEVBQUUsRUFBRTtRQUNULE9BQU8sRUFBRTtZQUNSLE1BQU0sRUFBRSxFQUFFO1NBQ1Y7S0FDRCxDQUFDLENBQUE7QUFDSCxDQUFDO0FBbENELDRDQWtDQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxTQUFpQjtJQUU1QyxhQUFPLENBQUMsSUFBSSxDQUFDLDBEQUEwRCxDQUFDLENBQUM7SUFDekUsT0FBTyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM1QixPQUFPO1FBQ1AsSUFBSTtRQUNKLEtBQUs7S0FDTCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBWEQsa0NBV0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IHsgTEYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgZ2l0bG9nIGZyb20gJ2dpdGxvZzInO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMsIFNwYXduU3luY1JldHVybnMgfSBmcm9tICcuLic7XG5pbXBvcnQgeyBjcm9zc1NwYXduT3V0cHV0LCBpc0dpdFJvb3QsIGdldENyb3NzU3Bhd25FcnJvciwgSVNwYXduQVN5bmNFcnJvciB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgRW51bVNoYXJlU3RhdGVzLCBzaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBjcm9zc1NwYXduU3luY0dpdCB9IGZyb20gJy4vZ2l0L2Nyb3NzLXNwYXduJztcblxuaW1wb3J0IHsgR0lURUVfVE9LRU4sIE5PX1BVU0gsIE5PVF9ET05FLCBQUk9KRUNUX1JPT1QgfSBmcm9tICcuL2luaXQnO1xuXG5leHBvcnQgY29uc3QgREFURV9GT1JNQVQgPSAnWVlZWS1NTS1ERC1ISC1tbS1zcyc7XG5cbi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNy8wMTcuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHB1c2hHaXQoUkVQT19QQVRIOiBzdHJpbmcsIHJlcG86IHN0cmluZywgZm9yY2U/OiBib29sZWFuKVxue1xuXHRsZXQgYXJndiA9IFtcblx0XHQncHVzaCcsXG5cdFx0Jy0tcHJvZ3Jlc3MnLFxuXHRcdGZvcmNlID8gJy0tZm9yY2UnIDogdW5kZWZpbmVkLFxuXHRcdHJlcG8sXG5cdF07XG5cblx0YXJndiA9IGFyZ3YuZmlsdGVyKHYgPT4gdik7XG5cblx0aWYgKE5PX1BVU0gpXG5cdHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuaOqOmAgSAke3JlcG99YCk7XG5cblx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRyZXR1cm4gY3A7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWxsR2l0KFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncHVsbCcsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoR2l0KFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmNHaXQoJ2dpdCcsIFtcblx0XHQnZmV0Y2gnLFxuXHRcdCctLWZvcmNlJyxcblx0XHQnb3JpZ2luJyxcblx0XHQnbWFzdGVyJyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hHaXRBbGwoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdmZXRjaCcsXG5cdFx0Jy0tYWxsJyxcblx0XHQnLS1wcnVuZScsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0JyYW5jaChSRVBPX1BBVEg6IHN0cmluZywgQlJfTkFNRTogc3RyaW5nKVxue1xuXHRjb25zb2xlLmRlYnVnKGDlmJfoqablu7rnq4vmlrDliIbmlK8gJHtCUl9OQU1FfWApO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdjaGVja291dCcsXG5cdFx0Jy1CJyxcblx0XHRCUl9OQU1FLFxuXHRcdCdvcmlnaW4vbWFzdGVyJyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3Jldi1wYXJzZScsXG5cdFx0Jy0tYWJicmV2LXJlZicsXG5cdFx0J0hFQUQnLFxuXHRdLCB7XG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGxldCBuYW1lID0gY3Jvc3NTcGF3bk91dHB1dChjcC5zdGRvdXQpO1xuXG5cdHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlQnJhbmNoKFJFUE9fUEFUSDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbilcbntcblx0aWYgKG5hbWUgPT0gJ21hc3RlcicgfHwgIW5hbWUpXG5cdHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoKTtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuWIqumZpOacrOWcsOWIhuaUryAke25hbWV9YCk7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J2JyYW5jaCcsXG5cdFx0Zm9yY2UgPyAnLUQnIDogJy1kJyxcblx0XHRuYW1lLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbi8qKlxuICogQEZJWE1FIOS4jeefpemBk+eCuuS7gOm6vOaykuacieWIqumZpCDmiYDku6XlpJrlgZrkuIDmrKHlj6blpJbkuIDnqK7liKrpmaTmraXpqZ9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUJyYW5jaFJlbW90ZShSRVBPX1BBVEg6IHN0cmluZywgcmVtb3RlOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKVxue1xuXHRpZiAobmFtZSA9PSAnbWFzdGVyJyB8fCAhbmFtZSB8fCAhcmVtb3RlKVxuXHR7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCk7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabliKrpmaTpgaDnq6/liIbmlK8gJHtuYW1lfWApO1xuXG5cdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3B1c2gnLFxuXHRcdHJlbW90ZSxcblx0XHQnLS1kZWxldGUnLFxuXHRcdG5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHQvKipcblx0ICog5LiN55+l6YGT54K65LuA6bq85rKS5pyJ5Yiq6ZmkIOaJgOS7peWkmuWBmuS4gOasoeWPpuWkluS4gOeoruWIqumZpOatpempn1xuXHQgKiBodHRwczovL3psYXJnb24uZ2l0Ym9va3MuaW8vZ2l0LXR1dG9yaWFsL2NvbnRlbnQvcmVtb3RlL2RlbGV0ZV9icmFuY2guaHRtbFxuXHQgKi9cblx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncHVzaCcsXG5cdFx0cmVtb3RlLFxuXHRcdCc6JyArIG5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9sZEJyYW5jaChSRVBPX1BBVEg6IHN0cmluZylcbntcblx0bGV0IG5hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShSRVBPX1BBVEgpO1xuXG5cdGlmIChuYW1lLmluZGV4T2YoJ2F1dG8vJykgPT0gMClcblx0e1xuXHRcdHJldHVybiBuYW1lO1xuXHR9XG5cblx0cmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmT3JpZ2luKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRsZXQgbG9nID0gZ2l0bG9nKHtcblx0XHRyZXBvOiBSRVBPX1BBVEgsXG5cdFx0YnJhbmNoOiBbY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIKSwgJ29yaWdpbi9tYXN0ZXInXS5qb2luKCcuLicpLFxuXHRcdG51bWJlcjogMyxcblx0XHRuYW1lU3RhdHVzOiBmYWxzZSxcblx0fSk7XG5cblx0Y29uc29sZS5sb2cobG9nLCBsb2cubGVuZ3RoKTtcblxuXHRyZXR1cm4gbG9nLmxlbmd0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc2hIRUFEKFJFUE9fUEFUSDogc3RyaW5nLCBicmFuY2g6IHN0cmluZyA9ICdIRUFEJylcbntcblx0cmV0dXJuIGdpdGxvZyh7IHJlcG86IFJFUE9fUEFUSCwgbnVtYmVyOiAxLCBicmFuY2ggfSlbMF0uYWJicmV2SGFzaDtcbn1cblxuZXhwb3J0IHR5cGUgSU9wdGlvbnNDcmVhdGVHaXQgPSB7XG5cdHVybDogc3RyaW5nLFxuXHR0YXJnZXRQYXRoOiBzdHJpbmcsXG5cblx0bmV3QnJhbmNoTmFtZTogc3RyaW5nLFxuXG5cdHVybENsb25lPzogc3RyaW5nLFxuXHR1cmxQdXNoPzogc3RyaW5nLFxuXG5cdE5PVF9ET05FLFxuXG5cdENMT05FX0RFUFRIPzogbnVtYmVyLFxuXG5cdExPR0lOX1RPS0VOPzogc3RyaW5nLFxuXG5cdG9uPzoge1xuXHRcdGNyZWF0ZV9iZWZvcmU/KGRhdGE6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJkYXRhXCJdLCB0ZW1wPzogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcInRlbXBcIl0pLFxuXHRcdGNyZWF0ZT8oZGF0YTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcImRhdGFcIl0sIHRlbXA/OiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1widGVtcFwiXSksXG5cdFx0Y3JlYXRlX2FmdGVyPyhkYXRhOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1wiZGF0YVwiXSwgdGVtcD86IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJ0ZW1wXCJdKSxcblx0fSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQdXNoVXJsKHVybDogc3RyaW5nLCBsb2dpbl90b2tlbj86IHN0cmluZylcbntcblx0aWYgKGxvZ2luX3Rva2VuICYmICEvQCQvLnRlc3QobG9naW5fdG9rZW4pKVxuXHR7XG5cdFx0bG9naW5fdG9rZW4gKz0gJ0AnO1xuXHR9XG5cblx0cmV0dXJuIGBodHRwczovLyR7bG9naW5fdG9rZW4gPyBsb2dpbl90b2tlbiA6ICcnfSR7dXJsfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQdXNoVXJsR2l0ZWUodXJsOiBzdHJpbmcsIGxvZ2luX3Rva2VuOiBzdHJpbmcgPSBHSVRFRV9UT0tFTilcbntcblx0cmV0dXJuIGdldFB1c2hVcmwodXJsLCBsb2dpbl90b2tlbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRDaGVja1JlbW90ZShSRVBPX1BBVEg6IHN0cmluZywgcmVtb3RlPzogc3RyaW5nKVxue1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmNHaXQoJ2dpdCcsIFtcblx0XHQnbHMtcmVtb3RlJyxcblx0XHQnLS1leGl0LWNvZGUnLFxuXHRcdCctLWhlYWRzJyxcblx0XHQnLS1xdWlldCcsXG5cdFx0KHJlbW90ZSB8fCAnb3JpZ2luJyksXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdpdChvcHRpb25zOiBJT3B0aW9uc0NyZWF0ZUdpdClcbntcblx0Y29uc3Qgd2FpdF9jcmVhdGVfZ2l0ID0gc2hhcmVTdGF0ZXMoRW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVCk7XG5cblx0d2FpdF9jcmVhdGVfZ2l0LmVuc3VyZSgpO1xuXG5cdGxldCB0YXJnZXROYW1lID0gcGF0aC5iYXNlbmFtZShvcHRpb25zLnRhcmdldFBhdGgpO1xuXHRsZXQgdGFyZ2V0UGF0aCA9IHBhdGgubm9ybWFsaXplKG9wdGlvbnMudGFyZ2V0UGF0aCk7XG5cblx0bGV0IFJFUE9fUEFUSCA9IHRhcmdldFBhdGg7XG5cblx0bGV0IGV4aXN0cyA9IGZzLnBhdGhFeGlzdHNTeW5jKFJFUE9fUEFUSCkgJiYgaXNHaXRSb290KFJFUE9fUEFUSCk7XG5cblx0bGV0IGRhdGEgPSB7XG5cdFx0dGFyZ2V0TmFtZSxcblx0XHR0YXJnZXRQYXRoLFxuXG5cdFx0bmV3QnJhbmNoTmFtZTogb3B0aW9ucy5uZXdCcmFuY2hOYW1lLFxuXG5cdFx0ZXhpc3RzLFxuXHRcdGV4aXN0c0JyYW5jaE5hbWU6IGV4aXN0cyAmJiBvbGRCcmFuY2goUkVQT19QQVRIKSB8fCBudWxsLFxuXG5cdFx0Tk9UX0RPTkUsXG5cblx0XHR1cmw6IG9wdGlvbnMudXJsLFxuXHRcdHVybENsb25lOiBvcHRpb25zLnVybENsb25lLFxuXG5cdFx0TE9HSU5fVE9LRU46IG9wdGlvbnMuTE9HSU5fVE9LRU4sXG5cblx0XHRwdXNoVXJsOiBvcHRpb25zLnVybFB1c2ggfHwgZ2V0UHVzaFVybChvcHRpb25zLnVybCwgb3B0aW9ucy5MT0dJTl9UT0tFTiksXG5cdH07XG5cblx0bGV0IHRlbXA6IHtcblx0XHRjcDogU3Bhd25TeW5jUmV0dXJucyxcblxuXHRcdFtrOiBzdHJpbmddOiBhbnksXG5cdH0gPSB7XG5cdFx0Y3A6IG51bGwsXG5cdH07XG5cblx0bGV0IF9jcF9lcnJvcjogSVNwYXduQVN5bmNFcnJvcjtcblxuXHRsZXQgbGFiZWw6IHN0cmluZztcblxuXHRjb25zb2xlLmluZm8oYGNyZWF0ZSBnaXQ6ICR7dGFyZ2V0TmFtZX1gKTtcblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZV9iZWZvcmUpXG5cdHtcblx0XHRsYWJlbCA9IGAtLS0gQ1JFQVRFX0JFRk9SRSAtLS1gO1xuXHRcdGNvbnNvbGUuaW5mbyhsYWJlbCk7XG5cdFx0Y29uc29sZS50aW1lKGxhYmVsKTtcblx0XHRvcHRpb25zLm9uLmNyZWF0ZV9iZWZvcmUoZGF0YSwgdGVtcCk7XG5cdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblx0fVxuXG5cdGxhYmVsID0gYC0tLSBDUkVBVEUgLS0tYDtcblx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHR0ZW1wLmNwID0gbnVsbDtcblxuXHR0ZW1wLmNwID0gZ2l0Q2hlY2tSZW1vdGUoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnVybENsb25lKTtcblxuXHRfY3BfZXJyb3IgPSBnZXRDcm9zc1NwYXduRXJyb3IodGVtcC5jcCk7XG5cblx0aWYgKF9jcF9lcnJvcilcblx0e1xuXHRcdHRocm93IF9jcF9lcnJvclxuXHR9XG5cblx0bGV0IF9kZWxldGVkOiBib29sZWFuO1xuXG5cdGlmIChkYXRhLk5PVF9ET05FICYmIGRhdGEuZXhpc3RzKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGAke3RhcmdldE5hbWV9IGFscmVhZHkgZXhpc3RzYCk7XG5cblx0XHR0ZW1wLmNwID0gZmV0Y2hHaXQoZGF0YS50YXJnZXRQYXRoKTtcblx0fVxuXHRlbHNlIGlmIChkYXRhLmV4aXN0cylcblx0e1xuXHRcdGNvbnNvbGUud2FybihgJHt0YXJnZXROYW1lfSBhbHJlYWR5IGV4aXN0c2ApO1xuXG5cdFx0Y29uc29sZS5pbmZvKGDlj5blvpfmiYDmnInpgaDnq6/liIbmlK9gKTtcblx0XHRmZXRjaEdpdEFsbChkYXRhLnRhcmdldFBhdGgpO1xuXG5cdFx0X2RlbGV0ZWQgPSBnaXRSZW1vdmVCcmFuY2hPdXRkYXRlKGRhdGEudGFyZ2V0UGF0aCk7XG5cblx0XHR0ZW1wLmNwID0gZmV0Y2hHaXQoZGF0YS50YXJnZXRQYXRoKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRsZXQgQ0xPTkVfREVQVEg6IG51bWJlciA9IChvcHRpb25zLkNMT05FX0RFUFRIIHx8IHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuQ0xPTkVfREVQVEggfHwgNTApIGFzIG51bWJlcjtcblxuXHRcdGlmIChpc05hTihDTE9ORV9ERVBUSCkgfHwgIUNMT05FX0RFUFRIIHx8IENMT05FX0RFUFRIIDw9IDApXG5cdFx0e1xuXHRcdFx0Q0xPTkVfREVQVEggPSA1MDtcblx0XHR9XG5cblx0XHRsZXQgdXJsQ2xvbmUgPSBkYXRhLnVybENsb25lO1xuXG5cdFx0aWYgKCF1cmxDbG9uZSlcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgdXJsQ2xvbmUg5LiN5a2Y5ZyoIOWYl+ippuiHquWLleeUn+aIkGApO1xuXG5cdFx0XHRpZiAoZGF0YS5MT0dJTl9UT0tFTilcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5kZWJ1Zyhg5L2/55SoIExPR0lOX1RPS0VOIOiHquWLleeUn+aIkCB1cmxDbG9uZWApO1xuXHRcdFx0XHR1cmxDbG9uZSA9IGdldFB1c2hVcmwoZGF0YS51cmwsIGRhdGEuTE9HSU5fVE9LRU4pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmRlYnVnKGDkvb/nlKggdXJsIOiHquWLleeUn+aIkCB1cmxDbG9uZWApO1xuXHRcdFx0XHR1cmxDbG9uZSA9IGdldFB1c2hVcmwoZGF0YS51cmwpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRlbXAuY3AgPSBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0J2Nsb25lJyxcblx0XHRcdGAtLWRlcHRoPSR7Q0xPTkVfREVQVEh9YCxcblx0XHRcdC8vJy0tdmVyYm9zZScsXG5cdFx0XHQvLyctLXByb2dyZXNzICcsXG5cdFx0XHR1cmxDbG9uZSxcblx0XHRcdGRhdGEudGFyZ2V0UGF0aCxcblx0XHRdLCB7XG5cdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0Y3dkOiBQUk9KRUNUX1JPT1QsXG5cdFx0fSk7XG5cdH1cblxuXHRfY3BfZXJyb3IgPSBnZXRDcm9zc1NwYXduRXJyb3IodGVtcC5jcCk7XG5cblx0aWYgKF9jcF9lcnJvcilcblx0e1xuXHRcdHRocm93IF9jcF9lcnJvclxuXHR9XG5cblx0aWYgKG9wdGlvbnMub24gJiYgb3B0aW9ucy5vbi5jcmVhdGUpXG5cdHtcblx0XHRvcHRpb25zLm9uLmNyZWF0ZShkYXRhLCB0ZW1wKTtcblx0fVxuXG5cdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cblx0aWYgKG9wdGlvbnMub24gJiYgb3B0aW9ucy5vbi5jcmVhdGVfYWZ0ZXIpXG5cdHtcblx0XHRsYWJlbCA9IGAtLS0gQ1JFQVRFX0FGVEVSIC0tLWA7XG5cdFx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXHRcdG9wdGlvbnMub24uY3JlYXRlX2FmdGVyKGRhdGEsIHRlbXApO1xuXHRcdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cdH1cblxuXHRsYWJlbCA9IGAtLS0gQkVGT1JFX0RPTkUgLS0tYDtcblx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRpZiAoX2RlbGV0ZWQpXG5cdHtcblx0XHRnaXRHY0FnZ3Jlc3NpdmUoZGF0YS50YXJnZXRQYXRoKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRnaXRHYyhkYXRhLnRhcmdldFBhdGgpO1xuXHR9XG5cblx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRsYWJlbCA9IGAtLS0gUkVNT1ZFX1dBSVQgLS0tYDtcblx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHR3YWl0X2NyZWF0ZV9naXQucmVtb3ZlKCk7XG5cblx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRyZXR1cm4geyBkYXRhLCB0ZW1wIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdEdjKFJFUE9fUEFUSDogc3RyaW5nLCBhcmd2Pzogc3RyaW5nW10pXG57XG5cdGFyZ3YgPSBmaWx0ZXJBcmd2KFtcblx0XHQnZ2MnLFxuXHRdLmNvbmNhdCgoYXJndiAmJiBhcmd2Lmxlbmd0aCkgPyBhcmd2IDogW10pKTtcblxuXHRpZiAoYXJndi5sZW5ndGggPT0gMSlcblx0e1xuXHRcdGFyZ3YucHVzaCgnLS1wcnVuZT1cIjMgZGF5c1wiJyk7XG5cdH1cblxuXHRjb25zb2xlLmluZm8oYOWEquWMliBHSVQg6LOH5paZYCwgYXJndik7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBhcmd2LCB7XG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRHY0FnZ3Jlc3NpdmUoUkVQT19QQVRIOiBzdHJpbmcsIGFyZ3Y/OiBzdHJpbmdbXSlcbntcblx0YXJndiA9IGZpbHRlckFyZ3YoW1xuXHRcdCdnYycsXG5cdFx0Jy0tYWdncmVzc2l2ZScsXG5cdF0uY29uY2F0KChhcmd2ICYmIGFyZ3YubGVuZ3RoKSA/IGFyZ3YgOiBbXSkpO1xuXG5cdGlmIChhcmd2Lmxlbmd0aCA9PSAyKVxuXHR7XG5cdFx0YXJndi5wdXNoKCctLXBydW5lPVwiMyBkYXlzXCInKTtcblx0fVxuXG5cdGNvbnNvbGUuaW5mbyhg5YSq5YyWIEdJVCDos4fmlplgLCBhcmd2KTtcblxuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJyYW5jaE5hbWVUb0RhdGUoYnJfbmFtZTogc3RyaW5nKVxue1xuXHRyZXR1cm4gbW9tZW50KGJyX25hbWUucmVwbGFjZSgvXi4qYXV0b1xcLy8sICcnKSwgREFURV9GT1JNQVQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRSZW1vdmVCcmFuY2hPdXRkYXRlKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRjb25zb2xlLmluZm8oYOmWi+Wni+WIhuaekCBHSVQg5YiG5pSvYCk7XG5cblx0bGV0IGRhdGFfcmV0OiBib29sZWFuID0gZmFsc2U7XG5cblx0bGV0IGJyX25hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShSRVBPX1BBVEgpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuXHRsZXQgZGF0ZV9iciA9IGJyYW5jaE5hbWVUb0RhdGUoYnJfbmFtZSk7XG5cdGxldCBkYXRlX25vdyA9IG1vbWVudCgpO1xuXG5cdC8vY29uc29sZS5sb2coe2JyX25hbWUsIGRhdGVfYnIsIGRhdGVfbm93fSk7XG5cblx0bGV0IGJyczogUmV0dXJuVHlwZTx0eXBlb2YgcGFyc2VCcmFuY2hHcm91cD47XG5cblx0YnJzID0gcGFyc2VCcmFuY2hHcm91cChnaXRCcmFuY2hNZXJnZWRMaXN0KFJFUE9fUEFUSCkpO1xuXG5cdGlmIChicnMpXG5cdHtcblx0XHRjb25zb2xlLmxvZyhg5qqi5p+l5Lim5Yiq6Zmk5bey5ZCI5L215YiG5pSvYCk7XG5cdFx0Y29uc29sZS5kaXIoYnJzLCB7IGNvbG9yczogdHJ1ZSwgfSk7XG5cblx0XHRsZXQgcHJlX25hbWU6IHN0cmluZztcblxuXHRcdHByZV9uYW1lID0gJ3JlZnMvaGVhZHMvJztcblxuXHRcdGJycy5oZWFkc1xuXHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcsIGluZGV4LCBhcnJheSlcblx0XHRcdHtcblx0XHRcdFx0Zm4odmFsdWUsIHByZV9uYW1lICsgdmFsdWUpO1xuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRwcmVfbmFtZSA9ICdyZWZzL3JlbW90ZXMvJztcblxuXHRcdE9iamVjdC5rZXlzKGJycy5yZW1vdGVzKVxuXHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHJlbW90ZV9uYW1lKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgcHJlZml4ID0gcHJlX25hbWUgKyByZW1vdGVfbmFtZSArICcvJztcblxuXHRcdFx0XHRsZXQgYnJzX2xpc3QgPSBicnMucmVtb3Rlc1tyZW1vdGVfbmFtZV07XG5cblx0XHRcdFx0aWYgKGJyc19saXN0Lmxlbmd0aCA+IDUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRicnNfbGlzdCA9IGJyc19saXN0XG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uICh2YWx1ZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGJvb2wgPSAvYXV0b1xcLy9pLnRlc3QodmFsdWUpO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiBib29sO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5zbGljZSgwLCAtMilcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRicnNfbGlzdFxuXHRcdFx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcsIGluZGV4LCBhcnJheSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGJvb2wgPSAhL2F1dG9cXC8vaS50ZXN0KHZhbHVlKTtcblx0XHRcdFx0XHRcdFx0bGV0IGRlbF9uYW1lID0gcHJlZml4ICsgdmFsdWU7XG5cblx0XHRcdFx0XHRcdFx0Zm4odmFsdWUsIGRlbF9uYW1lLCBib29sLCB0cnVlLCByZW1vdGVfbmFtZSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cdH1cblxuXHRicnMgPSBwYXJzZUJyYW5jaEdyb3VwKGdpdEJyYW5jaE1lcmdlZExpc3QoUkVQT19QQVRILCB0cnVlKSk7XG5cblx0aWYgKGJycylcblx0e1xuXHRcdGNvbnNvbGUubG9nKGDmqqLmn6XkuKbliKrpmaTmnKrlkIjkvbXpgY7mnJ/liIbmlK9gKTtcblx0XHRjb25zb2xlLmRpcihicnMsIHsgY29sb3JzOiB0cnVlLCB9KTtcblxuXHRcdGxldCBwcmVfbmFtZTogc3RyaW5nO1xuXG5cdFx0cHJlX25hbWUgPSAncmVmcy9oZWFkcy8nO1xuXG5cdFx0YnJzLmhlYWRzXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWU6IHN0cmluZywgaW5kZXgsIGFycmF5KVxuXHRcdFx0e1xuXHRcdFx0XHRmbih2YWx1ZSwgcHJlX25hbWUgKyB2YWx1ZSk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdHByZV9uYW1lID0gJ3JlZnMvcmVtb3Rlcy8nO1xuXG5cdFx0T2JqZWN0LmtleXMoYnJzLnJlbW90ZXMpXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAocmVtb3RlX25hbWUpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChyZW1vdGVfbmFtZSA9PSAnb3JpZ2luJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBwcmVmaXggPSBwcmVfbmFtZSArIHJlbW90ZV9uYW1lICsgJy8nO1xuXG5cdFx0XHRcdGxldCBicnNfbGlzdCA9IGJycy5yZW1vdGVzW3JlbW90ZV9uYW1lXTtcblxuXHRcdFx0XHRpZiAoYnJzX2xpc3QubGVuZ3RoID4gNSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBtYXhfZGF0ZV91bml4ID0gMDtcblxuXHRcdFx0XHRcdGJyc19saXN0ID0gYnJzX2xpc3Rcblx0XHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgYm9vbCA9IC9hdXRvXFwvL2kudGVzdCh2YWx1ZSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKGJvb2wpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZCA9IGJyYW5jaE5hbWVUb0RhdGUodmFsdWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhkLCBkLnVuaXgoKSk7XG5cblx0XHRcdFx0XHRcdFx0XHRtYXhfZGF0ZV91bml4ID0gTWF0aC5tYXgobWF4X2RhdGVfdW5peCwgZC51bml4KCkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJvb2w7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnNsaWNlKDAsIC0zKVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdGxldCBtYXhfZGF0ZSA9IG1vbWVudC51bml4KG1heF9kYXRlX3VuaXgpO1xuXG5cdFx0XHRcdFx0YnJzX2xpc3Rcblx0XHRcdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nLCBpbmRleCwgYXJyYXkpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBib29sID0gIS9eYXV0b1xcLy9pLnRlc3QodmFsdWUpO1xuXHRcdFx0XHRcdFx0XHRsZXQgZGVsX25hbWUgPSBwcmVmaXggKyB2YWx1ZTtcblxuXHRcdFx0XHRcdFx0XHRmbih2YWx1ZSwgZGVsX25hbWUsIGJvb2wsIHRydWUsIHJlbW90ZV9uYW1lKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXG5cdGZ1bmN0aW9uIGZuKHZhbHVlOiBzdHJpbmcsIGRlbF9uYW1lOiBzdHJpbmcsIHNraXA/OiBib29sZWFuLCBpc19yZW1vdGU/OiBib29sZWFuLCByZW1vdGVfbmFtZT86IHN0cmluZylcblx0e1xuXHRcdGxldCB2YWx1ZV9sYyA9IHZhbHVlLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRpZiAoc2tpcClcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhgc2tpcCAoMSkgJHtkZWxfbmFtZX1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoIXZhbHVlIHx8IHZhbHVlX2xjID09IGJyX25hbWUgfHwgdmFsdWVfbGMgPT0gJ21hc3RlcicgfHwgdmFsdWVfbGMgPT0gJ2hlYWQnKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGBza2lwICgyKSAke2RlbF9uYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRlbHNlIGlmIChpc19yZW1vdGUpXG5cdFx0e1xuXHRcdFx0aWYgKCEvYXV0b1xcLy9pLnRlc3QodmFsdWUpIHx8ICFyZW1vdGVfbmFtZSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5sb2coYHNraXAgKDMpICR7ZGVsX25hbWV9YCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGQgPSBtb21lbnQodmFsdWUucmVwbGFjZSgvXi4qYXV0b1xcLy8sICcnKSwgREFURV9GT1JNQVQpO1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGQpO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUuaW5mbyhgdHJ5IGRlbGV0ZSAke2RlbF9uYW1lfWApO1xuXG5cdFx0aWYgKGlzX3JlbW90ZSlcblx0XHR7XG5cdFx0XHRkZWxldGVCcmFuY2hSZW1vdGUoUkVQT19QQVRILCByZW1vdGVfbmFtZSwgdmFsdWUpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZGVsZXRlQnJhbmNoKFJFUE9fUEFUSCwgdmFsdWUpO1xuXHRcdH1cblxuXHRcdGRhdGFfcmV0ID0gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBkYXRhX3JldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdEJyYW5jaE1lcmdlZExpc3QoUkVQT19QQVRIOiBzdHJpbmcsIG5vTWVyZ2VkPzogYm9vbGVhbiwgQlJfTkFNRT86IHN0cmluZylcbntcblx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGZpbHRlckFyZ3YoW1xuXHRcdCdicmFuY2gnLFxuXHRcdCctLWZvcm1hdCcsXG5cdFx0JyUocmVmbmFtZSknLFxuXHRcdCctYScsXG5cdFx0bm9NZXJnZWQgPyAnLS1uby1tZXJnZWQnIDogJy0tbWVyZ2VkJyxcblx0XHRCUl9OQU1FLFxuXHRdKSwge1xuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRpZiAoY3Auc3RkZXJyICYmIGNwLnN0ZGVyci5sZW5ndGgpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGNwLnN0ZGVyci50b1N0cmluZygpKTtcblxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRsZXQgbmFtZSA9IGNyb3NzU3Bhd25PdXRwdXQoY3Auc3Rkb3V0KTtcblxuXHRyZXR1cm4gbmFtZVxuXHRcdC5zcGxpdChMRilcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJBcmd2KGFyZ3Y6IHN0cmluZ1tdKVxue1xuXHRyZXR1cm4gYXJndlxuXHRcdC5maWx0ZXIodiA9PiB0eXBlb2YgdiAhPT0gJ3VuZGVmaW5lZCcpXG5cdFx0Lm1hcCh2ID0+IHYudHJpbSgpKVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQnJhbmNoR3JvdXAocjogc3RyaW5nW10pOiB7XG5cdGhlYWRzOiBzdHJpbmdbXTtcblx0cmVtb3Rlczoge1xuXHRcdG9yaWdpbjogc3RyaW5nW107XG5cdFx0W2s6IHN0cmluZ106IHN0cmluZ1tdO1xuXHR9O1xufVxue1xuXHRpZiAoIXIgfHwgIXIubGVuZ3RoKVxuXHR7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRyZXR1cm4gci5zb3J0KCkucmVkdWNlKGZ1bmN0aW9uIChhLCBiKVxuXHR7XG5cdFx0aWYgKC9ecmVmc1xcL3JlbW90ZXNcXC8oW15cXC9dKylcXC8oLispJC8uZXhlYyhiKSlcblx0XHR7XG5cdFx0XHRsZXQgeyAkMSwgJDIgfSA9IFJlZ0V4cDtcblx0XHRcdGEucmVtb3Rlc1skMV0gPSBhLnJlbW90ZXNbJDFdIHx8IFtdO1xuXHRcdFx0YS5yZW1vdGVzWyQxXS5wdXNoKCQyKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoL15yZWZzXFwvaGVhZHNcXC8oLispJC8uZXhlYyhiKSlcblx0XHR7XG5cdFx0XHRsZXQgeyAkMSwgJDIgfSA9IFJlZ0V4cDtcblx0XHRcdGEuaGVhZHMucHVzaCgkMSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGE7XG5cdH0sIHtcblx0XHRoZWFkczogW10sXG5cdFx0cmVtb3Rlczoge1xuXHRcdFx0b3JpZ2luOiBbXSxcblx0XHR9LFxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0Q2xlYW5BbGwoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGNvbnNvbGUuaW5mbyhgW2dpdDpjbGVhbl0gUmVtb3ZlIHVudHJhY2tlZCBmaWxlcyBmcm9tIHRoZSB3b3JraW5nIHRyZWVgKTtcblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J2NsZWFuJyxcblx0XHQnLWQnLFxuXHRcdCctZngnLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG4iXX0=