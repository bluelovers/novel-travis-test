#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const git_1 = require("../data/git");
const fs = require("fs-extra");
const project_config_1 = require("../project.config");
const git_2 = require("../script/git");
const path = require("upath2");
const index_1 = require("../index");
let waitpush = path.join(project_config_1.default.cache_root, 'epub.waitpush');
(async () => {
    if (!index_1.isGitRoot(git_1.GIT_SETTING_EPUB.targetPath)) {
        console.warn(`dist_novel not a git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
        throw new Error(`something wrong when create git`);
    }
    if (!fs.existsSync(waitpush)) {
        return;
    }
    await git_2.pushGit(git_1.GIT_SETTING_EPUB.targetPath, git_2.getPushUrl(git_1.GIT_SETTING_EPUB.url), true);
    await fs.remove(waitpush);
})();
