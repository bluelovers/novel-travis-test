"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIST_NOVEL = exports.isGitRoot = exports.stripAnsi = exports.crossSpawnOutput = exports.getCrossSpawnError = exports.crossSpawnSync = exports.crossSpawnAsync = void 0;
const cross_spawn_1 = require("./lib/util/cross-spawn");
Object.defineProperty(exports, "crossSpawnAsync", { enumerable: true, get: function () { return cross_spawn_1.crossSpawnAsync; } });
Object.defineProperty(exports, "crossSpawnSync", { enumerable: true, get: function () { return cross_spawn_1.crossSpawnSync; } });
Object.defineProperty(exports, "getCrossSpawnError", { enumerable: true, get: function () { return cross_spawn_1.getCrossSpawnError; } });
Object.defineProperty(exports, "crossSpawnOutput", { enumerable: true, get: function () { return cross_spawn_1.crossSpawnOutput; } });
Object.defineProperty(exports, "stripAnsi", { enumerable: true, get: function () { return cross_spawn_1.stripAnsi; } });
// @ts-ignore
const git_root2_1 = require("git-root2");
Object.defineProperty(exports, "isGitRoot", { enumerable: true, get: function () { return git_root2_1.isGitRoot; } });
const project_config_1 = require("./project.config");
exports.DIST_NOVEL = project_config_1.default.novel_root;
//# sourceMappingURL=index.js.map