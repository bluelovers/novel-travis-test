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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2RvX3NlZ21lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfZG9fc2VnbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBK0I7QUFDL0IsK0JBQStCO0FBQy9CLCtDQUFpRTtBQUNqRSxzREFBOEM7QUFDOUMsK0JBQWdDO0FBQ2hDLG9DQUFvQztBQUNwQyx1Q0FBMkM7QUFDM0Msb0NBQWlDO0FBQ2pDLHNDQUFzRDtBQUN0RCx3REFBNEQ7QUFFNUQsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUs7S0FDbkQsTUFBTSxDQUFDLFVBQVUsRUFBRTtJQUNuQixJQUFJLEVBQUUsUUFBUTtDQUNkLENBQUM7S0FDRCxNQUFNLENBQUMsU0FBUyxFQUFFO0lBQ2xCLElBQUksRUFBRSxRQUFRO0NBQ2QsQ0FBQztLQUNELE1BQU0sQ0FBQyxZQUFZLEVBQUU7SUFDckIsSUFBSSxFQUFFLFFBQVE7Q0FDZCxDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUVqQixDQUFDO0tBQ0QsSUFBSSxDQUNMO0FBRUQsSUFBSSxRQUFRLElBQUksT0FBTyxFQUN2QjtJQUNDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUUzQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNqRSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFFakQsSUFBSSxhQUFhLEdBQUcsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV2QyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEQs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QUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUNwQztRQUNILENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxLQUFLLFdBQVcsQ0FBQztZQUV2QixJQUFJLENBQUMsSUFBSSx1QkFBYSxFQUN0QjtnQkFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHVCQUFhLENBQUMsQ0FBQztnQkFFNUIsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUUxQixPQUFPLENBQUMsQ0FBQzthQUNUO1lBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3pCLENBQUMsQ0FBQyxDQUNEO0lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUNILElBQUksQ0FBQyxVQUFVLENBQUM7UUFFaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7SUFDckIsQ0FBQyxDQUFDLENBQ0Y7Q0FDRCIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IHByb2Nlc3NUb2NDb250ZW50cyBmcm9tICdAbm9kZS1ub3ZlbC90b2MvdG9jX2NvbnRlbnRzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcbmltcG9ydCB7IGRvU2VnbWVudEdsb2IsIEVSUk9SX01TR18wMDEgfSBmcm9tICcuLi9zY3JpcHQvc2VnbWVudCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgZW52Qm9vbCwgeyBlbnZWYWwgfSBmcm9tICdlbnYtYm9vbCc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IHNob3dNZW1vcnlVc2FnZSwgZnJlZUdDIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5cbmxldCB7IHBhdGhNYWluLCBub3ZlbElELCBub3ZlbF9yb290LCBydW5BbGwgfSA9IHlhcmdzXG5cdC5vcHRpb24oJ3BhdGhNYWluJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHR9KVxuXHQub3B0aW9uKCdub3ZlbElEJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHR9KVxuXHQub3B0aW9uKCdub3ZlbF9yb290Jywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHR9KVxuXHQub3B0aW9uKCdydW5BbGwnLCB7XG5cblx0fSlcblx0LmFyZ3ZcbjtcblxuaWYgKHBhdGhNYWluICYmIG5vdmVsSUQpXG57XG5cdFByb21pc2UucmVzb2x2ZSgoYXN5bmMgKCkgPT5cblx0e1xuXHRcdGxldCBkaXIgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnLCBwYXRoTWFpbik7XG5cdFx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKGRpciwgbm92ZWxJRCArICcuanNvbicpO1xuXG5cdFx0bGV0IGpzb25maWxlX2RvbmUgPSBqc29uZmlsZSArICcuZG9uZSc7XG5cblx0XHRhd2FpdCBmcy5yZW1vdmUoanNvbmZpbGVfZG9uZSkuY2F0Y2goZSA9PiBudWxsKTtcblxuXHRcdGlmICghZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0bGV0IGxzID0gYXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGUpIGFzIHN0cmluZ1tdO1xuXG5cdFx0cnVuQWxsID0gZW52Qm9vbChydW5BbGwpO1xuXG5cdFx0aWYgKCFydW5BbGwgJiYgKCFBcnJheS5pc0FycmF5KGxzKSB8fCAhbHMubGVuZ3RoKSlcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhgW1NlZ21lbnQ6c2tpcF1gLCBwYXRoTWFpbiwgbm92ZWxJRCwgbHMpO1xuXG5cdFx0XHRhd2FpdCBmcy5yZW1vdmUoanNvbmZpbGUpO1xuXG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHRpZiAocnVuQWxsKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZGVidWcoYFtTZWdtZW50XWAsIHBhdGhNYWluLCBub3ZlbElELCBgcnVuQWxsOiAke3J1bkFsbH1gKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGBbU2VnbWVudF1gLCBwYXRoTWFpbiwgbm92ZWxJRCwgYHJ1bkFsbDogJHtydW5BbGx9YCk7XG5cdFx0fVxuXG5cdFx0aWYgKCFydW5BbGwpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5ncmV5KGBsaXN0OmAsIGxzKTtcblx0XHR9XG5cblx0XHRsZXQgZG9uZV9saXN0X2NhY2hlOiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0cmV0dXJuIGRvU2VnbWVudEdsb2Ioe1xuXHRcdFx0cGF0aE1haW4sXG5cdFx0XHRub3ZlbElELFxuXHRcdFx0bm92ZWxfcm9vdCxcblxuXHRcdFx0ZmlsZXM6ICghcnVuQWxsICYmIEFycmF5LmlzQXJyYXkobHMpKSA/IGxzIDogbnVsbCxcblxuXHRcdFx0Y2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoKGluZGV4ICUgMTApID09IDAgfHwgKChpbmRleCArIDEpID49IGxlbmd0aCkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLmdyZXkoYFske2luZGV4fS8ke2xlbmd0aH1dYCwgZmlsZSk7XG5cblx0XHRcdFx0XHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgYm9vbCA9IGRvbmVfbGlzdC5pbmRleE9mKHYpID09IC0xO1xuXG5cdFx0XHRcdFx0XHRpZiAoYm9vbClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZG9uZV9saXN0X2NhY2hlLnB1c2godilcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIGJvb2xcblx0XHRcdFx0XHR9KTtcblxuLy9cdFx0XHRcdFx0Y29uc29sZS5sb2cobHMubGVuZ3RoKTtcblxuXHRcdFx0XHRcdGlmIChscy5sZW5ndGggPT0gMClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmcy5yZW1vdmVTeW5jKGpzb25maWxlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZzLndyaXRlSlNPTlN5bmMoanNvbmZpbGUsIGxzLCB7XG5cdFx0XHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzaG93TWVtb3J5VXNhZ2UoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZyZWVHQygpO1xuXHRcdFx0fSxcblx0XHR9KVxuXHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdHtcblx0XHRcdFx0bHMgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgYm9vbCA9IHJldC5kb25lX2xpc3QuaW5kZXhPZih2KSA9PSAtMTtcblxuXHRcdFx0XHRcdGlmIChib29sKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvbmVfbGlzdF9jYWNoZS5wdXNoKHYpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGJvb2xcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc29sZS5lcnJvcihgbHM6ICR7bHMubGVuZ3RofWApO1xuXG5cdFx0XHRcdGlmIChscy5sZW5ndGggPT0gMCB8fCAxKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKGpzb25maWxlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblx0XHRcdFx0bGV0IHN0YXQgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0aWYgKHJldC5jb3VudC5jaGFuZ2VkID4gMClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0YXQuc2VnbWVudF9kYXRlID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRcdHN0YXQuc2VnbWVudF9vbGQgPSBzdGF0LnNlZ21lbnQgfCAwO1xuXHRcdFx0XHRcdHN0YXQuc2VnbWVudCA9IHJldC5jb3VudC5jaGFuZ2VkO1xuXG5cdFx0XHRcdFx0bGV0IHRvZGF5ID0gbm92ZWxTdGF0Q2FjaGUuaGlzdG9yeVRvZGF5KCk7XG5cblx0XHRcdFx0XHR0b2RheS5zZWdtZW50LnB1c2goW3BhdGhNYWluLCBub3ZlbElEXSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cblx0XHRcdFx0cmV0dXJuIHJldC5jb3VudC5jaGFuZ2VkO1xuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGZzXG5cdFx0XHRcdFx0LndyaXRlSlNPTihqc29uZmlsZV9kb25lLCBkb25lX2xpc3RfY2FjaGUpXG5cdFx0XHRcdFx0LmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpKVxuXHRcdFx0XHRcdDtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goYXN5bmMgZnVuY3Rpb24gKGUpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChlID09IEVSUk9SX01TR18wMDEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oRVJST1JfTVNHXzAwMSk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUoanNvbmZpbGUpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoZSlcblx0XHRcdH0pXG5cdFx0XHQ7XG5cdH0pKCkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKG4pXG5cdFx0e1xuXHRcdFx0cHJvY2Vzcy5leGl0KG4gfHwgMClcblx0XHR9KVxuXHQ7XG59XG4iXX0=