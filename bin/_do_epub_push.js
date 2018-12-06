#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const git_1 = require("../data/git");
const fs = require("fs-extra");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const git_2 = require("../script/git");
const path = require("upath2");
const index_1 = require("../index");
const log_1 = require("../lib/log");
let waitpush = path.join(project_config_1.default.cache_root, 'epub.waitpush');
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {
    if (!index_1.isGitRoot(git_1.GIT_SETTING_EPUB.targetPath)) {
        log_1.default.warn(`dist_novel not a git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
        throw new Error(`something wrong when create git`);
    }
    if (!fs.existsSync(waitpush)) {
        return;
    }
    //await pushGit(GIT_SETTING_EPUB.targetPath, getPushUrl(GIT_SETTING_EPUB.url), true);
    await git_2.pushGit(git_1.GIT_SETTING_EPUB.targetPath, 'origin', true);
    await fs.remove(waitpush);
})();
