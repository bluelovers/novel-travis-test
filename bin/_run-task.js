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
const init_1 = require("../script/init");
const git_1 = require("../script/git");
let label;
{
    if (!index_1.isGitRoot(init_1.DIST_NOVEL)) {
        console.warn(`dist_novel not a git: ${init_1.DIST_NOVEL}`);
        throw new Error(`something wrong when create git`);
    }
    console.log(`dist_novel: ${init_1.DIST_NOVEL}`);
}
if (init_1.NOT_DONE) {
    label = `--- NOT_DONE ---`;
    console.log(label);
    console.time(label);
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
    console.log(label);
    console.time(label);
    runTask();
}
console.timeEnd(label);
label = `--- PUSH ---`;
console.log(label);
console.time(label);
if (init_1.MyConfig.config.debug && init_1.MyConfig.config.debug.no_push) {
    console.log(`[DEBUG] skip push`);
}
else {
    if (git_1.diffOrigin()) {
        fs.ensureFileSync(path.join(project_config_1.default.cache_root, '.waitpush'));
        git_1.pushGit();
    }
    else {
        console.log(`沒有任何變更 忽略 PUSH`);
    }
    fs.removeSync(path.join(project_config_1.default.cache_root, '.waitpush'));
}
console.timeEnd(label);
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
