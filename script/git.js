"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
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
const token_1 = require("./git/token");
const init_1 = require("./init");
__export(require("./git/lib"));
exports.DATE_FORMAT = 'YYYY-MM-DD-HH-mm-ss';
/**
 * Created by user on 2018/5/17/017.
 */
function pushGit(REPO_PATH, repo, force, upstream = true) {
    let argv = [
        'push',
        upstream && '-u',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQWdDO0FBQ2hDLGlDQUFrQztBQUNsQywrQkFBZ0M7QUFDaEMsbURBQW9DO0FBQ3BDLHFDQUE2QjtBQUM3QiwwQkFBc0Q7QUFDdEQsb0NBQTZGO0FBQzdGLG9DQUFpQztBQUNqQyx3Q0FBNEQ7QUFDNUQsc0NBQXlDO0FBQ3pDLG1EQUFzRDtBQUN0RCxtQ0FBeUM7QUFDekMsdUNBQXdDO0FBRXhDLGlDQUF5RDtBQUV6RCwrQkFBMEI7QUFFYixRQUFBLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQztBQUVqRDs7R0FFRztBQUVILFNBQWdCLE9BQU8sQ0FBQyxTQUFpQixFQUFFLElBQVksRUFBRSxLQUFlLEVBQUUsV0FBb0IsSUFBSTtJQUVqRyxJQUFJLElBQUksR0FBRztRQUNWLE1BQU07UUFDTixRQUFRLElBQUksSUFBSTtRQUNoQixZQUFZO1FBQ1osS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFDN0IsSUFBSTtLQUNKLENBQUM7SUFFRixJQUFJLEdBQUcsaUJBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV4QixJQUFJLGNBQU8sRUFDWDtRQUNDLE9BQU8sSUFBSSxDQUFDO0tBQ1o7SUFFRCxhQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUU5QixJQUFJLEVBQUUsR0FBRyxrQkFBYyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEMsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7SUFFSCxPQUFPLEVBQUUsQ0FBQztBQUNYLENBQUM7QUF6QkQsMEJBeUJDO0FBRUQsU0FBZ0IsT0FBTyxDQUFDLFNBQWlCO0lBRXhDLE9BQU8sa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDNUIsTUFBTTtLQUNOLEVBQUU7UUFD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QUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFFcEMsSUFBSSxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQzdDO1lBQ0MsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUM7WUFDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN2QjthQUNJLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUN0QztZQUNDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsTUFBTSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pCO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDLEVBQUU7UUFDRixLQUFLLEVBQUUsRUFBRTtRQUNULE9BQU8sRUFBRTtZQUNSLE1BQU0sRUFBRSxFQUFFO1NBQ1Y7S0FDRCxDQUFDLENBQUE7QUFDSCxDQUFDO0FBbENELDRDQWtDQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxTQUFpQjtJQUU1QyxhQUFPLENBQUMsSUFBSSxDQUFDLDBEQUEwRCxDQUFDLENBQUM7SUFDekUsT0FBTyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUM1QixPQUFPO1FBQ1AsSUFBSTtRQUNKLEtBQUs7S0FDTCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBWEQsa0NBV0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCB7IExGIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IGdpdGxvZyBmcm9tICdnaXRsb2cyJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jLCBTcGF3blN5bmNSZXR1cm5zIH0gZnJvbSAnLi4nO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bk91dHB1dCwgZ2V0Q3Jvc3NTcGF3bkVycm9yLCBpc0dpdFJvb3QsIElTcGF3bkFTeW5jRXJyb3IgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IEVudW1TaGFyZVN0YXRlcywgc2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgZmlsdGVyQXJndiB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jR2l0IH0gZnJvbSAnLi9naXQvY3Jvc3Mtc3Bhd24nO1xuaW1wb3J0IHsgZ2l0U2V0UmVtb3RlIH0gZnJvbSAnLi9naXQvbGliJztcbmltcG9ydCB7IEdJVF9UT0tFTiB9IGZyb20gJy4vZ2l0L3Rva2VuJztcblxuaW1wb3J0IHsgTk9fUFVTSCwgTk9UX0RPTkUsIFBST0pFQ1RfUk9PVCB9IGZyb20gJy4vaW5pdCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vZ2l0L2xpYic7XG5cbmV4cG9ydCBjb25zdCBEQVRFX0ZPUk1BVCA9ICdZWVlZLU1NLURELUhILW1tLXNzJztcblxuLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC81LzE3LzAxNy5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gcHVzaEdpdChSRVBPX1BBVEg6IHN0cmluZywgcmVwbzogc3RyaW5nLCBmb3JjZT86IGJvb2xlYW4sIHVwc3RyZWFtOiBib29sZWFuID0gdHJ1ZSlcbntcblx0bGV0IGFyZ3YgPSBbXG5cdFx0J3B1c2gnLFxuXHRcdHVwc3RyZWFtICYmICctdScsXG5cdFx0Jy0tcHJvZ3Jlc3MnLFxuXHRcdGZvcmNlID8gJy0tZm9yY2UnIDogdW5kZWZpbmVkLFxuXHRcdHJlcG8sXG5cdF07XG5cblx0YXJndiA9IGZpbHRlckFyZ3YoYXJndik7XG5cblx0aWYgKE5PX1BVU0gpXG5cdHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuaOqOmAgSAke3JlcG99YCk7XG5cblx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRyZXR1cm4gY3A7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWxsR2l0KFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncHVsbCcsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoR2l0KFJFUE9fUEFUSDogc3RyaW5nLCByZW1vdGU/OiBzdHJpbmcpXG57XG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdmZXRjaCcsXG5cdFx0Jy0tZm9yY2UnLFxuXHRcdHJlbW90ZSB8fCAnb3JpZ2luJyxcblx0XHQnbWFzdGVyJyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hHaXRBbGwoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdmZXRjaCcsXG5cdFx0Jy0tYWxsJyxcblx0XHQnLS1wcnVuZScsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0JyYW5jaChSRVBPX1BBVEg6IHN0cmluZywgQlJfTkFNRTogc3RyaW5nKVxue1xuXHRjb25zb2xlLmRlYnVnKGDlmJfoqablu7rnq4vmlrDliIbmlK8gJHtCUl9OQU1FfWApO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdjaGVja291dCcsXG5cdFx0Jy1CJyxcblx0XHRCUl9OQU1FLFxuXHRcdCdvcmlnaW4vbWFzdGVyJyxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3Jldi1wYXJzZScsXG5cdFx0Jy0tYWJicmV2LXJlZicsXG5cdFx0J0hFQUQnLFxuXHRdLCB7XG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGxldCBuYW1lID0gY3Jvc3NTcGF3bk91dHB1dChjcC5zdGRvdXQpO1xuXG5cdHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlQnJhbmNoKFJFUE9fUEFUSDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbilcbntcblx0aWYgKG5hbWUgPT0gJ21hc3RlcicgfHwgIW5hbWUpXG5cdHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoKTtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuWIqumZpOacrOWcsOWIhuaUryAke25hbWV9YCk7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J2JyYW5jaCcsXG5cdFx0Zm9yY2UgPyAnLUQnIDogJy1kJyxcblx0XHRuYW1lLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbi8qKlxuICogQEZJWE1FIOS4jeefpemBk+eCuuS7gOm6vOaykuacieWIqumZpCDmiYDku6XlpJrlgZrkuIDmrKHlj6blpJbkuIDnqK7liKrpmaTmraXpqZ9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUJyYW5jaFJlbW90ZShSRVBPX1BBVEg6IHN0cmluZywgcmVtb3RlOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKVxue1xuXHRpZiAobmFtZSA9PSAnbWFzdGVyJyB8fCAhbmFtZSB8fCAhcmVtb3RlKVxuXHR7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCk7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabliKrpmaTpgaDnq6/liIbmlK8gJHtuYW1lfWApO1xuXG5cdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3B1c2gnLFxuXHRcdHJlbW90ZSxcblx0XHQnLS1kZWxldGUnLFxuXHRcdG5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHQvKipcblx0ICog5LiN55+l6YGT54K65LuA6bq85rKS5pyJ5Yiq6ZmkIOaJgOS7peWkmuWBmuS4gOasoeWPpuWkluS4gOeoruWIqumZpOatpempn1xuXHQgKiBodHRwczovL3psYXJnb24uZ2l0Ym9va3MuaW8vZ2l0LXR1dG9yaWFsL2NvbnRlbnQvcmVtb3RlL2RlbGV0ZV9icmFuY2guaHRtbFxuXHQgKi9cblx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncHVzaCcsXG5cdFx0cmVtb3RlLFxuXHRcdCc6JyArIG5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9sZEJyYW5jaChSRVBPX1BBVEg6IHN0cmluZylcbntcblx0bGV0IG5hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShSRVBPX1BBVEgpO1xuXG5cdGlmIChuYW1lLmluZGV4T2YoJ2F1dG8vJykgPT0gMClcblx0e1xuXHRcdHJldHVybiBuYW1lO1xuXHR9XG5cblx0cmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmT3JpZ2luKFJFUE9fUEFUSDogc3RyaW5nKVxue1xuXHRsZXQgbG9nID0gZ2l0bG9nKHtcblx0XHRyZXBvOiBSRVBPX1BBVEgsXG5cdFx0YnJhbmNoOiBbY3VycmVudEJyYW5jaE5hbWUoUkVQT19QQVRIKSwgJ29yaWdpbi9tYXN0ZXInXS5qb2luKCcuLicpLFxuXHRcdG51bWJlcjogMyxcblx0XHRuYW1lU3RhdHVzOiBmYWxzZSxcblx0fSk7XG5cblx0Y29uc29sZS5sb2cobG9nLCBsb2cubGVuZ3RoKTtcblxuXHRyZXR1cm4gbG9nLmxlbmd0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc2hIRUFEKFJFUE9fUEFUSDogc3RyaW5nLCBicmFuY2g6IHN0cmluZyA9ICdIRUFEJylcbntcblx0cmV0dXJuIGdpdGxvZyh7IHJlcG86IFJFUE9fUEFUSCwgbnVtYmVyOiAxLCBicmFuY2ggfSlbMF0uYWJicmV2SGFzaDtcbn1cblxuZXhwb3J0IHR5cGUgSU9wdGlvbnNDcmVhdGVHaXQgPSB7XG5cdHVybDogc3RyaW5nLFxuXHR0YXJnZXRQYXRoOiBzdHJpbmcsXG5cblx0bmV3QnJhbmNoTmFtZTogc3RyaW5nLFxuXG5cdHVybENsb25lPzogc3RyaW5nLFxuXHR1cmxQdXNoPzogc3RyaW5nLFxuXG5cdE5PVF9ET05FLFxuXG5cdENMT05FX0RFUFRIPzogbnVtYmVyLFxuXG5cdExPR0lOX1RPS0VOPzogc3RyaW5nLFxuXG5cdG9uPzoge1xuXHRcdGNyZWF0ZV9iZWZvcmU/KGRhdGE6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJkYXRhXCJdLCB0ZW1wPzogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcInRlbXBcIl0pLFxuXHRcdGNyZWF0ZT8oZGF0YTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR2l0PltcImRhdGFcIl0sIHRlbXA/OiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1widGVtcFwiXSksXG5cdFx0Y3JlYXRlX2FmdGVyPyhkYXRhOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVHaXQ+W1wiZGF0YVwiXSwgdGVtcD86IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUdpdD5bXCJ0ZW1wXCJdKSxcblx0fSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQdXNoVXJsKHVybDogc3RyaW5nLCBsb2dpbl90b2tlbj86IHN0cmluZylcbntcblx0aWYgKGxvZ2luX3Rva2VuICYmICEvQCQvLnRlc3QobG9naW5fdG9rZW4pKVxuXHR7XG5cdFx0bG9naW5fdG9rZW4gKz0gJ0AnO1xuXHR9XG5cblx0cmV0dXJuIGBodHRwczovLyR7bG9naW5fdG9rZW4gPyBsb2dpbl90b2tlbiA6ICcnfSR7dXJsfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQdXNoVXJsR2l0ZWUodXJsOiBzdHJpbmcsIGxvZ2luX3Rva2VuOiBzdHJpbmcgPSBHSVRfVE9LRU4pXG57XG5cdHJldHVybiBnZXRQdXNoVXJsKHVybCwgbG9naW5fdG9rZW4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0Q2hlY2tSZW1vdGUoUkVQT19QQVRIOiBzdHJpbmcsIHJlbW90ZT86IHN0cmluZylcbntcblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jR2l0KCdnaXQnLCBbXG5cdFx0J2xzLXJlbW90ZScsXG5cdFx0Jy0tZXhpdC1jb2RlJyxcblx0XHQnLS1oZWFkcycsXG5cdFx0Jy0tcXVpZXQnLFxuXHRcdChyZW1vdGUgfHwgJ29yaWdpbicpLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHaXQob3B0aW9uczogSU9wdGlvbnNDcmVhdGVHaXQpXG57XG5cdGNvbnN0IHdhaXRfY3JlYXRlX2dpdCA9IHNoYXJlU3RhdGVzKEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVQpO1xuXG5cdHdhaXRfY3JlYXRlX2dpdC5lbnN1cmUoKTtcblxuXHRsZXQgdGFyZ2V0TmFtZSA9IHBhdGguYmFzZW5hbWUob3B0aW9ucy50YXJnZXRQYXRoKTtcblx0bGV0IHRhcmdldFBhdGggPSBwYXRoLm5vcm1hbGl6ZShvcHRpb25zLnRhcmdldFBhdGgpO1xuXG5cdGxldCBSRVBPX1BBVEggPSB0YXJnZXRQYXRoO1xuXG5cdGxldCBleGlzdHMgPSBmcy5wYXRoRXhpc3RzU3luYyhSRVBPX1BBVEgpICYmIGlzR2l0Um9vdChSRVBPX1BBVEgpO1xuXG5cdGxldCBkYXRhID0ge1xuXHRcdHRhcmdldE5hbWUsXG5cdFx0dGFyZ2V0UGF0aCxcblxuXHRcdG5ld0JyYW5jaE5hbWU6IG9wdGlvbnMubmV3QnJhbmNoTmFtZSxcblxuXHRcdGV4aXN0cyxcblx0XHRleGlzdHNCcmFuY2hOYW1lOiBleGlzdHMgJiYgb2xkQnJhbmNoKFJFUE9fUEFUSCkgfHwgbnVsbCxcblxuXHRcdE5PVF9ET05FLFxuXG5cdFx0dXJsOiBvcHRpb25zLnVybCxcblx0XHR1cmxDbG9uZTogb3B0aW9ucy51cmxDbG9uZSxcblxuXHRcdExPR0lOX1RPS0VOOiBvcHRpb25zLkxPR0lOX1RPS0VOLFxuXG5cdFx0cHVzaFVybDogb3B0aW9ucy51cmxQdXNoIHx8IGdldFB1c2hVcmwob3B0aW9ucy51cmwsIG9wdGlvbnMuTE9HSU5fVE9LRU4pLFxuXHR9O1xuXG5cdGxldCB1cmxDbG9uZSA9IGRhdGEudXJsQ2xvbmU7XG5cblx0aWYgKCF1cmxDbG9uZSlcblx0e1xuXHRcdGNvbnNvbGUucmVkKGB1cmxDbG9uZSDkuI3lrZjlnKgg5ZiX6Kmm6Ieq5YuV55Sf5oiQYCk7XG5cblx0XHRpZiAoZGF0YS5MT0dJTl9UT0tFTilcblx0XHR7XG5cdFx0XHRjb25zb2xlLmRlYnVnKGDkvb/nlKggTE9HSU5fVE9LRU4g6Ieq5YuV55Sf5oiQIHVybENsb25lYCk7XG5cdFx0XHR1cmxDbG9uZSA9IGdldFB1c2hVcmwoZGF0YS51cmwsIGRhdGEuTE9HSU5fVE9LRU4pO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5kZWJ1Zyhg5L2/55SoIHVybCDoh6rli5XnlJ/miJAgdXJsQ2xvbmVgKTtcblx0XHRcdHVybENsb25lID0gZ2V0UHVzaFVybChkYXRhLnVybCk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IHRlbXA6IHtcblx0XHRjcDogU3Bhd25TeW5jUmV0dXJucyxcblxuXHRcdFtrOiBzdHJpbmddOiBhbnksXG5cdH0gPSB7XG5cdFx0Y3A6IG51bGwsXG5cdH07XG5cblx0bGV0IF9jcF9lcnJvcjogSVNwYXduQVN5bmNFcnJvcjtcblxuXHRsZXQgbGFiZWw6IHN0cmluZztcblxuXHRsYWJlbCA9IGAtLS0gQ09ORklHIC0tLWA7XG5cblx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRnaXRTZXRSZW1vdGUoZGF0YS50YXJnZXRQYXRoLCB1cmxDbG9uZSwgJ29yaWdpbicpO1xuXHRnaXRTZXRSZW1vdGUoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwsICdvcmlnaW4tcHVzaCcpO1xuXG5cdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cblx0Y29uc29sZS5pbmZvKGBjcmVhdGUgZ2l0OiAke3RhcmdldE5hbWV9YCk7XG5cblx0aWYgKG9wdGlvbnMub24gJiYgb3B0aW9ucy5vbi5jcmVhdGVfYmVmb3JlKVxuXHR7XG5cdFx0bGFiZWwgPSBgLS0tIENSRUFURV9CRUZPUkUgLS0tYDtcblx0XHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cdFx0b3B0aW9ucy5vbi5jcmVhdGVfYmVmb3JlKGRhdGEsIHRlbXApO1xuXHRcdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cdH1cblxuXHRsYWJlbCA9IGAtLS0gQ1JFQVRFIC0tLWA7XG5cdGNvbnNvbGUuaW5mbyhsYWJlbCk7XG5cdGNvbnNvbGUudGltZShsYWJlbCk7XG5cblx0dGVtcC5jcCA9IG51bGw7XG5cblx0dGVtcC5jcCA9IGdpdENoZWNrUmVtb3RlKGRhdGEudGFyZ2V0UGF0aCwgdXJsQ2xvbmUpO1xuXG5cdF9jcF9lcnJvciA9IGdldENyb3NzU3Bhd25FcnJvcih0ZW1wLmNwKTtcblxuXHRpZiAoX2NwX2Vycm9yKVxuXHR7XG5cdFx0dGhyb3cgX2NwX2Vycm9yXG5cdH1cblxuXHRsZXQgX2RlbGV0ZWQ6IGJvb2xlYW47XG5cblx0aWYgKGRhdGEuTk9UX0RPTkUgJiYgZGF0YS5leGlzdHMpXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYCR7dGFyZ2V0TmFtZX0gYWxyZWFkeSBleGlzdHNgKTtcblxuXHRcdHRlbXAuY3AgPSBmZXRjaEdpdChkYXRhLnRhcmdldFBhdGgsIHVybENsb25lKTtcblx0fVxuXHRlbHNlIGlmIChkYXRhLmV4aXN0cylcblx0e1xuXHRcdGNvbnNvbGUud2FybihgJHt0YXJnZXROYW1lfSBhbHJlYWR5IGV4aXN0c2ApO1xuXG5cdFx0Y29uc29sZS5pbmZvKGDlj5blvpfmiYDmnInpgaDnq6/liIbmlK9gKTtcblx0XHRmZXRjaEdpdEFsbChkYXRhLnRhcmdldFBhdGgpO1xuXG5cdFx0X2RlbGV0ZWQgPSBnaXRSZW1vdmVCcmFuY2hPdXRkYXRlKGRhdGEudGFyZ2V0UGF0aCk7XG5cblx0XHR0ZW1wLmNwID0gZmV0Y2hHaXQoZGF0YS50YXJnZXRQYXRoLCB1cmxDbG9uZSk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bGV0IENMT05FX0RFUFRIOiBudW1iZXIgPSAob3B0aW9ucy5DTE9ORV9ERVBUSCB8fCBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LkNMT05FX0RFUFRIIHx8IDUwKSBhcyBudW1iZXI7XG5cblx0XHRpZiAoaXNOYU4oQ0xPTkVfREVQVEgpIHx8ICFDTE9ORV9ERVBUSCB8fCBDTE9ORV9ERVBUSCA8PSAwKVxuXHRcdHtcblx0XHRcdENMT05FX0RFUFRIID0gNTA7XG5cdFx0fVxuXG5cdFx0dGVtcC5jcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHQnY2xvbmUnLFxuXHRcdFx0YC0tZGVwdGg9JHtDTE9ORV9ERVBUSH1gLFxuXHRcdFx0Ly8nLS12ZXJib3NlJyxcblx0XHRcdC8vJy0tcHJvZ3Jlc3MgJyxcblx0XHRcdHVybENsb25lLFxuXHRcdFx0ZGF0YS50YXJnZXRQYXRoLFxuXHRcdF0sIHtcblx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRjd2Q6IFBST0pFQ1RfUk9PVCxcblx0XHR9KTtcblx0fVxuXG5cdF9jcF9lcnJvciA9IGdldENyb3NzU3Bhd25FcnJvcih0ZW1wLmNwKTtcblxuXHRpZiAoX2NwX2Vycm9yKVxuXHR7XG5cdFx0dGhyb3cgX2NwX2Vycm9yXG5cdH1cblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZSlcblx0e1xuXHRcdG9wdGlvbnMub24uY3JlYXRlKGRhdGEsIHRlbXApO1xuXHR9XG5cblx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRpZiAob3B0aW9ucy5vbiAmJiBvcHRpb25zLm9uLmNyZWF0ZV9hZnRlcilcblx0e1xuXHRcdGxhYmVsID0gYC0tLSBDUkVBVEVfQUZURVIgLS0tYDtcblx0XHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cdFx0b3B0aW9ucy5vbi5jcmVhdGVfYWZ0ZXIoZGF0YSwgdGVtcCk7XG5cdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblx0fVxuXG5cdGxhYmVsID0gYC0tLSBCRUZPUkVfRE9ORSAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdGlmIChfZGVsZXRlZClcblx0e1xuXHRcdGdpdEdjQWdncmVzc2l2ZShkYXRhLnRhcmdldFBhdGgpO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGdpdEdjKGRhdGEudGFyZ2V0UGF0aCk7XG5cdH1cblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdGxhYmVsID0gYC0tLSBSRU1PVkVfV0FJVCAtLS1gO1xuXHRjb25zb2xlLmluZm8obGFiZWwpO1xuXHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdHdhaXRfY3JlYXRlX2dpdC5yZW1vdmUoKTtcblxuXHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdHJldHVybiB7IGRhdGEsIHRlbXAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0R2MoUkVQT19QQVRIOiBzdHJpbmcsIGFyZ3Y/OiBzdHJpbmdbXSlcbntcblx0YXJndiA9IGZpbHRlckFyZ3YoW1xuXHRcdCdnYycsXG5cdF0uY29uY2F0KChhcmd2ICYmIGFyZ3YubGVuZ3RoKSA/IGFyZ3YgOiBbXSkpO1xuXG5cdGlmIChhcmd2Lmxlbmd0aCA9PSAxKVxuXHR7XG5cdFx0YXJndi5wdXNoKCctLXBydW5lPVwiMyBkYXlzXCInKTtcblx0fVxuXG5cdGNvbnNvbGUuaW5mbyhg5YSq5YyWIEdJVCDos4fmlplgLCBhcmd2KTtcblxuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdEdjQWdncmVzc2l2ZShSRVBPX1BBVEg6IHN0cmluZywgYXJndj86IHN0cmluZ1tdKVxue1xuXHRhcmd2ID0gZmlsdGVyQXJndihbXG5cdFx0J2djJyxcblx0XHQnLS1hZ2dyZXNzaXZlJyxcblx0XS5jb25jYXQoKGFyZ3YgJiYgYXJndi5sZW5ndGgpID8gYXJndiA6IFtdKSk7XG5cblx0aWYgKGFyZ3YubGVuZ3RoID09IDIpXG5cdHtcblx0XHRhcmd2LnB1c2goJy0tcHJ1bmU9XCIzIGRheXNcIicpO1xuXHR9XG5cblx0Y29uc29sZS5pbmZvKGDlhKrljJYgR0lUIOizh+aWmWAsIGFyZ3YpO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luYygnZ2l0JywgYXJndiwge1xuXHRcdGN3ZDogUkVQT19QQVRILFxuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnJhbmNoTmFtZVRvRGF0ZShicl9uYW1lOiBzdHJpbmcpXG57XG5cdHJldHVybiBtb21lbnQoYnJfbmFtZS5yZXBsYWNlKC9eLiphdXRvXFwvLywgJycpLCBEQVRFX0ZPUk1BVClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdFJlbW92ZUJyYW5jaE91dGRhdGUoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGNvbnNvbGUuaW5mbyhg6ZaL5aeL5YiG5p6QIEdJVCDliIbmlK9gKTtcblxuXHRsZXQgZGF0YV9yZXQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRsZXQgYnJfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKFJFUE9fUEFUSCkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXG5cdGxldCBkYXRlX2JyID0gYnJhbmNoTmFtZVRvRGF0ZShicl9uYW1lKTtcblx0bGV0IGRhdGVfbm93ID0gbW9tZW50KCk7XG5cblx0Ly9jb25zb2xlLmxvZyh7YnJfbmFtZSwgZGF0ZV9iciwgZGF0ZV9ub3d9KTtcblxuXHRsZXQgYnJzOiBSZXR1cm5UeXBlPHR5cGVvZiBwYXJzZUJyYW5jaEdyb3VwPjtcblxuXHRicnMgPSBwYXJzZUJyYW5jaEdyb3VwKGdpdEJyYW5jaE1lcmdlZExpc3QoUkVQT19QQVRIKSk7XG5cblx0aWYgKGJycylcblx0e1xuXHRcdGNvbnNvbGUubG9nKGDmqqLmn6XkuKbliKrpmaTlt7LlkIjkvbXliIbmlK9gKTtcblx0XHRjb25zb2xlLmRpcihicnMsIHsgY29sb3JzOiB0cnVlLCB9KTtcblxuXHRcdGxldCBwcmVfbmFtZTogc3RyaW5nO1xuXG5cdFx0cHJlX25hbWUgPSAncmVmcy9oZWFkcy8nO1xuXG5cdFx0YnJzLmhlYWRzXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWU6IHN0cmluZywgaW5kZXgsIGFycmF5KVxuXHRcdFx0e1xuXHRcdFx0XHRmbih2YWx1ZSwgcHJlX25hbWUgKyB2YWx1ZSk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdHByZV9uYW1lID0gJ3JlZnMvcmVtb3Rlcy8nO1xuXG5cdFx0T2JqZWN0LmtleXMoYnJzLnJlbW90ZXMpXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAocmVtb3RlX25hbWUpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBwcmVmaXggPSBwcmVfbmFtZSArIHJlbW90ZV9uYW1lICsgJy8nO1xuXG5cdFx0XHRcdGxldCBicnNfbGlzdCA9IGJycy5yZW1vdGVzW3JlbW90ZV9uYW1lXTtcblxuXHRcdFx0XHRpZiAoYnJzX2xpc3QubGVuZ3RoID4gNSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJyc19saXN0ID0gYnJzX2xpc3Rcblx0XHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgYm9vbCA9IC9hdXRvXFwvL2kudGVzdCh2YWx1ZSk7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJvb2w7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnNsaWNlKDAsIC0yKVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdGJyc19saXN0XG5cdFx0XHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWU6IHN0cmluZywgaW5kZXgsIGFycmF5KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgYm9vbCA9ICEvYXV0b1xcLy9pLnRlc3QodmFsdWUpO1xuXHRcdFx0XHRcdFx0XHRsZXQgZGVsX25hbWUgPSBwcmVmaXggKyB2YWx1ZTtcblxuXHRcdFx0XHRcdFx0XHRmbih2YWx1ZSwgZGVsX25hbWUsIGJvb2wsIHRydWUsIHJlbW90ZV9uYW1lKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXG5cdGJycyA9IHBhcnNlQnJhbmNoR3JvdXAoZ2l0QnJhbmNoTWVyZ2VkTGlzdChSRVBPX1BBVEgsIHRydWUpKTtcblxuXHRpZiAoYnJzKVxuXHR7XG5cdFx0Y29uc29sZS5sb2coYOaqouafpeS4puWIqumZpOacquWQiOS9temBjuacn+WIhuaUr2ApO1xuXHRcdGNvbnNvbGUuZGlyKGJycywgeyBjb2xvcnM6IHRydWUsIH0pO1xuXG5cdFx0bGV0IHByZV9uYW1lOiBzdHJpbmc7XG5cblx0XHRwcmVfbmFtZSA9ICdyZWZzL2hlYWRzLyc7XG5cblx0XHRicnMuaGVhZHNcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nLCBpbmRleCwgYXJyYXkpXG5cdFx0XHR7XG5cdFx0XHRcdGZuKHZhbHVlLCBwcmVfbmFtZSArIHZhbHVlKTtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0cHJlX25hbWUgPSAncmVmcy9yZW1vdGVzLyc7XG5cblx0XHRPYmplY3Qua2V5cyhicnMucmVtb3Rlcylcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChyZW1vdGVfbmFtZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKHJlbW90ZV9uYW1lID09ICdvcmlnaW4nKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHByZWZpeCA9IHByZV9uYW1lICsgcmVtb3RlX25hbWUgKyAnLyc7XG5cblx0XHRcdFx0bGV0IGJyc19saXN0ID0gYnJzLnJlbW90ZXNbcmVtb3RlX25hbWVdO1xuXG5cdFx0XHRcdGlmIChicnNfbGlzdC5sZW5ndGggPiA1KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG1heF9kYXRlX3VuaXggPSAwO1xuXG5cdFx0XHRcdFx0YnJzX2xpc3QgPSBicnNfbGlzdFxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbiAodmFsdWUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBib29sID0gL2F1dG9cXC8vaS50ZXN0KHZhbHVlKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoYm9vbClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBkID0gYnJhbmNoTmFtZVRvRGF0ZSh2YWx1ZSk7XG5cblx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGQsIGQudW5peCgpKTtcblxuXHRcdFx0XHRcdFx0XHRcdG1heF9kYXRlX3VuaXggPSBNYXRoLm1heChtYXhfZGF0ZV91bml4LCBkLnVuaXgoKSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYm9vbDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuc2xpY2UoMCwgLTMpXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0bGV0IG1heF9kYXRlID0gbW9tZW50LnVuaXgobWF4X2RhdGVfdW5peCk7XG5cblx0XHRcdFx0XHRicnNfbGlzdFxuXHRcdFx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcsIGluZGV4LCBhcnJheSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGJvb2wgPSAhL15hdXRvXFwvL2kudGVzdCh2YWx1ZSk7XG5cdFx0XHRcdFx0XHRcdGxldCBkZWxfbmFtZSA9IHByZWZpeCArIHZhbHVlO1xuXG5cdFx0XHRcdFx0XHRcdGZuKHZhbHVlLCBkZWxfbmFtZSwgYm9vbCwgdHJ1ZSwgcmVtb3RlX25hbWUpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZm4odmFsdWU6IHN0cmluZywgZGVsX25hbWU6IHN0cmluZywgc2tpcD86IGJvb2xlYW4sIGlzX3JlbW90ZT86IGJvb2xlYW4sIHJlbW90ZV9uYW1lPzogc3RyaW5nKVxuXHR7XG5cdFx0bGV0IHZhbHVlX2xjID0gdmFsdWUudG9Mb3dlckNhc2UoKTtcblxuXHRcdGlmIChza2lwKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGBza2lwICgxKSAke2RlbF9uYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRlbHNlIGlmICghdmFsdWUgfHwgdmFsdWVfbGMgPT0gYnJfbmFtZSB8fCB2YWx1ZV9sYyA9PSAnbWFzdGVyJyB8fCB2YWx1ZV9sYyA9PSAnaGVhZCcpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYHNraXAgKDIpICR7ZGVsX25hbWV9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGlzX3JlbW90ZSlcblx0XHR7XG5cdFx0XHRpZiAoIS9hdXRvXFwvL2kudGVzdCh2YWx1ZSkgfHwgIXJlbW90ZV9uYW1lKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgc2tpcCAoMykgJHtkZWxfbmFtZX1gKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgZCA9IG1vbWVudCh2YWx1ZS5yZXBsYWNlKC9eLiphdXRvXFwvLywgJycpLCBEQVRFX0ZPUk1BVCk7XG5cblx0XHRcdC8vY29uc29sZS5sb2coZCk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5pbmZvKGB0cnkgZGVsZXRlICR7ZGVsX25hbWV9YCk7XG5cblx0XHRpZiAoaXNfcmVtb3RlKVxuXHRcdHtcblx0XHRcdGRlbGV0ZUJyYW5jaFJlbW90ZShSRVBPX1BBVEgsIHJlbW90ZV9uYW1lLCB2YWx1ZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRkZWxldGVCcmFuY2goUkVQT19QQVRILCB2YWx1ZSk7XG5cdFx0fVxuXG5cdFx0ZGF0YV9yZXQgPSB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGRhdGFfcmV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0QnJhbmNoTWVyZ2VkTGlzdChSRVBPX1BBVEg6IHN0cmluZywgbm9NZXJnZWQ/OiBib29sZWFuLCBCUl9OQU1FPzogc3RyaW5nKVxue1xuXHRsZXQgY3AgPSBjcm9zc1NwYXduU3luYygnZ2l0JywgZmlsdGVyQXJndihbXG5cdFx0J2JyYW5jaCcsXG5cdFx0Jy0tZm9ybWF0Jyxcblx0XHQnJShyZWZuYW1lKScsXG5cdFx0Jy1hJyxcblx0XHRub01lcmdlZCA/ICctLW5vLW1lcmdlZCcgOiAnLS1tZXJnZWQnLFxuXHRcdEJSX05BTUUsXG5cdF0pLCB7XG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGlmIChjcC5zdGRlcnIgJiYgY3Auc3RkZXJyLmxlbmd0aClcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoY3Auc3RkZXJyLnRvU3RyaW5nKCkpO1xuXG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdGxldCBuYW1lID0gY3Jvc3NTcGF3bk91dHB1dChjcC5zdGRvdXQpO1xuXG5cdHJldHVybiBuYW1lXG5cdFx0LnNwbGl0KExGKVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQnJhbmNoR3JvdXAocjogc3RyaW5nW10pOiB7XG5cdGhlYWRzOiBzdHJpbmdbXTtcblx0cmVtb3Rlczoge1xuXHRcdG9yaWdpbjogc3RyaW5nW107XG5cdFx0W2s6IHN0cmluZ106IHN0cmluZ1tdO1xuXHR9O1xufVxue1xuXHRpZiAoIXIgfHwgIXIubGVuZ3RoKVxuXHR7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRyZXR1cm4gci5zb3J0KCkucmVkdWNlKGZ1bmN0aW9uIChhLCBiKVxuXHR7XG5cdFx0aWYgKC9ecmVmc1xcL3JlbW90ZXNcXC8oW15cXC9dKylcXC8oLispJC8uZXhlYyhiKSlcblx0XHR7XG5cdFx0XHRsZXQgeyAkMSwgJDIgfSA9IFJlZ0V4cDtcblx0XHRcdGEucmVtb3Rlc1skMV0gPSBhLnJlbW90ZXNbJDFdIHx8IFtdO1xuXHRcdFx0YS5yZW1vdGVzWyQxXS5wdXNoKCQyKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoL15yZWZzXFwvaGVhZHNcXC8oLispJC8uZXhlYyhiKSlcblx0XHR7XG5cdFx0XHRsZXQgeyAkMSwgJDIgfSA9IFJlZ0V4cDtcblx0XHRcdGEuaGVhZHMucHVzaCgkMSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGE7XG5cdH0sIHtcblx0XHRoZWFkczogW10sXG5cdFx0cmVtb3Rlczoge1xuXHRcdFx0b3JpZ2luOiBbXSxcblx0XHR9LFxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0Q2xlYW5BbGwoUkVQT19QQVRIOiBzdHJpbmcpXG57XG5cdGNvbnNvbGUuaW5mbyhgW2dpdDpjbGVhbl0gUmVtb3ZlIHVudHJhY2tlZCBmaWxlcyBmcm9tIHRoZSB3b3JraW5nIHRyZWVgKTtcblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J2NsZWFuJyxcblx0XHQnLWQnLFxuXHRcdCctZngnLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG4iXX0=