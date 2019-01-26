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
const token_1 = require("./git/token");
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
function getPushUrlGitee(url, login_token = token_1.GIT_TOKEN) {
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
function gitSetRemote(REPO_PATH, remoteUrl, remotePushUrl) {
    log_1.default.debug(`嘗試覆寫遠端設定於 ${REPO_PATH}`);
    log_1.default.debug(`移除舊的遠端 origin`);
    __1.crossSpawnSync('git', [
        'remote',
        'rm',
        'origin',
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    log_1.default.debug(`設定遠端 origin`);
    return cross_spawn_1.crossSpawnSyncGit('git', [
        'remote',
        'add',
        '--no-tags',
        'origin',
        remoteUrl,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.gitSetRemote = gitSetRemote;
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
    label = `--- CONFIG ---`;
    log_1.default.info(label);
    log_1.default.time(label);
    gitSetRemote(data.targetPath, data.pushUrl);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQyxtREFBb0M7QUFDcEMsK0JBQStCO0FBQy9CLHFDQUE2QjtBQUM3QiwwQkFBc0Q7QUFDdEQsb0NBQTZGO0FBQzdGLG9DQUFpQztBQUNqQyx3Q0FBNEQ7QUFFNUQsbURBQXNEO0FBRXRELGlDQUFzRTtBQUN0RSx1Q0FBd0M7QUFFM0IsUUFBQSxXQUFXLEdBQUcscUJBQXFCLENBQUM7QUFFakQ7O0dBRUc7QUFFSCxTQUFnQixPQUFPLENBQUMsU0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBZTtJQUV2RSxJQUFJLElBQUksR0FBRztRQUNWLE1BQU07UUFDTixZQUFZO1FBQ1osS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFDN0IsSUFBSTtLQUNKLENBQUM7SUFFRixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTNCLElBQUksY0FBTyxFQUNYO1FBQ0MsT0FBTyxJQUFJLENBQUM7S0FDWjtJQUVELGFBQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRTlCLElBQUksRUFBRSxHQUFHLGtCQUFjLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwQyxLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztJQUVILE9BQU8sRUFBRSxDQUFDO0FBQ1gsQ0FBQztBQXhCRCwwQkF3QkM7QUFFRCxTQUFnQixPQUFPLENBQUMsU0FBaUI7SUFFeEMsT0FBTyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM1QixNQUFNO0tBQ04sRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxD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LE1BQU0sQ0FBQztZQUN4QixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNqQjtRQUVELE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQyxFQUFFO1FBQ0YsS0FBSyxFQUFFLEVBQUU7UUFDVCxPQUFPLEVBQUU7WUFDUixNQUFNLEVBQUUsRUFBRTtTQUNWO0tBQ0QsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQWxDRCw0Q0FrQ0M7QUFFRCxTQUFnQixXQUFXLENBQUMsU0FBaUI7SUFFNUMsYUFBTyxDQUFDLElBQUksQ0FBQywwREFBMEQsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDNUIsT0FBTztRQUNQLElBQUk7UUFDSixLQUFLO0tBQ0wsRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVhELGtDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCB7IExGIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IGdpdGxvZyBmcm9tICdnaXRsb2cyJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jLCBTcGF3blN5bmNSZXR1cm5zIH0gZnJvbSAnLi4nO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bk91dHB1dCwgaXNHaXRSb290LCBnZXRDcm9zc1NwYXduRXJyb3IsIElTcGF3bkFTeW5jRXJyb3IgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IEVudW1TaGFyZVN0YXRlcywgc2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmNHaXQgfSBmcm9tICcuL2dpdC9jcm9zcy1zcGF3bic7XG5cbmltcG9ydCB7IEdJVEVFX1RPS0VOLCBOT19QVVNILCBOT1RfRE9ORSwgUFJPSkVDVF9ST09UIH0gZnJvbSAnLi9pbml0JztcbmltcG9ydCB7IEdJVF9UT0tFTiB9IGZyb20gJy4vZ2l0L3Rva2VuJztcblxuZXhwb3J0IGNvbnN0IERBVEVfRk9STUFUID0gJ1lZWVktTU0tREQtSEgtbW0tc3MnO1xuXG4vKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTcvMDE3LlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBwdXNoR2l0KFJFUE9fUEFUSDogc3RyaW5nLCByZXBvOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbilcbntcblx0bGV0IGFyZ3YgPSBbXG5cdFx0J3B1c2gnLFxuXHRcdCctLXByb2dyZXNzJyxcblx0XHRmb3JjZSA/ICctLWZvcmNlJyA6IHVuZGVmaW5lZCxcblx0XHRyZXBvLFxuXHRdO1xuXG5cdGFyZ3YgPSBhcmd2LmZpbHRlcih2ID0+IHYpO1xuXG5cdGlmIChOT19QVVNIKVxuXHR7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabmjqjpgIEgJHtyZXBvfWApO1xuXG5cdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBhcmd2LCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG5cblx0cmV0dXJuIGNwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHVsbEdpdChSRVBPX1BBVEg6IHN0cmluZylcbntcblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3B1bGwnLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaEdpdChSRVBPX1BBVEg6IHN0cmluZylcbntcblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jR2l0KCdnaXQnLCBbXG5cdFx0J2ZldGNoJyxcblx0XHQnLS1mb3JjZScsXG5cdFx0J29yaWdpbicsXG5cdFx0J21hc3RlcicsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoR2l0QWxsKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmNHaXQoJ2dpdCcsIFtcblx0XHQnZmV0Y2gnLFxuXHRcdCctLWFsbCcsXG5cdFx0Jy0tcHJ1bmUnLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXdCcmFuY2goUkVQT19QQVRIOiBzdHJpbmcsIEJSX05BTUU6IHN0cmluZylcbntcblx0Y29uc29sZS5kZWJ1Zyhg5ZiX6Kmm5bu656uL5paw5YiG5pSvICR7QlJfTkFNRX1gKTtcblxuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQnY2hlY2tvdXQnLFxuXHRcdCctQicsXG5cdFx0QlJfTkFNRSxcblx0XHQnb3JpZ2luL21hc3RlcicsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnRCcmFuY2hOYW1lKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRsZXQgY3AgPSBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdyZXYtcGFyc2UnLFxuXHRcdCctLWFiYnJldi1yZWYnLFxuXHRcdCdIRUFEJyxcblx0XSwge1xuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRsZXQgbmFtZSA9IGNyb3NzU3Bhd25PdXRwdXQoY3Auc3Rkb3V0KTtcblxuXHRyZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUJyYW5jaChSRVBPX1BBVEg6IHN0cmluZywgbmFtZTogc3RyaW5nLCBmb3JjZT86IGJvb2xlYW4pXG57XG5cdGlmIChuYW1lID09ICdtYXN0ZXInIHx8ICFuYW1lKVxuXHR7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCk7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabliKrpmaTmnKzlnLDliIbmlK8gJHtuYW1lfWApO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdicmFuY2gnLFxuXHRcdGZvcmNlID8gJy1EJyA6ICctZCcsXG5cdFx0bmFtZSxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG4vKipcbiAqIEBGSVhNRSDkuI3nn6XpgZPngrrku4DpurzmspLmnInliKrpmaQg5omA5Lul5aSa5YGa5LiA5qyh5Y+m5aSW5LiA56iu5Yiq6Zmk5q2l6amfXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVCcmFuY2hSZW1vdGUoUkVQT19QQVRIOiBzdHJpbmcsIHJlbW90ZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbilcbntcblx0aWYgKG5hbWUgPT0gJ21hc3RlcicgfHwgIW5hbWUgfHwgIXJlbW90ZSlcblx0e1xuXHRcdHRocm93IG5ldyBFcnJvcigpO1xuXHR9XG5cblx0Y29uc29sZS5kZWJ1Zyhg5ZiX6Kmm5Yiq6Zmk6YGg56uv5YiG5pSvICR7bmFtZX1gKTtcblxuXHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdwdXNoJyxcblx0XHRyZW1vdGUsXG5cdFx0Jy0tZGVsZXRlJyxcblx0XHRuYW1lLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG5cblx0LyoqXG5cdCAqIOS4jeefpemBk+eCuuS7gOm6vOaykuacieWIqumZpCDmiYDku6XlpJrlgZrkuIDmrKHlj6blpJbkuIDnqK7liKrpmaTmraXpqZ9cblx0ICogaHR0cHM6Ly96bGFyZ29uLmdpdGJvb2tzLmlvL2dpdC10dXRvcmlhbC9jb250ZW50L3JlbW90ZS9kZWxldGVfYnJhbmNoLmh0bWxcblx0ICovXG5cdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3B1c2gnLFxuXHRcdHJlbW90ZSxcblx0XHQnOicgKyBuYW1lLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbGRCcmFuY2goUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGxldCBuYW1lID0gY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIKTtcblxuXHRpZiAobmFtZS5pbmRleE9mKCdhdXRvLycpID09IDApXG5cdHtcblx0XHRyZXR1cm4gbmFtZTtcblx0fVxuXG5cdHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlmZk9yaWdpbihSRVBPX1BBVEg6IHN0cmluZylcbntcblx0bGV0IGxvZyA9IGdpdGxvZyh7XG5cdFx0cmVwbzogUkVQT19QQVRILFxuXHRcdGJyYW5jaDogW2N1cnJlbnRCcmFuY2hOYW1lKFJFUE9fUEFUSCksICdvcmlnaW4vbWFzdGVyJ10uam9pbignLi4nKSxcblx0XHRudW1iZXI6IDMsXG5cdFx0bmFtZVN0YXR1czogZmFsc2UsXG5cdH0pO1xuXG5cdGNvbnNvbGUubG9nKGxvZywgbG9nLmxlbmd0aCk7XG5cblx0cmV0dXJuIGxvZy5sZW5ndGg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRIYXNoSEVBRChSRVBPX1BBVEg6IHN0cmluZywgYnJhbmNoOiBzdHJpbmcgPSAnSEVBRCcpXG57XG5cdHJldHVybiBnaXRsb2coeyByZXBvOiBSRVBPX1BBVEgsIG51bWJlcjogMSwgYnJhbmNoIH0pWzBdLmFiYnJldkhhc2g7XG59XG5cbmV4cG9ydCB0eXBlIElPcHRpb25zQ3JlYXRlR2l0ID0ge1xuXHR1cmw6IHN0cmluZyxcblx0dGFyZ2V0UGF0aDogc3RyaW5nLFxuXG5cdG5ld0JyYW5jaE5hbWU6IHN0cmluZyxcblxuXHR1cmxDbG9uZT86IHN0cmluZyxcblx0dXJsUHVzaD86IHN0cmluZyxcblxuXHROT1RfRE9ORSxcblxuXHRDTE9ORV9ERVBUSD86IG51bWJlcixcblxuXHRMT0dJTl9UT0tFTj86IHN0cmluZyxcblxuXHRvbj86IHtcblx0XHRjcmVhdGVfYmVmb3JlPyhkYXRhOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1wiZGF0YVwiXSwgdGVtcD86IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJ0ZW1wXCJdKSxcblx0XHRjcmVhdGU/KGRhdGE6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJkYXRhXCJdLCB0ZW1wPzogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcInRlbXBcIl0pLFxuXHRcdGNyZWF0ZV9hZnRlcj8oZGF0YTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcImRhdGFcIl0sIHRlbXA/OiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1widGVtcFwiXSksXG5cdH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHVzaFVybCh1cmw6IHN0cmluZywgbG9naW5fdG9rZW4/OiBzdHJpbmcpXG57XG5cdGlmIChsb2dpbl90b2tlbiAmJiAhL0AkLy50ZXN0KGxvZ2luX3Rva2VuKSlcblx0e1xuXHRcdGxvZ2luX3Rva2VuICs9ICdAJztcblx0fVxuXG5cdHJldHVybiBgaHR0cHM6Ly8ke2xvZ2luX3Rva2VuID8gbG9naW5fdG9rZW4gOiAnJ30ke3VybH1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHVzaFVybEdpdGVlKHVybDogc3RyaW5nLCBsb2dpbl90b2tlbjogc3RyaW5nID0gR0lUX1RPS0VOKVxue1xuXHRyZXR1cm4gZ2V0UHVzaFVybCh1cmwsIGxvZ2luX3Rva2VuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdENoZWNrUmVtb3RlKFJFUE9fUEFUSDogc3RyaW5nLCByZW1vdGU/OiBzdHJpbmcpXG57XG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdscy1yZW1vdGUnLFxuXHRcdCctLWV4aXQtY29kZScsXG5cdFx0Jy0taGVhZHMnLFxuXHRcdCctLXF1aWV0Jyxcblx0XHQocmVtb3RlIHx8ICdvcmlnaW4nKSxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0U2V0UmVtb3RlKFJFUE9fUEFUSDogc3RyaW5nLCByZW1vdGVVcmw6IHN0cmluZywgcmVtb3RlUHVzaFVybD86IHN0cmluZylcbntcblx0Y29uc29sZS5kZWJ1Zyhg5ZiX6Kmm6KaG5a+r6YGg56uv6Kit5a6a5pa8ICR7UkVQT19QQVRIfWApO1xuXG5cdGNvbnNvbGUuZGVidWcoYOenu+mZpOiIiueahOmBoOerryBvcmlnaW5gKTtcblxuXHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdyZW1vdGUnLFxuXHRcdCdybScsXG5cdFx0J29yaWdpbicsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRjb25zb2xlLmRlYnVnKGDoqK3lrprpgaDnq68gb3JpZ2luYCk7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jR2l0KCdnaXQnLCBbXG5cdFx0J3JlbW90ZScsXG5cdFx0J2FkZCcsXG5cdFx0Jy0tbm8tdGFncycsXG5cdFx0J29yaWdpbicsXG5cdFx0cmVtb3RlVXJsLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHaXQob3B0aW9uczogSU9wdGlvbnNDcmVhdGVHaXQpXG57XG5cdGNvbnN0IHdhaXRfY3JlYXRlX2dpdCA9IHNoYXJlU3RhdGVzKEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVQpO1xuXG5cdHdhaXRfY3JlYXRlX2dpdC5lbnN1cmUoKTtcblxuXHRsZXQgdGFyZ2V0TmFtZSA9IHBhdGguYmFzZW5hbWUob3B0aW9ucy50YXJnZXRQYXRoKTtcblx0bGV0IHRhcmdldFBhdGggPSBwYXRoLm5vcm1hbGl6ZShvcHRpb25zLnRhcmdldFBhdGgpO1xuXG5cdGxldCBSRVBPX1BBVEggPSB0YXJnZXRQYXRoO1xuXG5cdGxldCBleGlzdHMgPSBmcy5wYXRoRXhpc3RzU3luYyhSRVBPX1BBVEgpICYmIGlzR2l0Um9vdChSRVBPX1BBVEgpO1xuXG5cdGxldCBkYXRhID0ge1xuXHRcdHRhcmdldE5hbWUsXG5cdFx0dGFyZ2V0UGF0aCxcblxuXHRcdG5ld0JyYW5jaE5hbWU6IG9wdGlvbnMubmV3QnJhbmNoTmFtZSxcblxuXHRcdGV4aXN0cyxcblx0XHRleGlzdHNCcmFuY2hOYW1lOiBleGlzdHMgJiYgb2xkQnJhbmNoKFJFUE9fUEFUSCkgfHwgbnVsbCxcblxuXHRcdE5PVF9ET05FLFxuXG5cdFx0dXJsOiBvcHRpb25zLnVybCxcblx0XHR1cmxDbG9uZTogb3B0aW9ucy51cmxDbG9uZSxcblxuXHRcdExPR0lOX1RPS0VOOiBvcHRpb25zLkxPR0lOX1RPS0VOLFxuXG5cdFx0cHVzaFVybDogb3B0aW9ucy51cmxQdXNoIHx8IGdldFB1c2hVcmwob3B0aW9ucy51cmwsIG9wdGlvbnMuTE9HSU5fVE9LRU4pLFxuXHR9O1xuXG5cdGxldCB0ZW1wOiB7XG5cdFx0Y3A6IFNwYXduU3luY1JldHVybnMsXG5cblx0XHRbazogc3RyaW5nXTogYW55LFxuXHR9ID0ge1xuXHRcdGNwOiBudWxsLFxuXHR9O1xuXG5cdGxldCBfY3BfZXJyb3I6IElTcGF3bkFTeW5jRXJyb3I7XG5cblx0bGV0IGxhYmVsOiBzdHJpbmc7XG5cblx0bGFiZWwgPSBgLS0tIENPTkZJRyAtLS1gO1xuXG5cdGNvbnNvbGUuaW5mbyhsYWJlbCk7XG5cdGNvbnNvbGUudGltZShsYWJlbCk7XG5cblx0Z2l0U2V0UmVtb3RlKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5wdXNoVXJsKTtcblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdGNvbnNvbGUuaW5mbyhgY3JlYXRlIGdpdDogJHt0YXJnZXROYW1lfWApO1xuXG5cdGlmIChvcHRpb25zLm9uICYmIG9wdGlvbnMub24uY3JlYXRlX2JlZm9yZSlcblx0e1xuXHRcdGxhYmVsID0gYC0tLSBDUkVBVEVfQkVGT1JFIC0tLWA7XG5cdFx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXHRcdG9wdGlvbnMub24uY3JlYXRlX2JlZm9yZShkYXRhLCB0ZW1wKTtcblx0XHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXHR9XG5cblx0bGFiZWwgPSBgLS0tIENSRUFURSAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdHRlbXAuY3AgPSBudWxsO1xuXG5cdHRlbXAuY3AgPSBnaXRDaGVja1JlbW90ZShkYXRhLnRhcmdldFBhdGgsIGRhdGEudXJsQ2xvbmUpO1xuXG5cdF9jcF9lcnJvciA9IGdldENyb3NzU3Bhd25FcnJvcih0ZW1wLmNwKTtcblxuXHRpZiAoX2NwX2Vycm9yKVxuXHR7XG5cdFx0dGhyb3cgX2NwX2Vycm9yXG5cdH1cblxuXHRsZXQgX2RlbGV0ZWQ6IGJvb2xlYW47XG5cblx0aWYgKGRhdGEuTk9UX0RPTkUgJiYgZGF0YS5leGlzdHMpXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYCR7dGFyZ2V0TmFtZX0gYWxyZWFkeSBleGlzdHNgKTtcblxuXHRcdHRlbXAuY3AgPSBmZXRjaEdpdChkYXRhLnRhcmdldFBhdGgpO1xuXHR9XG5cdGVsc2UgaWYgKGRhdGEuZXhpc3RzKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGAke3RhcmdldE5hbWV9IGFscmVhZHkgZXhpc3RzYCk7XG5cblx0XHRjb25zb2xlLmluZm8oYOWPluW+l+aJgOaciemBoOerr+WIhuaUr2ApO1xuXHRcdGZldGNoR2l0QWxsKGRhdGEudGFyZ2V0UGF0aCk7XG5cblx0XHRfZGVsZXRlZCA9IGdpdFJlbW92ZUJyYW5jaE91dGRhdGUoZGF0YS50YXJnZXRQYXRoKTtcblxuXHRcdHRlbXAuY3AgPSBmZXRjaEdpdChkYXRhLnRhcmdldFBhdGgpO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxldCBDTE9ORV9ERVBUSDogbnVtYmVyID0gKG9wdGlvbnMuQ0xPTkVfREVQVEggfHwgcHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5DTE9ORV9ERVBUSCB8fCA1MCkgYXMgbnVtYmVyO1xuXG5cdFx0aWYgKGlzTmFOKENMT05FX0RFUFRIKSB8fCAhQ0xPTkVfREVQVEggfHwgQ0xPTkVfREVQVEggPD0gMClcblx0XHR7XG5cdFx0XHRDTE9ORV9ERVBUSCA9IDUwO1xuXHRcdH1cblxuXHRcdGxldCB1cmxDbG9uZSA9IGRhdGEudXJsQ2xvbmU7XG5cblx0XHRpZiAoIXVybENsb25lKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGB1cmxDbG9uZSDkuI3lrZjlnKgg5ZiX6Kmm6Ieq5YuV55Sf5oiQYCk7XG5cblx0XHRcdGlmIChkYXRhLkxPR0lOX1RPS0VOKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmRlYnVnKGDkvb/nlKggTE9HSU5fVE9LRU4g6Ieq5YuV55Sf5oiQIHVybENsb25lYCk7XG5cdFx0XHRcdHVybENsb25lID0gZ2V0UHVzaFVybChkYXRhLnVybCwgZGF0YS5MT0dJTl9UT0tFTik7XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZGVidWcoYOS9v+eUqCB1cmwg6Ieq5YuV55Sf5oiQIHVybENsb25lYCk7XG5cdFx0XHRcdHVybENsb25lID0gZ2V0UHVzaFVybChkYXRhLnVybCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGVtcC5jcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHQnY2xvbmUnLFxuXHRcdFx0YC0tZGVwdGg9JHtDTE9ORV9ERVBUSH1gLFxuXHRcdFx0Ly8nLS12ZXJib3NlJyxcblx0XHRcdC8vJy0tcHJvZ3Jlc3MgJyxcblx0XHRcdHVybENsb25lLFxuXHRcdFx0ZGF0YS50YXJnZXRQYXRoLFxuXHRcdF0sIHtcblx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRjd2Q6IFBST0pFQ1RfUk9PVCxcblx0XHR9KTtcblx0fVxuXG5cdF9jcF9lcnJvciA9IGdldENyb3NzU3Bhd25FcnJvcih0ZW1wLmNwKTtcblxuXHRpZiAoX2NwX2Vycm9yKVxuXHR7XG5cdFx0dGhyb3cgX2NwX2Vycm9yXG5cdH1cblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZSlcblx0e1xuXHRcdG9wdGlvbnMub24uY3JlYXRlKGRhdGEsIHRlbXApO1xuXHR9XG5cblx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZV9hZnRlcilcblx0e1xuXHRcdGxhYmVsID0gYC0tLSBDUkVBVEVfQUZURVIgLS0tYDtcblx0XHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cdFx0b3B0aW9ucy5vbi5jcmVhdGVfYWZ0ZXIoZGF0YSwgdGVtcCk7XG5cdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblx0fVxuXG5cdGxhYmVsID0gYC0tLSBCRUZPUkVfRE9ORSAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdGlmIChfZGVsZXRlZClcblx0e1xuXHRcdGdpdEdjQWdncmVzc2l2ZShkYXRhLnRhcmdldFBhdGgpO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGdpdEdjKGRhdGEudGFyZ2V0UGF0aCk7XG5cdH1cblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdGxhYmVsID0gYC0tLSBSRU1PVkVfV0FJVCAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdHdhaXRfY3JlYXRlX2dpdC5yZW1vdmUoKTtcblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdHJldHVybiB7IGRhdGEsIHRlbXAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0R2MoUkVQT19QQVRIOiBzdHJpbmcsIGFyZ3Y/OiBzdHJpbmdbXSlcbntcblx0YXJndiA9IGZpbHRlckFyZ3YoW1xuXHRcdCdnYycsXG5cdF0uY29uY2F0KChhcmd2ICYmIGFyZ3YubGVuZ3RoKSA/IGFyZ3YgOiBbXSkpO1xuXG5cdGlmIChhcmd2Lmxlbmd0aCA9PSAxKVxuXHR7XG5cdFx0YXJndi5wdXNoKCctLXBydW5lPVwiMyBkYXlzXCInKTtcblx0fVxuXG5cdGNvbnNvbGUuaW5mbyhg5YSq5YyWIEdJVCDos4fmlplgLCBhcmd2KTtcblxuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdEdjQWdncmVzc2l2ZShSRVBPX1BBVEg6IHN0cmluZywgYXJndj86IHN0cmluZ1tdKVxue1xuXHRhcmd2ID0gZmlsdGVyQXJndihbXG5cdFx0J2djJyxcblx0XHQnLS1hZ2dyZXNzaXZlJyxcblx0XS5jb25jYXQoKGFyZ3YgJiYgYXJndi5sZW5ndGgpID8gYXJndiA6IFtdKSk7XG5cblx0aWYgKGFyZ3YubGVuZ3RoID09IDIpXG5cdHtcblx0XHRhcmd2LnB1c2goJy0tcHJ1bmU9XCIzIGRheXNcIicpO1xuXHR9XG5cblx0Y29uc29sZS5pbmZvKGDlhKrljJYgR0lUIOizh+aWmWAsIGFyZ3YpO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgYXJndiwge1xuXHRcdGN3ZDogUkVQT19QQVRILFxuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnJhbmNoTmFtZVRvRGF0ZShicl9uYW1lOiBzdHJpbmcpXG57XG5cdHJldHVybiBtb21lbnQoYnJfbmFtZS5yZXBsYWNlKC9eLiphdXRvXFwvLywgJycpLCBEQVRFX0ZPUk1BVClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdFJlbW92ZUJyYW5jaE91dGRhdGUoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGNvbnNvbGUuaW5mbyhg6ZaL5aeL5YiG5p6QIEdJVCDliIbmlK9gKTtcblxuXHRsZXQgZGF0YV9yZXQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRsZXQgYnJfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKFJFUE9fUEFUSCkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXG5cdGxldCBkYXRlX2JyID0gYnJhbmNoTmFtZVRvRGF0ZShicl9uYW1lKTtcblx0bGV0IGRhdGVfbm93ID0gbW9tZW50KCk7XG5cblx0Ly9jb25zb2xlLmxvZyh7YnJfbmFtZSwgZGF0ZV9iciwgZGF0ZV9ub3d9KTtcblxuXHRsZXQgYnJzOiBSZXR1cm5UeXBlPHR5cGVvZiBwYXJzZUJyYW5jaEdyb3VwPjtcblxuXHRicnMgPSBwYXJzZUJyYW5jaEdyb3VwKGdpdEJyYW5jaE1lcmdlZExpc3QoUkVQT19QQVRIKSk7XG5cblx0aWYgKGJycylcblx0e1xuXHRcdGNvbnNvbGUubG9nKGDmqqLmn6XkuKbliKrpmaTlt7LlkIjkvbXliIbmlK9gKTtcblx0XHRjb25zb2xlLmRpcihicnMsIHsgY29sb3JzOiB0cnVlLCB9KTtcblxuXHRcdGxldCBwcmVfbmFtZTogc3RyaW5nO1xuXG5cdFx0cHJlX25hbWUgPSAncmVmcy9oZWFkcy8nO1xuXG5cdFx0YnJzLmhlYWRzXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWU6IHN0cmluZywgaW5kZXgsIGFycmF5KVxuXHRcdFx0e1xuXHRcdFx0XHRmbih2YWx1ZSwgcHJlX25hbWUgKyB2YWx1ZSk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdHByZV9uYW1lID0gJ3JlZnMvcmVtb3Rlcy8nO1xuXG5cdFx0T2JqZWN0LmtleXMoYnJzLnJlbW90ZXMpXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAocmVtb3RlX25hbWUpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBwcmVmaXggPSBwcmVfbmFtZSArIHJlbW90ZV9uYW1lICsgJy8nO1xuXG5cdFx0XHRcdGxldCBicnNfbGlzdCA9IGJycy5yZW1vdGVzW3JlbW90ZV9uYW1lXTtcblxuXHRcdFx0XHRpZiAoYnJzX2xpc3QubGVuZ3RoID4gNSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJyc19saXN0ID0gYnJzX2xpc3Rcblx0XHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgYm9vbCA9IC9hdXRvXFwvL2kudGVzdCh2YWx1ZSk7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJvb2w7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnNsaWNlKDAsIC0yKVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdGJyc19saXN0XG5cdFx0XHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWU6IHN0cmluZywgaW5kZXgsIGFycmF5KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgYm9vbCA9ICEvYXV0b1xcLy9pLnRlc3QodmFsdWUpO1xuXHRcdFx0XHRcdFx0XHRsZXQgZGVsX25hbWUgPSBwcmVmaXggKyB2YWx1ZTtcblxuXHRcdFx0XHRcdFx0XHRmbih2YWx1ZSwgZGVsX25hbWUsIGJvb2wsIHRydWUsIHJlbW90ZV9uYW1lKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXG5cdGJycyA9IHBhcnNlQnJhbmNoR3JvdXAoZ2l0QnJhbmNoTWVyZ2VkTGlzdChSRVBPX1BBVEgsIHRydWUpKTtcblxuXHRpZiAoYnJzKVxuXHR7XG5cdFx0Y29uc29sZS5sb2coYOaqouafpeS4puWIqumZpOacquWQiOS9temBjuacn+WIhuaUr2ApO1xuXHRcdGNvbnNvbGUuZGlyKGJycywgeyBjb2xvcnM6IHRydWUsIH0pO1xuXG5cdFx0bGV0IHByZV9uYW1lOiBzdHJpbmc7XG5cblx0XHRwcmVfbmFtZSA9ICdyZWZzL2hlYWRzLyc7XG5cblx0XHRicnMuaGVhZHNcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nLCBpbmRleCwgYXJyYXkpXG5cdFx0XHR7XG5cdFx0XHRcdGZuKHZhbHVlLCBwcmVfbmFtZSArIHZhbHVlKTtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0cHJlX25hbWUgPSAncmVmcy9yZW1vdGVzLyc7XG5cblx0XHRPYmplY3Qua2V5cyhicnMucmVtb3Rlcylcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChyZW1vdGVfbmFtZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKHJlbW90ZV9uYW1lID09ICdvcmlnaW4nKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHByZWZpeCA9IHByZV9uYW1lICsgcmVtb3RlX25hbWUgKyAnLyc7XG5cblx0XHRcdFx0bGV0IGJyc19saXN0ID0gYnJzLnJlbW90ZXNbcmVtb3RlX25hbWVdO1xuXG5cdFx0XHRcdGlmIChicnNfbGlzdC5sZW5ndGggPiA1KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG1heF9kYXRlX3VuaXggPSAwO1xuXG5cdFx0XHRcdFx0YnJzX2xpc3QgPSBicnNfbGlzdFxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbiAodmFsdWUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBib29sID0gL2F1dG9cXC8vaS50ZXN0KHZhbHVlKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoYm9vbClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBkID0gYnJhbmNoTmFtZVRvRGF0ZSh2YWx1ZSk7XG5cblx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGQsIGQudW5peCgpKTtcblxuXHRcdFx0XHRcdFx0XHRcdG1heF9kYXRlX3VuaXggPSBNYXRoLm1heChtYXhfZGF0ZV91bml4LCBkLnVuaXgoKSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYm9vbDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuc2xpY2UoMCwgLTMpXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0bGV0IG1heF9kYXRlID0gbW9tZW50LnVuaXgobWF4X2RhdGVfdW5peCk7XG5cblx0XHRcdFx0XHRicnNfbGlzdFxuXHRcdFx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcsIGluZGV4LCBhcnJheSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGJvb2wgPSAhL15hdXRvXFwvL2kudGVzdCh2YWx1ZSk7XG5cdFx0XHRcdFx0XHRcdGxldCBkZWxfbmFtZSA9IHByZWZpeCArIHZhbHVlO1xuXG5cdFx0XHRcdFx0XHRcdGZuKHZhbHVlLCBkZWxfbmFtZSwgYm9vbCwgdHJ1ZSwgcmVtb3RlX25hbWUpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZm4odmFsdWU6IHN0cmluZywgZGVsX25hbWU6IHN0cmluZywgc2tpcD86IGJvb2xlYW4sIGlzX3JlbW90ZT86IGJvb2xlYW4sIHJlbW90ZV9uYW1lPzogc3RyaW5nKVxuXHR7XG5cdFx0bGV0IHZhbHVlX2xjID0gdmFsdWUudG9Mb3dlckNhc2UoKTtcblxuXHRcdGlmIChza2lwKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGBza2lwICgxKSAke2RlbF9uYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRlbHNlIGlmICghdmFsdWUgfHwgdmFsdWVfbGMgPT0gYnJfbmFtZSB8fCB2YWx1ZV9sYyA9PSAnbWFzdGVyJyB8fCB2YWx1ZV9sYyA9PSAnaGVhZCcpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYHNraXAgKDIpICR7ZGVsX25hbWV9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGlzX3JlbW90ZSlcblx0XHR7XG5cdFx0XHRpZiAoIS9hdXRvXFwvL2kudGVzdCh2YWx1ZSkgfHwgIXJlbW90ZV9uYW1lKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgc2tpcCAoMykgJHtkZWxfbmFtZX1gKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgZCA9IG1vbWVudCh2YWx1ZS5yZXBsYWNlKC9eLiphdXRvXFwvLywgJycpLCBEQVRFX0ZPUk1BVCk7XG5cblx0XHRcdC8vY29uc29sZS5sb2coZCk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5pbmZvKGB0cnkgZGVsZXRlICR7ZGVsX25hbWV9YCk7XG5cblx0XHRpZiAoaXNfcmVtb3RlKVxuXHRcdHtcblx0XHRcdGRlbGV0ZUJyYW5jaFJlbW90ZShSRVBPX1BBVEgsIHJlbW90ZV9uYW1lLCB2YWx1ZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRkZWxldGVCcmFuY2goUkVQT19QQVRILCB2YWx1ZSk7XG5cdFx0fVxuXG5cdFx0ZGF0YV9yZXQgPSB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGRhdGFfcmV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0QnJhbmNoTWVyZ2VkTGlzdChSRVBPX1BBVEg6IHN0cmluZywgbm9NZXJnZWQ/OiBib29sZWFuLCBCUl9OQU1FPzogc3RyaW5nKVxue1xuXHRsZXQgY3AgPSBjcm9zc1NwYXduU3luYygnZ2l0JywgZmlsdGVyQXJndihbXG5cdFx0J2JyYW5jaCcsXG5cdFx0Jy0tZm9ybWF0Jyxcblx0XHQnJShyZWZuYW1lKScsXG5cdFx0Jy1hJyxcblx0XHRub01lcmdlZCA/ICctLW5vLW1lcmdlZCcgOiAnLS1tZXJnZWQnLFxuXHRcdEJSX05BTUUsXG5cdF0pLCB7XG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGlmIChjcC5zdGRlcnIgJiYgY3Auc3RkZXJyLmxlbmd0aClcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoY3Auc3RkZXJyLnRvU3RyaW5nKCkpO1xuXG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdGxldCBuYW1lID0gY3Jvc3NTcGF3bk91dHB1dChjcC5zdGRvdXQpO1xuXG5cdHJldHVybiBuYW1lXG5cdFx0LnNwbGl0KExGKVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckFyZ3YoYXJndjogc3RyaW5nW10pXG57XG5cdHJldHVybiBhcmd2XG5cdFx0LmZpbHRlcih2ID0+IHR5cGVvZiB2ICE9PSAndW5kZWZpbmVkJylcblx0XHQubWFwKHYgPT4gdi50cmltKCkpXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VCcmFuY2hHcm91cChyOiBzdHJpbmdbXSk6IHtcblx0aGVhZHM6IHN0cmluZ1tdO1xuXHRyZW1vdGVzOiB7XG5cdFx0b3JpZ2luOiBzdHJpbmdbXTtcblx0XHRbazogc3RyaW5nXTogc3RyaW5nW107XG5cdH07XG59XG57XG5cdGlmICghciB8fCAhci5sZW5ndGgpXG5cdHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdHJldHVybiByLnNvcnQoKS5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpXG5cdHtcblx0XHRpZiAoL15yZWZzXFwvcmVtb3Rlc1xcLyhbXlxcL10rKVxcLyguKykkLy5leGVjKGIpKVxuXHRcdHtcblx0XHRcdGxldCB7ICQxLCAkMiB9ID0gUmVnRXhwO1xuXHRcdFx0YS5yZW1vdGVzWyQxXSA9IGEucmVtb3Rlc1skMV0gfHwgW107XG5cdFx0XHRhLnJlbW90ZXNbJDFdLnB1c2goJDIpO1xuXHRcdH1cblx0XHRlbHNlIGlmICgvXnJlZnNcXC9oZWFkc1xcLyguKykkLy5leGVjKGIpKVxuXHRcdHtcblx0XHRcdGxldCB7ICQxLCAkMiB9ID0gUmVnRXhwO1xuXHRcdFx0YS5oZWFkcy5wdXNoKCQxKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYTtcblx0fSwge1xuXHRcdGhlYWRzOiBbXSxcblx0XHRyZW1vdGVzOiB7XG5cdFx0XHRvcmlnaW46IFtdLFxuXHRcdH0sXG5cdH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRDbGVhbkFsbChSRVBPX1BBVEg6IHN0cmluZylcbntcblx0Y29uc29sZS5pbmZvKGBbZ2l0OmNsZWFuXSBSZW1vdmUgdW50cmFja2VkIGZpbGVzIGZyb20gdGhlIHdvcmtpbmcgdHJlZWApO1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQnY2xlYW4nLFxuXHRcdCctZCcsXG5cdFx0Jy1meCcsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cbiJdfQ==