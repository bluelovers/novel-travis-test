"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const crossSpawn = require("cross-spawn");
const dotenv_1 = require("dotenv");
const fs = require("fs-extra");
const __1 = require("..");
const index_1 = require("../index");
const config_1 = require("@node-novel/task/lib/config");
const project_config_1 = require("../project.config");
const moment = require("moment");
const FastGlob = require("fast-glob");
const DEBUG = false;
let label;
const PROJECT_ROOT = path.resolve(__dirname, '..');
let MyConfig = config_1.loadMainConfig(PROJECT_ROOT);
let CacheConfig = config_1.loadCacheConfig(PROJECT_ROOT);
let GITEE_TOKEN = process.env.GITEE_TOKEN || '';
const DIST_NOVEL = path.resolve(PROJECT_ROOT, 'dist_novel');
if (!GITEE_TOKEN) {
    let env = dotenv_1.config({ path: path.join(PROJECT_ROOT, '.env') });
    if (env.parsed && env.parsed.GITEE_TOKEN) {
        GITEE_TOKEN = env.parsed.GITEE_TOKEN;
    }
}
if (!/@$/.test(GITEE_TOKEN)) {
    GITEE_TOKEN += '@';
}
let NOT_DONE;
if (CacheConfig && CacheConfig.config && CacheConfig.config.done == -1) {
    NOT_DONE = true;
    console.log(`上次的任務未完成 本次繼續執行`);
}
else {
    let ls = FastGlob.sync([
        '*/*.json',
    ], {
        cwd: path.join(project_config_1.default.cache_root, 'files'),
    });
    if (ls.length) {
        NOT_DONE = true;
        console.log(`上次的任務未完成 本次繼續執行`);
    }
}
const BR_NAME = 'auto/' + moment().format('YYYY-MM-DD-HH-mm-ss');
if (NOT_DONE && fs.pathExistsSync(DIST_NOVEL) && index_1.isGitRoot(DIST_NOVEL)) {
    __1.crossSpawnSync('git', [
        'commit',
        '-a',
        '-m',
        `[Segment] NOT_DONE`,
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
    pushGit();
    __1.crossSpawnSync('git', [
        'checkout',
        '-B',
        BR_NAME,
        'master',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
}
else if (fs.pathExistsSync(DIST_NOVEL) && index_1.isGitRoot(DIST_NOVEL)) {
    console.warn(`dist_novel already exists`);
    label = `--- PULL ---`;
    console.log(label);
    console.time(label);
    __1.crossSpawnSync('git', [
        'fetch',
        '--all',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
    __1.crossSpawnSync('git', [
        'reset',
        '--hard',
        'FETCH_HEAD',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
    pullGit();
    __1.crossSpawnSync('git', [
        'checkout',
        '-B',
        BR_NAME,
        'master',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
    console.timeEnd(label);
}
else {
    label = `--- CLONE ---`;
    console.log(label);
    console.time(label);
    //fs.emptyDirSync(DIST_NOVEL);
    __1.crossSpawnSync('git', [
        'clone',
        '--depth=50',
        //'--progress ',
        'https://gitee.com/bluelovers/novel.git',
        'dist_novel',
    ], {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
    });
    __1.crossSpawnSync('git', [
        'checkout',
        '-B',
        BR_NAME,
        'master',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
    console.timeEnd(label);
}
{
    if (!index_1.isGitRoot(DIST_NOVEL)) {
        throw new Error(`something wrong when create git`);
    }
    console.log(`dist_novel: ${DIST_NOVEL}`);
}
if (NOT_DONE) {
    label = `--- NOT_DONE ---`;
    console.log(label);
    console.time(label);
    let bin = path.join(PROJECT_ROOT, 'bin/_do_segment_all.js');
    __1.crossSpawnSync('node', [
        bin,
    ], {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
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
if (MyConfig.config.debug && MyConfig.config.debug.no_push) {
    console.log(`[DEBUG] skip push`);
}
else {
    pushGit();
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
        cwd: PROJECT_ROOT,
    });
}
function pullGit() {
    return crossSpawn.sync('git', [
        'pull',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
}
function pushGit() {
    let cp = __1.crossSpawnSync('git', [
        'push',
        '--force',
        `https://${GITEE_TOKEN ? GITEE_TOKEN : ''}gitee.com/demogitee/novel.git`,
    ], {
        cwd: DIST_NOVEL,
    });
    if (cp.output) {
        let s = index_1.crossSpawnOutput(cp.output);
        if (s.indexOf('Everything up-to-date') != -1) {
            console.log(s);
        }
        else if (DEBUG) {
            console.log(s);
        }
    }
    return cp;
}
