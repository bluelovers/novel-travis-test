"use strict";
/**
 * Created by user on 2017/8/13/013.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.project_root = path.join(__dirname);
exports.cache_root = path.join(exports.project_root, '.cache');
exports.novel_root = path.join(exports.project_root, 'dist_novel');
const self = require("./project.config");
exports.default = self;
