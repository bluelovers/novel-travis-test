"use strict";
/**
 * Created by user on 2018/8/14/014.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const toc_1 = require("@node-novel/toc");
const toc_contents_1 = require("@node-novel/toc/toc_contents");
const Promise = require("bluebird");
const git_1 = require("../data/git");
const project_config_1 = require("../project.config");
const git_2 = require("../script/git");
const gitee_pr_1 = require("../script/gitee-pr");
const index_1 = require("../index");
const path = require("path");
const fs = require("fs-extra");
const FastGlob = require("fast-glob");
(async () => {
    let _cache_init = path.join(project_config_1.default.cache_root, '.toc_contents.cache');
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let ls;
    let bool = fs.existsSync(_cache_init);
    console.log(`[toc:contents] 是否已曾經初始化導航目錄`, bool, _cache_init);
    if (!bool) {
        console.log(`[toc:contents] 初始化所有 小說 的 導航目錄`);
        ls = await toc_1.get_ids(project_config_1.default.novel_root)
            .reduce(async function (memo, pathMain) {
            await Promise
                .mapSeries(FastGlob([
                '*/README.md',
            ], {
                cwd: path.join(project_config_1.default.novel_root, pathMain),
            }), function (p) {
                let novelID = path.basename(path.dirname(p));
                memo.push({ pathMain, novelID });
            });
            return memo;
        }, []);
    }
    else if (!fs.existsSync(jsonfile)) {
        console.log(`[toc:contents] 本次沒有任何待更新列表 (1)`);
        return;
    }
    else {
        ls = await fs.readJSON(jsonfile);
    }
    if (ls && ls.length) {
        let _update;
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let basePath = path.join(project_config_1.default.novel_root, pathMain, novelID);
            let msg;
            let _did = false;
            if (fs.existsSync(path.join(basePath, 'README.md'))) {
                let file = path.join(basePath, '導航目錄.md');
                //console.log(`[toc:contents]`, pathMain, novelID);
                let ret = await toc_contents_1.default(basePath, file)
                    .tap(async function (ls) {
                    if (ls) {
                        let old = await fs.readFile(file)
                            .catch(function () {
                            return '';
                        })
                            .then(function (ls) {
                            return ls.toString();
                        });
                        if (!bool || old != ls) {
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
                            _did = true;
                            _update = true;
                        }
                        else {
                            msg = `目錄檔案已存在並且沒有變化`;
                        }
                    }
                    else {
                        msg = `無法生成目錄，可能不存在任何章節檔案`;
                    }
                });
                if (_did) {
                    console.log(`[toc:contents]`, pathMain, novelID);
                }
                else {
                    console.warn(`[SKIP]`, pathMain, novelID, "\n", msg);
                }
                return ret;
            }
        })
            .tap(async function () {
            if (_update) {
                console.log(`[toc:contents] 完成 並且試圖 push 與 建立 PR`);
                let cp = await git_2.pushGit(project_config_1.default.novel_root, git_2.getPushUrl(git_1.GIT_SETTING_DIST_NOVEL.url), true);
                await gitee_pr_1.createPullRequests();
                await fs.ensureFile(_cache_init);
            }
            else {
                console.log(`[toc:contents] 完成 本次無更新任何檔案`);
            }
        })
            .tap(function () {
            console.log(`[toc:contents] done.`);
        });
    }
    else {
        console.log(`[toc:contents] 本次沒有任何待更新列表 (2)`);
    }
})();
