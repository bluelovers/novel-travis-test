"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const dotenv_1 = require("dotenv");
const config_1 = require("@node-novel/task/lib/config");
const project_config_1 = require("../project.config");
const moment = require("moment");
const FastGlob = require("fast-glob");
/**
 * Created by user on 2018/5/17/017.
 */
exports.DEBUG = false;
exports.PROJECT_ROOT = project_config_1.default.project_root;
exports.MyConfig = config_1.loadMainConfig(exports.PROJECT_ROOT);
exports.CacheConfig = config_1.loadCacheConfig(exports.PROJECT_ROOT);
exports.GITEE_TOKEN = process.env.GITEE_TOKEN || '';
exports.DIST_NOVEL = project_config_1.default.novel_root;
if (!exports.GITEE_TOKEN) {
    let env = dotenv_1.config({ path: path.join(exports.PROJECT_ROOT, '.env') });
    if (env.parsed && env.parsed.GITEE_TOKEN) {
        exports.GITEE_TOKEN = env.parsed.GITEE_TOKEN;
    }
}
exports.CLONE_DEPTH = process.env.CLONE_DEPTH || 50;
if (!/@$/.test(exports.GITEE_TOKEN)) {
    exports.GITEE_TOKEN += '@';
}
if (exports.CacheConfig && exports.CacheConfig.config && exports.CacheConfig.config.done == -1) {
    exports.NOT_DONE = true;
    console.log(`上次的任務未完成 本次繼續執行`);
}
else {
    let ls = FastGlob.sync([
        '*/*.json',
    ], {
        cwd: path.join(project_config_1.default.cache_root, 'files'),
    });
    if (ls.length) {
        exports.NOT_DONE = true;
        console.log(`上次的任務未完成 本次繼續執行`);
    }
}
exports.BR_NAME = 'auto/' + moment().format('YYYY-MM-DD-HH-mm-ss');
