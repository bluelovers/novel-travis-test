"use strict";
/**
 * Created by user on 2017/8/13/013.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectConfig = exports.EPUB_CONTEXT_DATE = exports.MAX_SCRIPT_TIMEOUT = exports.outputUrl = exports.sourceUrl = exports.epub_root = exports.novel_root = exports.cache_root = exports.project_root = void 0;
require("source-map-support/register");
const path = require("path");
exports.project_root = path.join(__dirname);
exports.cache_root = path.join(exports.project_root, '.cache');
exports.novel_root = path.join(exports.project_root, 'dist_novel');
exports.epub_root = path.join(exports.project_root, 'dist_epub');
//export const sourceUrl = 'https://gitee.com/bluelovers/novel/tree/master';
exports.sourceUrl = 'https://gitlab.com/novel-group/txt-source/blob/master';
exports.outputUrl = 'https://gitlab.com/demonovel/epub-txt/blob/master';
exports.MAX_SCRIPT_TIMEOUT = 10 * 60 * 1000;
exports.EPUB_CONTEXT_DATE = new Date('2000-12-24 23:00:00Z');
exports.ProjectConfig = exports;
exports.default = exports.ProjectConfig;
//# sourceMappingURL=project.config.js.map