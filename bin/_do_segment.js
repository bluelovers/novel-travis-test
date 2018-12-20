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
let { pathMain, novelID, novel_root, runAll } = yargs.argv;
if (pathMain && novelID) {
    Promise.resolve((async () => {
        let dir = path.join(project_config_1.default.cache_root, 'files', pathMain);
        let jsonfile = path.join(dir, novelID + '.json');
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
        return segment_1.doSegmentGlob({
            pathMain,
            novelID,
            novel_root,
            files: (!runAll && Array.isArray(ls)) ? ls : null,
            callback(done_list, file, index, length) {
                if ((index % 10) == 0 || ((index + 1) >= length)) {
                    log_1.default.grey(`[${index}/${length}]`, file);
                    ls = ls.filter(function (v) {
                        return done_list.indexOf(v) == -1;
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
                return ret.done_list.indexOf(v) == -1;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2RvX3NlZ21lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfZG9fc2VnbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBK0I7QUFDL0IsK0JBQStCO0FBQy9CLCtDQUFpRTtBQUNqRSxzREFBOEM7QUFDOUMsK0JBQWdDO0FBQ2hDLG9DQUFvQztBQUNwQyx1Q0FBMkM7QUFDM0Msb0NBQWlDO0FBQ2pDLHNDQUFzRDtBQUN0RCx3REFBNEU7QUFFNUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFFM0QsSUFBSSxRQUFRLElBQUksT0FBTyxFQUN2QjtJQUNDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUUzQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNqRSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFFakQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQzVCO1lBQ0MsT0FBTyxDQUFDLENBQUM7U0FDVDtRQUVELElBQUksRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQWEsQ0FBQztRQUVqRCxNQUFNLEdBQUcsa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV6QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUNqRDtZQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFF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QztnQkFFakMsSUFBSSxLQUFLLEdBQUcsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUUxQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXRCLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDMUIsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLEtBQUssV0FBVyxDQUFDO1lBRXZCLElBQUksQ0FBQyxJQUFJLHVCQUFhLEVBQ3RCO2dCQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsdUJBQWEsQ0FBQyxDQUFDO2dCQUU1QixNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRTFCLE9BQU8sQ0FBQyxDQUFDO2FBQ1Q7WUFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDekIsQ0FBQyxDQUFDLENBQ0Q7SUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDO1NBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUVoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUNyQixDQUFDLENBQUMsQ0FDRjtDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgcHJvY2Vzc1RvY0NvbnRlbnRzIGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgeWFyZ3MgZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgZG9TZWdtZW50R2xvYiwgRVJST1JfTVNHXzAwMSB9IGZyb20gJy4uL3NjcmlwdC9zZWdtZW50JztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBlbnZCb29sLCB7IGVudlZhbCB9IGZyb20gJ2Vudi1ib29sJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgc2hvd01lbW9yeVVzYWdlLCBmcmVlR0MgfSBmcm9tICcuLi9saWIvdXRpbCc7XG5pbXBvcnQgeyBOb3ZlbFN0YXRDYWNoZSwgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5cbmxldCB7IHBhdGhNYWluLCBub3ZlbElELCBub3ZlbF9yb290LCBydW5BbGwgfSA9IHlhcmdzLmFyZ3Y7XG5cbmlmIChwYXRoTWFpbiAmJiBub3ZlbElEKVxue1xuXHRQcm9taXNlLnJlc29sdmUoKGFzeW5jICgpID0+XG5cdHtcblx0XHRsZXQgZGlyID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJywgcGF0aE1haW4pO1xuXHRcdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihkaXIsIG5vdmVsSUQgKyAnLmpzb24nKTtcblxuXHRcdGlmICghZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0bGV0IGxzID0gYXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGUpIGFzIHN0cmluZ1tdO1xuXG5cdFx0cnVuQWxsID0gZW52Qm9vbChydW5BbGwpO1xuXG5cdFx0aWYgKCFydW5BbGwgJiYgKCFBcnJheS5pc0FycmF5KGxzKSB8fCAhbHMubGVuZ3RoKSlcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhgW1NlZ21lbnQ6c2tpcF1gLCBwYXRoTWFpbiwgbm92ZWxJRCwgbHMpO1xuXG5cdFx0XHRhd2FpdCBmcy5yZW1vdmUoanNvbmZpbGUpO1xuXG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHRpZiAocnVuQWxsKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZGVidWcoYFtTZWdtZW50XWAsIHBhdGhNYWluLCBub3ZlbElELCBgcnVuQWxsOiAke3J1bkFsbH1gKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGBbU2VnbWVudF1gLCBwYXRoTWFpbiwgbm92ZWxJRCwgYHJ1bkFsbDogJHtydW5BbGx9YCk7XG5cdFx0fVxuXG5cdFx0aWYgKCFydW5BbGwpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5ncmV5KGBsaXN0OmAsIGxzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZG9TZWdtZW50R2xvYih7XG5cdFx0XHRwYXRoTWFpbixcblx0XHRcdG5vdmVsSUQsXG5cdFx0XHRub3ZlbF9yb290LFxuXG5cdFx0XHRmaWxlczogKCFydW5BbGwgJiYgQXJyYXkuaXNBcnJheShscykpID8gbHMgOiBudWxsLFxuXG5cdFx0XHRjYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICgoaW5kZXggJSAxMCkgPT0gMCB8fCAoKGluZGV4ICsgMSkgPj0gbGVuZ3RoKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUuZ3JleShgWyR7aW5kZXh9LyR7bGVuZ3RofV1gLCBmaWxlKTtcblxuXHRcdFx0XHRcdGxzID0gbHMuZmlsdGVyKGZ1bmN0aW9uICh2KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHJldHVybiBkb25lX2xpc3QuaW5kZXhPZih2KSA9PSAtMVxuXHRcdFx0XHRcdH0pO1xuXG4vL1x0XHRcdFx0XHRjb25zb2xlLmxvZyhscy5sZW5ndGgpO1xuXG5cdFx0XHRcdFx0aWYgKGxzLmxlbmd0aCA9PSAwKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZzLnJlbW92ZVN5bmMoanNvbmZpbGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZnMud3JpdGVKU09OU3luYyhqc29uZmlsZSwgbHMsIHtcblx0XHRcdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNob3dNZW1vcnlVc2FnZSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZnJlZUdDKCk7XG5cdFx0XHR9LFxuXHRcdH0pXG5cdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0e1xuXHRcdFx0XHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiByZXQuZG9uZV9saXN0LmluZGV4T2YodikgPT0gLTFcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc29sZS5lcnJvcihgbHM6ICR7bHMubGVuZ3RofWApO1xuXG5cdFx0XHRcdGlmIChscy5sZW5ndGggPT0gMCB8fCAxKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKGpzb25maWxlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblx0XHRcdFx0bGV0IHN0YXQgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0aWYgKHJldC5jb3VudC5jaGFuZ2VkID4gMClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0YXQuc2VnbWVudF9kYXRlID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRcdHN0YXQuc2VnbWVudF9vbGQgPSBzdGF0LnNlZ21lbnQgfCAwO1xuXHRcdFx0XHRcdHN0YXQuc2VnbWVudCA9IHJldC5jb3VudC5jaGFuZ2VkO1xuXG5cdFx0XHRcdFx0bGV0IHRvZGF5ID0gbm92ZWxTdGF0Q2FjaGUuaGlzdG9yeVRvZGF5KCk7XG5cblx0XHRcdFx0XHR0b2RheS5zZWdtZW50LnB1c2goW3BhdGhNYWluLCBub3ZlbElEXSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cblx0XHRcdFx0cmV0dXJuIHJldC5jb3VudC5jaGFuZ2VkO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChhc3luYyBmdW5jdGlvbiAoZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKGUgPT0gRVJST1JfTVNHXzAwMSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihFUlJPUl9NU0dfMDAxKTtcblxuXHRcdFx0XHRcdGF3YWl0IGZzLnJlbW92ZShqc29uZmlsZSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlamVjdChlKVxuXHRcdFx0fSlcblx0XHRcdDtcblx0fSkoKSlcblx0XHQudGhlbihmdW5jdGlvbiAobilcblx0XHR7XG5cdFx0XHRwcm9jZXNzLmV4aXQobiB8fCAwKVxuXHRcdH0pXG5cdDtcbn1cbiJdfQ==