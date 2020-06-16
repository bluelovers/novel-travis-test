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
//# sourceMappingURL=novel-stat.js.map