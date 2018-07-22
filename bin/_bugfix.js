"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const fs = require("fs-extra");
const config_1 = require("@node-novel/task/lib/config");
const project_config_1 = require("../project.config");
const FastGlob = require("fast-glob");
/**
 * Created by user on 2018/7/22/022.
 */
exports.PROJECT_ROOT = project_config_1.default.project_root;
exports.MyConfig = config_1.loadMainConfig(exports.PROJECT_ROOT);
exports.CacheConfig = config_1.loadCacheConfig(exports.PROJECT_ROOT);
exports.GITEE_TOKEN = process.env.GITEE_TOKEN || '';
exports.DIST_NOVEL = project_config_1.default.novel_root;
console.time('bugfix');
let ls = FastGlob.sync([
    'docs/*.json',
], {
    cwd: path.join(project_config_1.default.cache_root, 'files'),
    absolute: true,
    onlyFiles: true,
});
if (ls.length) {
    ls.forEach(function (file) {
        console.log('[delete]', file);
        fs.removeSync(file);
    });
}
console.timeEnd('bugfix');
