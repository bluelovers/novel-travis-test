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
const moment = require("moment");
const DEBUG = false;
let label;
const PROJECT_ROOT = path.resolve(__dirname, '..');
let MyConfig = config_1.loadMainConfig(PROJECT_ROOT);
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
const BR_NAME = 'auto/' + moment().format('YYYY-MM-DD-HH-mm-ss');
if (fs.pathExistsSync(DIST_NOVEL) && index_1.isGitRoot(DIST_NOVEL)) {
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
        '--progress ',
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
label = `--- TASK ---`;
console.log(label);
console.time(label);
runTask();
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
    console.log(bin);
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
