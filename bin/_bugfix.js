"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIST_NOVEL = exports.GITEE_TOKEN = exports.CacheConfig = exports.MyConfig = exports.PROJECT_ROOT = void 0;
const path = require("upath2");
const fs = require("fs-extra");
const config_1 = require("@node-novel/task/lib/config");
const novel_stat_1 = require("../lib/cache/novel-stat");
const project_config_1 = require("../project.config");
const moment = require("moment");
const FastGlob = require("@bluelovers/fast-glob");
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
{
    let now = moment();
    let now_unix = now.unix();
    const novelStatCache = novel_stat_1.getNovelStatCache();
    const timestamp = novelStatCache.timestamp;
    let _ok;
    Object.entries(novelStatCache.data.history)
        .forEach(function ([timestamp, stat]) {
        let n_timestamp = parseInt(timestamp);
        if (now_unix >= n_timestamp) {
            let ms = moment.unix(n_timestamp).valueOf();
            delete novelStatCache.data.history[timestamp];
            novelStatCache.data.history[ms] = stat;
            _ok = true;
        }
    });
    Object.entries(novelStatCache.data.novels)
        .forEach(([pathMain, data], i) => {
        Object.entries(novelStatCache.data.novels[pathMain])
            .forEach(([novelID, data]) => {
            let ks = [
                'init_date',
                'epub_date',
                'segment_date',
            ];
            ks.forEach(k => {
                if (data[k] && now_unix >= data[k]) {
                    // @ts-ignore
                    let ms = moment.unix(data[k]).valueOf();
                    // @ts-ignore
                    data[k] = ms;
                    _ok = true;
                }
            });
        });
    });
    if (_ok) {
        novelStatCache.save();
    }
}
console.timeEnd('bugfix');
//# sourceMappingURL=_bugfix.js.map