#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yargs = require("yargs");
const segment_1 = require("../script/segment");
const project_config_1 = require("../project.config");
const path = require("upath2");
const Promise = require("bluebird");
const env_bool_1 = require("env-bool");
const log_1 = require("../lib/log");
const util_1 = require("../lib/util");
const novel_stat_1 = require("../lib/cache/novel-stat");
let { pathMain, novelID, novel_root, runAll } = yargs
    .option('pathMain', {
    type: 'string',
})
    .option('novelID', {
    type: 'string',
})
    .option('novel_root', {
    type: 'string',
})
    .option('runAll', {})
    .argv;
if (pathMain && novelID) {
    Promise.resolve((async () => {
        let dir = path.join(project_config_1.default.cache_root, 'files', pathMain);
        let jsonfile = path.join(dir, novelID + '.json');
        let jsonfile_done = jsonfile + '.done';
        await fs.remove(jsonfile_done).catch(e => null);
        if (!fs.existsSync(jsonfile)) {
            return 0;
        }
        let ls = await fs.readJSON(jsonfile);
        runAll = env_bool_1.default(runAll);
        if (!runAll && (!Array.isArray(ls) || !ls.length)) {
            log_1.default.log(`[Segment:skip]`, pathMain, novelID, ls);
            await fs.remove(jsonfile);
            return 0;
        }
        if (runAll) {
            log_1.default.debug(`[Segment]`, pathMain, novelID, `runAll: ${runAll}`);
        }
        else {
            log_1.default.log(`[Segment]`, pathMain, novelID, `runAll: ${runAll}`);
        }
        if (!runAll) {
            log_1.default.grey(`list:`, ls);
        }
        let done_list_cache = [];
        return segment_1.doSegmentGlob({
            pathMain,
            novelID,
            novel_root,
            files: (!runAll && Array.isArray(ls)) ? ls : null,
            callback(done_list, file, index, length) {
                if ((index % 10) == 0 || ((index + 1) >= length)) {
                    log_1.default.grey(`[${index}/${length}]`, file);
                    ls = ls.filter(function (v) {
                        let bool = done_list.indexOf(v) == -1;
                        if (bool) {
                            done_list_cache.push(v);
                        }
                        return bool;
                    });
                    //					console.log(ls.length);
                    if (ls.length == 0) {
                        fs.removeSync(jsonfile);
                    }
                    else {
                        fs.writeJSONSync(jsonfile, ls, {
                            spaces: '\t',
                        });
                    }
                    util_1.showMemoryUsage();
                }
                util_1.freeGC();
            },
        })
            .then(async function (ret) {
            ls = ls.filter(function (v) {
                let bool = ret.done_list.indexOf(v) == -1;
                if (bool) {
                    done_list_cache.push(v);
                }
                return bool;
            });
            log_1.default.error(`ls: ${ls.length}`);
            if (ls.length == 0 || 1) {
                await fs.remove(jsonfile);
            }
            const novelStatCache = novel_stat_1.getNovelStatCache();
            let stat = novelStatCache.novel(pathMain, novelID);
            if (ret.count.changed > 0) {
                stat.segment_date = Date.now();
                stat.segment_old = stat.segment | 0;
                stat.segment = ret.count.changed;
                let today = novelStatCache.historyToday();
                today.segment.push([pathMain, novelID]);
            }
            novelStatCache.save();
            return ret.count.changed;
        })
            .tap(function () {
            return fs
                .writeJSON(jsonfile_done, done_list_cache)
                .catch(e => log_1.default.error(e.message));
        })
            .catch(async function (e) {
            if (e == segment_1.ERROR_MSG_001) {
                log_1.default.warn(segment_1.ERROR_MSG_001);
                await fs.remove(jsonfile);
                return 0;
            }
            return Promise.reject(e);
        });
    })())
        .then(function (n) {
        process.exit(n || 0);
    });
}
//# sourceMappingURL=_do_segment.js.map