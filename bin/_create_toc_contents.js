"use strict";
/**
 * Created by user on 2018/8/14/014.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const toc_contents_1 = require("@node-novel/toc/toc_contents");
const Promise = require("bluebird");
const git_1 = require("../data/git");
const project_config_1 = require("../project.config");
const git_2 = require("../script/git");
const gitee_pr_1 = require("../script/gitee-pr");
const index_1 = require("../index");
const path = require("path");
const fs = require("fs-extra");
(async () => {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    if (!fs.existsSync(jsonfile)) {
        return;
    }
    let ls = await fs.readJSON(jsonfile);
    if (ls && ls.length) {
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let basePath = path.join(project_config_1.default.novel_root, pathMain, novelID);
            if (fs.existsSync(path.join(basePath, 'README.md'))) {
                let file = path.join(basePath, '導航目錄.md');
                return toc_contents_1.default(basePath, file)
                    .tap(async function (ls) {
                    if (ls) {
                        await index_1.crossSpawnSync('git', [
                            'add',
                            file,
                        ], {
                            stdio: 'inherit',
                            cwd: basePath,
                        });
                        await index_1.crossSpawnSync('git', [
                            'commit',
                            '-a',
                            '-m',
                            `[toc:contents] ${pathMain} ${novelID}`,
                        ], {
                            stdio: 'inherit',
                            cwd: basePath,
                        });
                    }
                });
            }
        })
            .then(async function () {
            let cp = await git_2.pushGit(project_config_1.default.novel_root, git_2.getPushUrl(git_1.GIT_SETTING_DIST_NOVEL.url), true);
            return gitee_pr_1.createPullRequests();
        });
    }
})();
