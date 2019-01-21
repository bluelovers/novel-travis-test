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
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    let ls;
    ls = await toc_1.get_ids(project_config_1.default.novel_root)
        .reduce(async function (memo, pathMain) {
        await Promise
            .mapSeries(FastGlob([
            '*/README.md',
        ], {
            cwd: path.join(project_config_1.default.novel_root, pathMain),
        }), function (p) {
            let novelID = path.basename(path.dirname(p));
            memo.push({ pathMain, novelID });
        });
        return memo;
    }, []);
    if (ls && ls.length) {
        log_1.default.info(`更新 meta`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3VwZGF0ZV9tZXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3VwZGF0ZV9tZXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQTBDO0FBQzFDLHdEQUE0RDtBQUM1RCx3Q0FBMEU7QUFDMUUsc0RBQThDO0FBQzlDLHNDQUFzQztBQUN0Qyw2QkFBOEI7QUFDOUIsMkNBQXNFO0FBQ3RFLG9DQUFxQztBQUNyQyxvQ0FBaUM7QUFFakMsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBRWpCLE1BQU0sY0FBYyxHQUFHLDhCQUFpQixFQUFFLENBQUM7SUFFM0MsSUFBSSxFQUEyQyxDQUFDO0lBRWhELEVBQUUsR0FBRyxNQUFNLGFBQU8sQ0FBQyx3QkFBYSxDQUFDLFVBQVUsQ0FBQztTQUMxQyxNQUFNLENBQUMsS0FBSyxXQUFXLElBQUksRUFBRSxRQUFnQjtRQUU3QyxNQUFNLE9BQU87YUFDWCxTQUFTLENBQUMsUUFBUSxDQUFTO1lBQzNCLGFBQWE7U0FDYixFQUFFO1lBQ0YsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO1NBQ2xELENBQUMsRUFBRSxVQUFVLENBQUM7WUFFZCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3QyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FDTjtJQUVELElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQ25CO1FBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixNQUFNLE9BQU87YUFDWCxTQUFTLENBQUMsRUFBRSxFQUFFLEtBQUssV0FBVyxJQUFJO1lBRWxDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBRW5DLElBQUksSUFBSSxHQUFHLG9CQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTVDLElBQUksSUFBSSxFQUNSO2dCQUNDLGNBQWMsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkQsYUFBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDbkM7UUFDRixDQUFDLENBQUMsQ0FDRjtRQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFckIsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3RCO0FBRUYsQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldF9pZHMgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IHsgZ2V0TWRjb25mTWV0YSwgZ2V0TWRjb25mTWV0YUJ5UGF0aCB9IGZyb20gJy4uL2xpYi91dGlsL21ldGEnO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5cbmNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lUXG5dKSAmJiAoYXN5bmMgKCkgPT4ge1xuXG5cdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXTtcblxuXHRscyA9IGF3YWl0IGdldF9pZHMoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHRcdC5yZWR1Y2UoYXN5bmMgZnVuY3Rpb24gKG1lbW8sIHBhdGhNYWluOiBzdHJpbmcpXG5cdFx0e1xuXHRcdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iPHN0cmluZz4oW1xuXHRcdFx0XHRcdCcqL1JFQURNRS5tZCcsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIHBhdGhNYWluKSxcblx0XHRcdFx0fSksIGZ1bmN0aW9uIChwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsSUQgPSBwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShwKSk7XG5cblx0XHRcdFx0XHRtZW1vLnB1c2goeyBwYXRoTWFpbiwgbm92ZWxJRCB9KTtcblx0XHRcdFx0fSlcblx0XHRcdDtcblxuXHRcdFx0cmV0dXJuIG1lbW87XG5cdFx0fSwgW10pXG5cdDtcblxuXHRpZiAobHMgJiYgbHMubGVuZ3RoKVxuXHR7XG5cdFx0Y29uc29sZS5pbmZvKGDmm7TmlrAgbWV0YWApO1xuXG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0Y29uc29sZS5pbmZvKGBkb25lYCk7XG5cblx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdH1cblxufSkoKTtcbiJdfQ==