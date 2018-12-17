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
            if (ret.count.changed > 0) {
                const novelStatCache = novel_stat_1.getNovelStatCache();
                let stat = novelStatCache.novel(pathMain, novelID);
                stat.segment_date = Date.now();
                novelStatCache.save();
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2RvX3NlZ21lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfZG9fc2VnbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBK0I7QUFDL0IsK0JBQStCO0FBQy9CLCtDQUFpRTtBQUNqRSxzREFBOEM7QUFDOUMsK0JBQWdDO0FBQ2hDLG9DQUFvQztBQUNwQyx1Q0FBMkM7QUFDM0Msb0NBQWlDO0FBQ2pDLHNDQUFzRDtBQUN0RCx3REFBNEU7QUFFNUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFFM0QsSUFBSSxRQUFRLElBQUksT0FBTyxFQUN2QjtJQUNDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUUzQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNqRSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFFakQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQzVCO1lBQ0MsT0FBTyxDQUFDLENBQUM7U0FDVDtRQUVELElBQUksRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQWEsQ0FBQztRQUVqRCxNQUFNLEdBQUcsa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV6QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUNqRDtZQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFF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QUFLLFdBQVcsQ0FBQztZQUV2QixJQUFJLENBQUMsSUFBSSx1QkFBYSxFQUN0QjtnQkFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHVCQUFhLENBQUMsQ0FBQztnQkFFNUIsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUUxQixPQUFPLENBQUMsQ0FBQzthQUNUO1lBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3pCLENBQUMsQ0FBQyxDQUNEO0lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUNILElBQUksQ0FBQyxVQUFVLENBQUM7UUFFaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7SUFDckIsQ0FBQyxDQUFDLENBQ0Y7Q0FDRCIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IHByb2Nlc3NUb2NDb250ZW50cyBmcm9tICdAbm9kZS1ub3ZlbC90b2MvdG9jX2NvbnRlbnRzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcbmltcG9ydCB7IGRvU2VnbWVudEdsb2IsIEVSUk9SX01TR18wMDEgfSBmcm9tICcuLi9zY3JpcHQvc2VnbWVudCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgZW52Qm9vbCwgeyBlbnZWYWwgfSBmcm9tICdlbnYtYm9vbCc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IHNob3dNZW1vcnlVc2FnZSwgZnJlZUdDIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IHsgTm92ZWxTdGF0Q2FjaGUsIGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuXG5sZXQgeyBwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxfcm9vdCwgcnVuQWxsIH0gPSB5YXJncy5hcmd2O1xuXG5pZiAocGF0aE1haW4gJiYgbm92ZWxJRClcbntcblx0UHJvbWlzZS5yZXNvbHZlKChhc3luYyAoKSA9PlxuXHR7XG5cdFx0bGV0IGRpciA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycsIHBhdGhNYWluKTtcblx0XHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oZGlyLCBub3ZlbElEICsgJy5qc29uJyk7XG5cblx0XHRpZiAoIWZzLmV4aXN0c1N5bmMoanNvbmZpbGUpKVxuXHRcdHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdGxldCBscyA9IGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlKSBhcyBzdHJpbmdbXTtcblxuXHRcdHJ1bkFsbCA9IGVudkJvb2wocnVuQWxsKTtcblxuXHRcdGlmICghcnVuQWxsICYmICghQXJyYXkuaXNBcnJheShscykgfHwgIWxzLmxlbmd0aCkpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYFtTZWdtZW50OnNraXBdYCwgcGF0aE1haW4sIG5vdmVsSUQsIGxzKTtcblxuXHRcdFx0YXdhaXQgZnMucmVtb3ZlKGpzb25maWxlKTtcblxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0aWYgKHJ1bkFsbClcblx0XHR7XG5cdFx0XHRjb25zb2xlLmRlYnVnKGBbU2VnbWVudF1gLCBwYXRoTWFpbiwgbm92ZWxJRCwgYHJ1bkFsbDogJHtydW5BbGx9YCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhgW1NlZ21lbnRdYCwgcGF0aE1haW4sIG5vdmVsSUQsIGBydW5BbGw6ICR7cnVuQWxsfWApO1xuXHRcdH1cblxuXHRcdGlmICghcnVuQWxsKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZ3JleShgbGlzdDpgLCBscyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRvU2VnbWVudEdsb2Ioe1xuXHRcdFx0cGF0aE1haW4sXG5cdFx0XHRub3ZlbElELFxuXHRcdFx0bm92ZWxfcm9vdCxcblxuXHRcdFx0ZmlsZXM6ICghcnVuQWxsICYmIEFycmF5LmlzQXJyYXkobHMpKSA/IGxzIDogbnVsbCxcblxuXHRcdFx0Y2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoKGluZGV4ICUgMTApID09IDAgfHwgKChpbmRleCArIDEpID49IGxlbmd0aCkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLmdyZXkoYFske2luZGV4fS8ke2xlbmd0aH1dYCwgZmlsZSk7XG5cblx0XHRcdFx0XHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZG9uZV9saXN0LmluZGV4T2YodikgPT0gLTFcblx0XHRcdFx0XHR9KTtcblxuLy9cdFx0XHRcdFx0Y29uc29sZS5sb2cobHMubGVuZ3RoKTtcblxuXHRcdFx0XHRcdGlmIChscy5sZW5ndGggPT0gMClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmcy5yZW1vdmVTeW5jKGpzb25maWxlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZzLndyaXRlSlNPTlN5bmMoanNvbmZpbGUsIGxzLCB7XG5cdFx0XHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzaG93TWVtb3J5VXNhZ2UoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZyZWVHQygpO1xuXHRcdFx0fSxcblx0XHR9KVxuXHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdHtcblx0XHRcdFx0bHMgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gcmV0LmRvbmVfbGlzdC5pbmRleE9mKHYpID09IC0xXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYGxzOiAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0XHRpZiAobHMubGVuZ3RoID09IDAgfHwgMSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IGZzLnJlbW92ZShqc29uZmlsZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocmV0LmNvdW50LmNoYW5nZWQgPiAwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXHRcdFx0XHRcdGxldCBzdGF0ID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHRcdHN0YXQuc2VnbWVudF9kYXRlID0gRGF0ZS5ub3coKTtcblx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcmV0LmNvdW50LmNoYW5nZWQ7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGFzeW5jIGZ1bmN0aW9uIChlKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoZSA9PSBFUlJPUl9NU0dfMDAxKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKEVSUk9SX01TR18wMDEpO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKGpzb25maWxlKTtcblxuXHRcdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGUpXG5cdFx0XHR9KVxuXHRcdFx0O1xuXHR9KSgpKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChuKVxuXHRcdHtcblx0XHRcdHByb2Nlc3MuZXhpdChuIHx8IDApXG5cdFx0fSlcblx0O1xufVxuIl19