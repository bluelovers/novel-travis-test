"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_PUSH = exports.BR_NAME = exports.NOT_DONE = exports.CLONE_DEPTH = exports.DIST_NOVEL = exports.GITLAB_TOKEN = exports.GITEE_TOKEN = exports.CacheConfig = exports.MyConfig = exports.PROJECT_ROOT = exports.DEBUG = void 0;
const path = require("upath2");
const dotenv_1 = require("dotenv");
const fs = require("fs-extra");
const config_1 = require("@node-novel/task/lib/config");
const project_config_1 = require("../project.config");
const moment = require("moment");
const FastGlob = require("fast-glob");
const log_1 = require("../lib/log");
/**
 * Created by user on 2018/5/17/017.
 */
exports.DEBUG = false;
exports.PROJECT_ROOT = project_config_1.default.project_root;
exports.MyConfig = config_1.loadMainConfig(exports.PROJECT_ROOT);
exports.CacheConfig = config_1.loadCacheConfig(exports.PROJECT_ROOT);
exports.GITEE_TOKEN = process.env.GITEE_TOKEN || '';
exports.GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
exports.DIST_NOVEL = project_config_1.default.novel_root;
if (!exports.GITEE_TOKEN || !exports.GITLAB_TOKEN) {
    let env = dotenv_1.config({ path: path.join(exports.PROJECT_ROOT, '.env') });
    if (!exports.GITEE_TOKEN && env.parsed && env.parsed.GITEE_TOKEN) {
        exports.GITEE_TOKEN = env.parsed.GITEE_TOKEN;
    }
    if (!exports.GITLAB_TOKEN && env.parsed && env.parsed.GITLAB_TOKEN) {
        exports.GITLAB_TOKEN = env.parsed.GITLAB_TOKEN;
    }
}
exports.CLONE_DEPTH = process.env.CLONE_DEPTH || 50;
if (!/@$/.test(exports.GITEE_TOKEN)) {
    exports.GITEE_TOKEN += '@';
}
if (exports.CacheConfig && exports.CacheConfig.config && exports.CacheConfig.config.done == -1) {
    exports.NOT_DONE = true;
    log_1.default.warn(`上次的任務未完成 本次繼續執行 (1)`);
}
else {
    let ls = FastGlob.sync([
        '*/*.json',
    ], {
        cwd: path.join(project_config_1.default.cache_root, 'files'),
    });
    if (ls.length) {
        exports.NOT_DONE = true;
        log_1.default.warn(`上次的任務未完成 本次繼續執行 (2)`);
        log_1.default.log(ls);
        fs.outputJSONSync(path.join(project_config_1.default.cache_root, 'diff-novel.json'), [], {
            spaces: '\t',
        });
    }
}
exports.BR_NAME = 'auto/' + moment().format('YYYY-MM-DD-HH-mm-ss');
exports.NO_PUSH = exports.MyConfig && exports.MyConfig.config.debug && exports.MyConfig.config.debug.no_push;
//# sourceMappingURL=init.js.map