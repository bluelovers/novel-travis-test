"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const meta_1 = require("../lib/util/meta");
const Promise = require("bluebird");
const log_1 = require("../lib/log");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT,
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    let ls;
    ls = meta_1.filterIDs(project_config_1.default.novel_root);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3VwZGF0ZV9tZXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3VwZGF0ZV9tZXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzREFBOEM7QUFHOUMsMkNBQWlGO0FBQ2pGLG9DQUFxQztBQUNyQyxvQ0FBaUM7QUFHakMsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBR2pCLE1BQU0sY0FBYyxHQUFHLDhCQUFpQixFQUFFLENBQUM7SUFFM0MsSUFBSSxFQUEyQyxDQUFDO0lBRWhELEVBQUUsR0FBRyxnQkFBUyxDQUFDLHdCQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFekMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFDbkI7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXhCLFlBQVk7UUFDWixjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFaEMsTUFBTSxPQUFPO2FBQ1gsU0FBUyxDQUFDLEVBQUUsRUFBRSxLQUFLLFdBQVcsSUFBSTtZQUVsQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUVuQyxJQUFJLElBQUksR0FBRyxvQkFBYSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1QyxJQUFJLElBQUksRUFDUjtnQkFDQyxjQUFjLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25ELGFBQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ25DO1FBQ0YsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxhQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXJCLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUN0QjtBQUVGLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRfaWRzIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCB7IGdldE1kY29uZk1ldGEsIGdldE1kY29uZk1ldGFCeVBhdGgsIGZpbHRlcklEcyB9IGZyb20gJy4uL2xpYi91dGlsL21ldGEnO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBfdHJpbSwgY3JlYXRlU29ydENhbGxiYWNrLCBkZWZhdWx0U29ydENhbGxiYWNrLCBFbnVtVG9Mb3dlckNhc2UsIG5hdHVyYWxDb21wYXJlIH0gZnJvbSAnQG5vZGUtbm92ZWwvc29ydCc7XG5cbmNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lULFxuXSkgJiYgKGFzeW5jICgpID0+XG57XG5cblx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdO1xuXG5cdGxzID0gZmlsdGVySURzKFByb2plY3RDb25maWcubm92ZWxfcm9vdCk7XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGNvbnNvbGUuaW5mbyhg5pu05pawIG1ldGFgKTtcblxuXHRcdC8vIOeyvuewoSBtZGNvbmZcblx0XHRub3ZlbFN0YXRDYWNoZS5kYXRhLm1kY29uZiA9IHt9O1xuXG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0Y29uc29sZS5pbmZvKGBkb25lYCk7XG5cblx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdH1cblxufSkoKTtcbiJdfQ==