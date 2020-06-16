"use strict";
/**
 * Created by user on 2018/7/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const toc_1 = require("@node-novel/toc");
const index_1 = require("../index");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const path = require("path");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && toc_1.processToc(project_config_1.default.novel_root)
    .then(async function (ls) {
    await toc_1.Promise.each(Object.keys(ls), function (pathMain) {
        let file = path.join(project_config_1.default.novel_root, pathMain, 'README.md');
        return index_1.crossSpawnAsync('git', [
            'add',
            '--verbose',
            file,
        ], {
            stdio: 'inherit',
            cwd: project_config_1.default.novel_root,
        });
    });
    return index_1.crossSpawnAsync('git', [
        'commit',
        '-a',
        '-m',
        `[TOC] auto update toc`,
    ], {
        stdio: 'inherit',
        cwd: project_config_1.default.novel_root,
    });
});
//# sourceMappingURL=_create_toc.js.map