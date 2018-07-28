"use strict";
/**
 * Created by user on 2018/7/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const project_config_1 = require("../project.config");
// @ts-ignore
const toc_1 = require("@node-novel/toc");
toc_1.processToc(project_config_1.default.novel_root)
    .then(function (ls) {
});
