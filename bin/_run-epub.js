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
const segment_1 = require("../script/segment");
const FastGlob = require("fast-glob");
const novel_txt_merge_1 = require("novel-txt-merge");
const array_hyper_unique_1 = require("array-hyper-unique");
if (!index_1.isGitRoot(git_1.GIT_SETTING_EPUB.targetPath)) {
    console.warn(`dist_novel not a git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
    throw new Error(`something wrong when create git`);
}
console.log(`git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
(async () => {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let epub_json = path.join(project_config_1.default.cache_root, 'epub.json');
    let ls = [];
    let ls2 = [];
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
    console.log(`本次新增 ${ls.length} , 上次未完成 ${ls2.length}`);
    ls = (ls || []).concat(ls2 || []);
    ls = ls.filter(function (v) {
        return v;
    });
    ls = array_hyper_unique_1.array_unique(ls);
    fs.outputJSONSync(epub_json, ls, {
        spaces: '\t',
    });
    if (ls && ls.length) {
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let _do = false;
            if (pathMain == 'cm' || pathMain.match(/_out$/)) {
                _do = true;
            }
            else if (!fs.existsSync(path.join(segment_1._path(pathMain + '_out', novelID), 'README.md'))) {
                _do = true;
            }
            if (_do) {
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
                console.log(ls.length, pathMain, novelID);
            }
        })
            .tap(function (ls) {
            let count = ls.filter(v => v).length;
            console.log(`本次共更新 ${count} 小說`);
        })
            .tap(async function () {
            let waitpush = path.join(project_config_1.default.cache_root, 'epub.waitpush');
            await fs.ensureFile(waitpush);
            console.log(`ls: ${ls.length}`);
            fs.outputJSONSync(epub_json, [], {
                spaces: '\t',
            });
            /*
            await pushGit(GIT_SETTING_EPUB.targetPath, getPushUrl(GIT_SETTING_EPUB.url));

            await fs.remove(waitpush);
            */
        });
    }
})();
function filterCache(ls, pathMain, novelID) {
    return ls.filter(function (v) {
        let bool = v.pathMain == pathMain && v.novelID == novelID;
        return v && !bool;
    });
}
