"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const toc_1 = require("@node-novel/toc");
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const FastGlob = require("fast-glob");
const path = require("path");
const meta_1 = require("../lib/util/meta");
const Promise = require("bluebird");
const log_1 = require("../lib/log");
const sort_1 = require("@node-novel/sort");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT,
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    let ls;
    ls = await toc_1.get_ids(project_config_1.default.novel_root)
        .then(function (ls) {
        ls
            .sort(function (a, b) {
            if (a.replace(/_out$/, '') === b.replace(/_out$/, '')) {
                if (/_out$/.test(a)) {
                    return 1;
                }
                else {
                    return -1;
                }
            }
            return sort_1.naturalCompare(a, b);
        });
        return ls;
    })
        .reduce(async function (memo, pathMain) {
        let _m = pathMain.match(/^(.+?)(_out)?$/);
        let is_out = !!_m[2];
        let pathMain_base = _m[1];
        memo[pathMain_base] = memo[pathMain] || {};
        await Promise
            .mapSeries(FastGlob([
            '*/README.md',
        ], {
            cwd: path.join(project_config_1.default.novel_root, pathMain),
        }), function (p) {
            let novelID = path.basename(path.dirname(p));
            memo[pathMain_base][novelID] = {
                pathMain,
                novelID,
            };
        });
        return memo;
    }, {})
        .then(function (memo) {
        let list = [];
        Object.values(memo)
            .forEach(function (ls) {
            Object.values(ls)
                .forEach(function ({ pathMain, novelID, }) {
                list.push({
                    pathMain,
                    novelID,
                });
            });
        });
        return list;
    });
    if (ls && ls.length) {
        log_1.default.info(`更新 meta`);
        // 精簡 mdconf
        novelStatCache.data.mdconf = {};
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let meta = meta_1.getMdconfMeta(pathMain, novelID);
            if (meta) {
                novelStatCache.mdconf_set(pathMain, novelID, meta);
                log_1.default.success(pathMain, novelID);
            }
        });
        log_1.default.info(`done`);
        novelStatCache.save();
    }
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3VwZGF0ZV9tZXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3VwZGF0ZV9tZXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQTBDO0FBQzFDLHdEQUE0RDtBQUM1RCx3Q0FBMEU7QUFDMUUsc0RBQThDO0FBQzlDLHNDQUFzQztBQUN0Qyw2QkFBOEI7QUFDOUIsMkNBQXNFO0FBQ3RFLG9DQUFxQztBQUNyQyxvQ0FBaUM7QUFDakMsMkNBQW1IO0FBRW5ILGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUdqQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0lBRTNDLElBQUksRUFBMkMsQ0FBQztJQUVoRCxFQUFFLEdBQUcsTUFBTSxhQUFPLENBQUMsd0JBQWEsQ0FBQyxVQUFVLENBQUM7U0FDMUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUVqQixFQUFFO2FBQ0EsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFFbkIsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFDckQ7Z0JBQ0MsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNuQjtvQkFDQyxPQUFPLENBQUMsQ0FBQztpQkFDVDtxQkFFRDtvQkFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNWO2FBQ0Q7WUFFRCxPQUFPLHFCQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUNGO1FBRUQsT0FBTyxFQUFFLENBQUM7SUFDWCxDQUFDLENBQUM7U0FDRCxNQUFNLENBQUMsS0FBSyxXQUFXLElBQUksRUFBRSxRQUFnQjtRQUU3QyxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFMUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFMUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFM0MsTUFBTSxPQUFPO2FBQ1gsU0FBUyxDQUFDLFFBQVEsQ0FBUztZQUMzQixhQUFhO1NBQ2IsRUFBRTtZQUNGLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQztTQUNsRCxDQUFDLEVBQUUsVUFBVSxDQUFDO1lBRWQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFN0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHO2dCQUM5QixRQUFRO2dCQUNSLE9BQU87YUFDUCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsRUFBRSxFQU9GLENBQUM7U0FDRCxJQUFJLENBQUMsVUFBVSxJQUFJO1FBRW5CLElBQUksSUFBSSxHQUE0QyxFQUFFLENBQUM7UUFFdkQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7YUFDakIsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUVwQixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztpQkFDZixPQUFPLENBQUMsVUFBVSxFQUNsQixRQUFRLEVBQ1IsT0FBTyxHQUNQO2dCQUVBLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ1QsUUFBUTtvQkFDUixPQUFPO2lCQUNQLENBQUMsQ0FBQTtZQUNILENBQUMsQ0FBQyxDQUNGO1FBQ0YsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQTtJQUNaLENBQUMsQ0FBQyxDQUNGO0lBRUQsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFDbkI7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXhCLFlBQVk7UUFDWixjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFaEMsTUFBTSxPQUFPO2FBQ1gsU0FBUyxDQUFDLEVBQUUsRUFBRSxLQUFLLFdBQVcsSUFBSTtZQUVsQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUVuQyxJQUFJLElBQUksR0FBRyxvQkFBYSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1QyxJQUFJLElBQUksRUFDUjtnQkFDQyxjQUFjLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25ELGFBQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ25DO1FBQ0YsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxhQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXJCLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUN0QjtBQUVGLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRfaWRzIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCB7IGdldE1kY29uZk1ldGEsIGdldE1kY29uZk1ldGFCeVBhdGggfSBmcm9tICcuLi9saWIvdXRpbC9tZXRhJztcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgX3RyaW0sIGNyZWF0ZVNvcnRDYWxsYmFjaywgZGVmYXVsdFNvcnRDYWxsYmFjaywgRW51bVRvTG93ZXJDYXNlLCBuYXR1cmFsQ29tcGFyZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3NvcnQnO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVCxcbl0pICYmIChhc3luYyAoKSA9Plxue1xuXG5cdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXTtcblxuXHRscyA9IGF3YWl0IGdldF9pZHMoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRsc1xuXHRcdFx0XHQuc29ydChmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChhLnJlcGxhY2UoL19vdXQkLywgJycpID09PSBiLnJlcGxhY2UoL19vdXQkLywgJycpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmICgvX291dCQvLnRlc3QoYSkpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIG5hdHVyYWxDb21wYXJlKGEsIGIpO1xuXHRcdFx0XHR9KVxuXHRcdFx0O1xuXG5cdFx0XHRyZXR1cm4gbHM7XG5cdFx0fSlcblx0XHQucmVkdWNlKGFzeW5jIGZ1bmN0aW9uIChtZW1vLCBwYXRoTWFpbjogc3RyaW5nKVxuXHRcdHtcblx0XHRcdGxldCBfbSA9IHBhdGhNYWluLm1hdGNoKC9eKC4rPykoX291dCk/JC8pO1xuXG5cdFx0XHRsZXQgaXNfb3V0ID0gISFfbVsyXTtcblx0XHRcdGxldCBwYXRoTWFpbl9iYXNlID0gX21bMV07XG5cblx0XHRcdG1lbW9bcGF0aE1haW5fYmFzZV0gPSBtZW1vW3BhdGhNYWluXSB8fCB7fTtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iPHN0cmluZz4oW1xuXHRcdFx0XHRcdCcqL1JFQURNRS5tZCcsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIHBhdGhNYWluKSxcblx0XHRcdFx0fSksIGZ1bmN0aW9uIChwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsSUQgPSBwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShwKSk7XG5cblx0XHRcdFx0XHRtZW1vW3BhdGhNYWluX2Jhc2VdW25vdmVsSURdID0ge1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cblx0XHRcdHJldHVybiBtZW1vO1xuXHRcdH0sIHt9IGFzIHtcblx0XHRcdFtwYXRoTWFpbl9iYXNlOiBzdHJpbmddOiB7XG5cdFx0XHRcdFtub3ZlbElEOiBzdHJpbmddOiB7XG5cdFx0XHRcdFx0cGF0aE1haW46IHN0cmluZyxcblx0XHRcdFx0XHRub3ZlbElEOiBzdHJpbmcsXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChtZW1vKVxuXHRcdHtcblx0XHRcdGxldCBsaXN0OiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRcdFx0T2JqZWN0LnZhbHVlcyhtZW1vKVxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAobHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRPYmplY3QudmFsdWVzKGxzKVxuXHRcdFx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKHtcblx0XHRcdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsaXN0LnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblx0XHRcdFx0fSlcblx0XHRcdDtcblxuXHRcdFx0cmV0dXJuIGxpc3Rcblx0XHR9KVxuXHQ7XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGNvbnNvbGUuaW5mbyhg5pu05pawIG1ldGFgKTtcblxuXHRcdC8vIOeyvuewoSBtZGNvbmZcblx0XHRub3ZlbFN0YXRDYWNoZS5kYXRhLm1kY29uZiA9IHt9O1xuXG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0Y29uc29sZS5pbmZvKGBkb25lYCk7XG5cblx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdH1cblxufSkoKTtcbiJdfQ==