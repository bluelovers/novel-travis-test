"use strict";
/**
 * Created by user on 2018/5/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const index_1 = require("../index");
const git_1 = require("../data/git");
const project_config_1 = require("../project.config");
const path = require("upath2");
const Promise = require("bluebird");
const novel_epub_1 = require("novel-epub");
const git_2 = require("../script/git");
const segment_1 = require("../script/segment");
const FastGlob = require("fast-glob");
const novel_txt_merge_1 = require("novel-txt-merge");
const arrayUniq = require("arr-unique");
if (!index_1.isGitRoot(git_1.GIT_SETTING_EPUB.targetPath)) {
    console.warn(`dist_novel not a git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
    throw new Error(`something wrong when create git`);
}
console.log(`git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
(async () => {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let epub_json = path.join(project_config_1.default.cache_root, 'epub.json');
    let ls;
    let ls2;
    if (fs.existsSync(jsonfile)) {
        ls = fs.readJSONSync(jsonfile);
    }
    if (!fs.existsSync(epub_json)) {
        ls2 = await Promise
            .mapSeries(FastGlob([
            '*/*/*',
        ], {
            cwd: path.join(project_config_1.default.novel_root),
            onlyDirectories: true,
            onlyFiles: false,
        }), function (id) {
            let [pathMain, novelID] = id.split(/[\\\/]/);
            let np = segment_1._path(pathMain, novelID);
            if (!fs.existsSync(np)) {
                console.error(pathMain, novelID);
                return null;
            }
            return { pathMain, novelID };
        });
    }
    else {
        ls2 = fs.readJSONSync(epub_json);
    }
    ls = (ls || []).concat(ls2 || []);
    ls = ls.filter(v => v);
    ls = arrayUniq(ls);
    fs.outputJSONSync(epub_json, ls, {
        spaces: '\t',
    });
    if (ls && ls.length) {
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            if (pathMain == 'cm' || pathMain.match(/_out$/)) {
                const outputPath = path.join(git_1.GIT_SETTING_EPUB.targetPath, pathMain);
                const inputPath = segment_1._path(pathMain, novelID);
                await Promise.resolve(novel_epub_1.default({
                    inputPath,
                    outputPath,
                    padEndDate: false,
                    useTitle: true,
                    filenameLocal: novelID,
                    noLog: true,
                }))
                    .then(async function (ret) {
                    await novel_txt_merge_1.default(inputPath, outputPath, ret.basename);
                    return ret;
                })
                    .then(async function (ret) {
                    await index_1.crossSpawnSync('git', [
                        'add',
                        '.',
                    ], {
                        stdio: 'inherit',
                        cwd: path.join(git_1.GIT_SETTING_EPUB.targetPath, pathMain),
                    });
                    await index_1.crossSpawnSync('git', [
                        'commit',
                        '-a',
                        '-m',
                        `[epub] ${pathMain} ${novelID}`,
                    ], {
                        stdio: 'inherit',
                        cwd: git_1.GIT_SETTING_EPUB.targetPath,
                    });
                    return ret;
                })
                    .tap(function () {
                    ls = filterCache(ls, pathMain, novelID);
                    fs.outputJSONSync(epub_json, ls, {
                        spaces: '\t',
                    });
                })
                    .catch(function (e) {
                    let msg = e.toString();
                    if (msg.match(/not a valid novelInfo data/)) {
                        ls = filterCache(ls, pathMain, novelID);
                        console.error('[SKIP]', pathMain, novelID, msg);
                    }
                    else {
                        console.error('[ERROR]', pathMain, novelID, msg);
                    }
                });
                return true;
            }
            else {
                ls = filterCache(ls, pathMain, novelID);
                console.log(pathMain, novelID);
            }
        })
            .tap(function (ls) {
            let count = ls.filter(v => v).length;
            console.log(`本次共更新 ${count} 小說`);
        })
            .tap(async function () {
            await git_2.pushGit(git_1.GIT_SETTING_EPUB.targetPath, git_2.getPushUrl(git_1.GIT_SETTING_EPUB.url));
        });
    }
})();
function filterCache(ls, pathMain, novelID) {
    return ls.filter(function (v) {
        let bool = v.pathMain == pathMain && v.novelID == novelID;
        return v && !bool;
    });
}
