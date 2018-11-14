"use strict";
/**
 * Created by user on 2018/7/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const toc_root_1 = require("@node-novel/toc/toc-root");
const index_1 = require("../index");
const project_config_1 = require("../project.config");
// @ts-ignore
const toc_1 = require("@node-novel/toc");
const path = require("path");
let p = toc_1.processToc(project_config_1.default.novel_root)
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
toc_1.Promise.resolve(p)
    .finally(function () {
    return toc_root_1.createTocRoot(project_config_1.default.novel_root, path.join(project_config_1.default.novel_root, 'README.md'))
        .tap(async function () {
        let file = path.join(project_config_1.default.novel_root, 'README.md');
        await index_1.crossSpawnAsync('git', [
            'add',
            '--verbose',
            file,
        ], {
            stdio: 'inherit',
            cwd: project_config_1.default.novel_root,
        });
        return index_1.crossSpawnAsync('git', [
            'commit',
            '-a',
            '-m',
            `[TOC] toc root`,
        ], {
            stdio: 'inherit',
            cwd: project_config_1.default.novel_root,
        });
    });
});
