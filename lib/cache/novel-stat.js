"use strict";
/**
 * Created by user on 2018/12/17/017.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNovelStatCache = exports.createMoment = void 0;
const project_config_1 = require("../../project.config");
const path = require("upath2");
const cache_loader_1 = require("@node-novel/cache-loader");
Object.defineProperty(exports, "createMoment", { enumerable: true, get: function () { return cache_loader_1.createMoment; } });
function getNovelStatCache() {
    return cache_loader_1.NovelStatCache.create({
        file: path.join(project_config_1.default.cache_root, 'novel-stat.json'),
        file_git: path.join(project_config_1.default.novel_root, 'novel-stat.json'),
    });
}
exports.getNovelStatCache = getNovelStatCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm92ZWwtc3RhdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5vdmVsLXN0YXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCx5REFBaUQ7QUFDakQsK0JBQWdDO0FBRWhDLDJEQUF3RTtBQUUvRCw2RkFGZ0IsMkJBQVksT0FFaEI7QUFFckIsU0FBZ0IsaUJBQWlCO0lBRWhDLE9BQU8sNkJBQWMsQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUM7UUFDNUQsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUM7S0FDaEUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQU5ELDhDQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMi8xNy8wMTcuXG4gKi9cblxuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcblxuaW1wb3J0IHsgTm92ZWxTdGF0Q2FjaGUsIGNyZWF0ZU1vbWVudCB9IGZyb20gJ0Bub2RlLW5vdmVsL2NhY2hlLWxvYWRlcic7XG5cbmV4cG9ydCB7IGNyZWF0ZU1vbWVudCB9XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb3ZlbFN0YXRDYWNoZSgpXG57XG5cdHJldHVybiBOb3ZlbFN0YXRDYWNoZS5jcmVhdGUoe1xuXHRcdGZpbGU6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdub3ZlbC1zdGF0Lmpzb24nKSxcblx0XHRmaWxlX2dpdDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgJ25vdmVsLXN0YXQuanNvbicpLFxuXHR9KTtcbn1cbiJdfQ==