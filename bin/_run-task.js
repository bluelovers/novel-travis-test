"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const fs = require("fs-extra");
const __1 = require("..");
const index_1 = require("../index");
const project_config_1 = require("../project.config");
const log_1 = require("../lib/log");
const Promise = require("bluebird");
const git_1 = require("../data/git");
const gitee_pr_1 = require("../script/gitee-pr");
const init_1 = require("../script/init");
const git_2 = require("../script/git");
let label;
{
    if (!index_1.isGitRoot(init_1.DIST_NOVEL)) {
        log_1.default.warn(`dist_novel not a git: ${init_1.DIST_NOVEL}`);
        throw new Error(`something wrong when create git`);
    }
    log_1.default.info(`dist_novel: ${init_1.DIST_NOVEL}`);
}
let currentHEAD = git_2.getHashHEAD(init_1.DIST_NOVEL);
if (init_1.NOT_DONE) {
    label = `--- NOT_DONE ---`;
    log_1.default.warn(label);
    log_1.default.time(label);
    let bin = path.join(init_1.PROJECT_ROOT, 'bin/_do_segment_all.js');
    __1.crossSpawnSync('node', [
        bin,
    ], {
        stdio: 'inherit',
        cwd: init_1.PROJECT_ROOT,
    });
}
else {
    label = `--- TASK ---`;
    log_1.default.info(label);
    log_1.default.time(label);
    runTask();
}
log_1.default.timeEnd(label);
(async () => {
    label = `--- PUSH ---`;
    log_1.default.debug(label);
    log_1.default.time(label);
    if (init_1.MyConfig.config.debug && init_1.MyConfig.config.debug.no_push) {
        log_1.default.warn(`[DEBUG] skip push`);
    }
    else {
        let ok = true;
        let currentHEADNew = git_2.getHashHEAD(init_1.DIST_NOVEL);
        if (currentHEAD != currentHEADNew || git_2.diffOrigin(init_1.DIST_NOVEL)) {
            fs.ensureFileSync(path.join(project_config_1.default.cache_root, '.waitpush'));
            let cp = git_2.pushGit(init_1.DIST_NOVEL, git_2.getPushUrl(git_1.GIT_SETTING_DIST_NOVEL.url), true);
            if (cp.error || cp.stderr && cp.stderr.toString()) {
                ok = false;
                log_1.default.error(`發生錯誤`);
            }
            await Promise.delay(1000);
            gitee_pr_1.createPullRequests();
        }
        else {
            log_1.default.error(`沒有任何變更 忽略 PUSH`);
        }
        if (ok) {
            fs.removeSync(path.join(project_config_1.default.cache_root, '.waitpush'));
            if (init_1.CacheConfig) {
                let config = fs.readJSONSync(init_1.CacheConfig.filepath);
                config.done = 1;
                config.last_push_head = currentHEADNew;
                config.last_task_datatime = Date.now();
                log_1.default.ok(`將 cache 檔案內的 執行狀態 改為已完成`);
                fs.writeJSONSync(init_1.CacheConfig.filepath, config, {
                    spaces: 2,
                });
                log_1.default.dir(config);
            }
        }
    }
    log_1.default.timeEnd(label);
})();
// ----------------
function runTask() {
    let bin = path.join(path.dirname(require.resolve('@node-novel/task')), 'bin/_novel-task.js');
    //	console.log(bin);
    __1.crossSpawnSync('node', [
        bin,
    ], {
        stdio: 'inherit',
        cwd: init_1.PROJECT_ROOT,
    });
}
