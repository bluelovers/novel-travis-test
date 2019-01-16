"use strict";
/**
 * Created by user on 2018/5/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@node-novel/task/lib/config");
const fs = require("fs-extra");
const index_1 = require("../index");
const git_1 = require("../data/git");
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const util_1 = require("../lib/util");
const project_config_1 = require("../project.config");
const path = require("upath2");
const Promise = require("bluebird");
const novel_epub_1 = require("novel-epub");
const segment_1 = require("../script/segment");
const FastGlob = require("fast-glob");
const novel_txt_merge_1 = require("novel-txt-merge");
const array_hyper_unique_1 = require("array-hyper-unique");
const log_1 = require("../lib/log");
const node_novel_info_1 = require("node-novel-info");
if (!index_1.isGitRoot(git_1.GIT_SETTING_EPUB.targetPath)) {
    log_1.default.warn(`dist_novel not a git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
    throw new Error(`something wrong when create git`);
}
log_1.default.info(`git: ${git_1.GIT_SETTING_EPUB.targetPath}`);
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let epub_json = path.join(project_config_1.default.cache_root, 'epub.json');
    let ls = [];
    let ls2 = [];
    if (fs.existsSync(jsonfile)) {
        ls = fs.readJSONSync(jsonfile);
    }
    if (!fs.existsSync(epub_json)) {
        let CWD = process.cwd();
        const result = config_1.loadMainConfig(CWD);
        if (result.config.disableInit) {
            log_1.default.red(`[EPUB] 快取檔案不存在 但不執行初始化任務`);
        }
        else {
            log_1.default.red(`[EPUB] 快取檔案不存在 本次將執行初始化所有 epub 檔案`);
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
                    log_1.default.error(pathMain, novelID);
                    return null;
                }
                return { pathMain, novelID };
            });
        }
    }
    else {
        ls2 = fs.readJSONSync(epub_json);
    }
    log_1.default.debug(`本次新增 ${ls.length} , 上次未完成 ${ls2.length}`);
    ls = (ls || []).concat(ls2 || []);
    ls = ls.filter(function (v) {
        return v;
    });
    ls = array_hyper_unique_1.array_unique(ls);
    fs.outputJSONSync(epub_json, ls, {
        spaces: '\t',
    });
    if (ls && ls.length) {
        const novelStatCache = novel_stat_1.getNovelStatCache();
        const historyToday = novelStatCache.historyToday();
        const novelStatCacheTimestamp = novelStatCache.timestamp;
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let _do = false;
            if (pathMain.match(/_out$/)) {
                _do = true;
            }
            else if (!fs.existsSync(path.join(segment_1._path(pathMain + '_out', novelID), 'README.md'))) {
                _do = true;
            }
            log_1.default.debug(pathMain, novelID, _do);
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
                    let txt = await novel_txt_merge_1.default(inputPath, outputPath, ret.basename);
                    let novel = novelStatCache.novel(pathMain, novelID);
                    if (novel.txt_basename && novel.txt_basename != txt.filename) {
                        let file = path.join(outputPath, 'out', novel.txt_basename);
                        await _remove_file_git(file);
                    }
                    if (novel.epub_basename && novel.epub_basename != ret.filename) {
                        let file = path.join(outputPath, novel.epub_basename);
                        await _remove_file_git(file);
                    }
                    if (pathMain.match(/_out$/)) {
                        let pathMain_src = pathMain.replace(/_out$/, '');
                        let outputPath_src = path.join(git_1.GIT_SETTING_EPUB.targetPath, pathMain_src);
                        let outputPath = outputPath_src;
                        let file = path.join(outputPath_src, ret.filename);
                        await _remove_file_git(file);
                        if (novel.txt_basename) {
                            file = path.join(outputPath_src, 'out', novel.txt_basename);
                            await _remove_file_git(file);
                        }
                        if (novel.epub_basename) {
                            file = path.join(outputPath_src, novel.epub_basename);
                            await _remove_file_git(file);
                        }
                        file = path.join(outputPath_src, 'out', txt.filename);
                        novel.txt_basename = txt.filename;
                        await _remove_file_git(file);
                    }
                    return ret;
                })
                    .then(async function (ret) {
                    let meta = await fs.readFile(path.join(inputPath, 'README.md'))
                        .then(function (data) {
                        return node_novel_info_1.mdconf_parse(data, {
                            // 當沒有包含必要的內容時不產生錯誤
                            throw: false,
                            // 允許不標準的 info 內容
                            lowCheckLevel: true,
                        });
                    })
                        .catch(function () {
                        return null;
                    });
                    let author_name;
                    if (meta && meta.novel && meta.novel.author) {
                        author_name = util_1.git_fake_author(meta.novel.author);
                    }
                    await index_1.crossSpawnSync('git', [
                        'add',
                        '.',
                    ], {
                        stdio: 'inherit',
                        cwd: outputPath,
                    });
                    let commit_msg = `[epub] ${pathMain} ${novelID}`;
                    historyToday.epub.push([pathMain, novelID]);
                    let novel = novelStatCache.novel(pathMain, novelID);
                    novel.epub_date = Date.now();
                    if (ret.stat) {
                        if (novelStatCacheTimestamp != novel.update_date) {
                            novel.volume_old = novel.volume | 0;
                            novel.chapter_old = novel.chapter | 0;
                        }
                        novel.volume = ret.stat.volume;
                        novel.chapter = ret.stat.chapter;
                        commit_msg += `( v:${novel.volume}, c:${novel.chapter}, add:${novel.chapter - novel.chapter_old} )`;
                    }
                    novel.epub_basename = ret.filename;
                    novel.novel_status = (meta && meta.novel) ? meta.novel.novel_status : 0;
                    if (!novel.novel_status) {
                        delete novel.novel_status;
                    }
                    novelStatCache.mdconf_set(pathMain, novelID, meta);
                    //console.log(novel);
                    /**
                     * 實驗性功能 可利用 git user 來過濾作者
                     */
                    if (author_name) {
                        await index_1.crossSpawnSync('git', [
                            'commit',
                            '-a',
                            '-m',
                            commit_msg,
                            `--author=${author_name}`,
                        ], {
                            stdio: 'inherit',
                            cwd: git_1.GIT_SETTING_EPUB.targetPath,
                        });
                    }
                    else {
                        await index_1.crossSpawnSync('git', [
                            'commit',
                            '-a',
                            '-m',
                            commit_msg,
                        ], {
                            stdio: 'inherit',
                            cwd: git_1.GIT_SETTING_EPUB.targetPath,
                        });
                    }
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
                        log_1.default.error('[SKIP]', pathMain, novelID, msg);
                    }
                    else {
                        log_1.default.error('[ERROR]', pathMain, novelID, msg);
                    }
                });
                return true;
            }
            else {
                ls = filterCache(ls, pathMain, novelID);
                log_1.default.grey(ls.length, pathMain, novelID);
            }
        })
            .tap(function (ls) {
            let count = ls.filter(v => v).length;
            log_1.default.info(`本次共更新 ${count} 小說`);
            novelStatCache.save();
        })
            .tap(async function () {
            let waitpush = path.join(project_config_1.default.cache_root, 'epub.waitpush');
            await fs.ensureFile(waitpush);
            log_1.default.log(`ls: ${ls.length}`);
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
async function _remove_file_git(file, cwd) {
    if (fs.pathExistsSync(file)) {
        if (!cwd) {
            cwd = path.dirname(file);
        }
        log_1.default.log(`移除舊檔案 ${file}`);
        try {
            await index_1.crossSpawnSync('git', [
                'rm',
                file,
            ], {
                stdio: 'inherit',
                cwd,
            });
        }
        catch (e) {
        }
        await fs.remove(file).catch(v => null);
        return fs.pathExistsSync(file);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQStCO0FBQy9CLG9DQUF1RTtBQUN2RSxxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBOEM7QUFDOUMsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBb0M7QUFDcEMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBc0M7QUFDdEMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBRXJFLElBQUksQ0FBQyxpQkFBUyxDQUFDLHNCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUMzQztJQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsYUFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFcEQsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBR2pCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWpFLElBQUksRUFBRSxHQUE0QyxFQUFFLENBQUM7SUFDckQsSUFBSSxHQUFHLEdBQTRDLEVBQUUsQ0FBQztJQUV0RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQzNCO1FBQ0MsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDL0I7SUFFRCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFDN0I7UUFDQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDeEIsTUFBTSxNQUFNLEdBQUcsdUJBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVuQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUM3QjtZQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztTQUN4QzthQUVEO1lBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBRWpELEdBQUcsR0FBRyxNQUFNLE9BQU87aUJBQ2pCLFNBQVMsQ0FBQyxRQUFRLENBQUM7Z0JBQ25CLE9BQU87YUFDUCxFQUFFO2dCQUNGLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxDQUFDO2dCQUN4QyxlQUFlLEVBQUUsSUFBSTtnQkFDckIsU0FBUyxFQUFFLEtBQUs7YUFDaEIsQ0FBQyxFQUFFLFVBQVUsRUFBVTtnQkFFdkIsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUU3QyxJQUFJLEVBQUUsR0FBRyxlQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVsQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFDdEI7b0JBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBRWpDLE9BQU8sSUFBSSxDQUFDO2lCQUNaO2dCQUVELE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUE7WUFDN0IsQ0FBQyxDQUFDLENBQ0Y7U0FDRDtLQUNEO1NBRUQ7UUFDQyxHQUFHLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNqQztJQUVELGFBQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBRXpELEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRWxDLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUV6QixPQUFPLENBQUMsQ0FBQTtJQUNULENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxHQUFHLGlDQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFbkIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFO1FBQ2hDLE1BQU0sRUFBRSxJQUFJO0tBQ1osQ0FBQyxDQUFDO0lBRUgsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFDbkI7UUFDQyxNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO1FBQzNDLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVuRCxNQUFNLHVCQUF1QixHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUM7UUFFekQsTUFBTSxPQUFPO2FBQ1gsU0FBUyxDQUFDLEVBQUUsRUFBRSxLQUFLLFdBQVcsSUFBSTtZQUVsQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUVuQyxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7WUFFaEIsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUMzQjtnQkFDQyxHQUFHLEdBQUcsSUFBSSxDQUFDO2FBQ1g7aUJBQ0ksSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxFQUNsRjtnQkFDQyxHQUFHLEdBQUcsSUFBSSxDQUFDO2FBQ1g7WUFFRCxhQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFdEMsSUFBSSxHQUFHLEVBQ1A7Z0JBQ0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sU0FBUyxHQUFHLGVBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRTNDLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxvQkFBUyxDQUFDO29CQUM5QixTQUFTO29CQUNULFVBQVU7b0JBQ1YsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLFFBQVEsRUFBRSxJQUFJO29CQUNkLGFBQWEsRUFBRSxPQUFPO29CQUN0QixLQUFLLEVBQUUsSUFBSTtpQkFDWCxDQUFDLENBQUM7cUJBQ0YsSUFBSSxDQUFDLEtBQUssV0FBVyxHQUFHO29CQUV4QixJQUFJLEdBQUcsR0FBRyxNQUFNLHlCQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBRTlELElBQUksS0FBSyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUVwRCxJQUFJLEtBQUssQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsUUFBUSxFQUM1RDt3QkFDQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUU1RCxNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUM3QjtvQkFFRCxJQUFJLEtBQUssQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLGFBQWEsSUFBSSxHQUFHLENBQUMsUUFBUSxFQUM5RDt3QkFDQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBRXRELE1BQU0sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzdCO29CQUVELElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFDM0I7d0JBQ0MsSUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBRWpELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQWdCLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO3dCQUMxRSxJQUFJLFVBQVUsR0FBRyxjQUFjLENBQUM7d0JBRWhDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFFbkQsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFFN0IsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUN0Qjs0QkFDQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQzs0QkFFNUQsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzt5QkFDN0I7d0JBRUQsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUN2Qjs0QkFDQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDOzRCQUV0RCxNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUM3Qjt3QkFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFFdEQsS0FBSyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO3dCQUVsQyxNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUM3QjtvQkFFRCxPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDLENBQUM7cUJBQ0QsSUFBSSxDQUFDLEtBQUssV0FBVyxHQUFHO29CQUV4QixJQUFJLElBQUksR0FBeUIsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO3lCQUNuRixJQUFJLENBQUMsVUFBVSxJQUFJO3dCQUVuQixPQUFPLDhCQUFZLENBQUMsSUFBSSxFQUFFOzRCQUN6QixtQkFBbUI7NEJBQ25CLEtBQUssRUFBRSxLQUFLOzRCQUNaLGlCQUFpQjs0QkFDakIsYUFBYSxFQUFFLElBQUk7eUJBQ25CLENBQUMsQ0FBQztvQkFDSixDQUFDLENBQUM7eUJBQ0QsS0FBSyxDQUFDO3dCQUVOLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUMsQ0FBQyxDQUNGO29CQUVELElBQUksV0FBbUIsQ0FBQztvQkFFeEIsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDM0M7d0JBQ0MsV0FBVyxHQUFHLHNCQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDakQ7b0JBRUQsTUFBTSxzQkFBYyxDQUFDLEtBQUssRUFBRTt3QkFDM0IsS0FBSzt3QkFDTCxHQUFHO3FCQUNILEVBQUU7d0JBQ0YsS0FBSyxFQUFFLFNBQVM7d0JBQ2hCLEdBQUcsRUFBRSxVQUFVO3FCQUNmLENBQUMsQ0FBQztvQkFFSCxJQUFJLFVBQVUsR0FBRyxVQUFVLFFBQVEsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFFakQsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFFNUMsSUFBSSxLQUFLLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBRXBELEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUU3QixJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQ1o7d0JBQ0MsSUFBSSx1QkFBdUIsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUNoRDs0QkFDQyxLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDOzRCQUNwQyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO3lCQUN0Qzt3QkFFRCxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO3dCQUMvQixLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO3dCQUVqQyxVQUFVLElBQUksT0FBTyxLQUFLLENBQUMsTUFBTSxPQUFPLEtBQUssQ0FBQyxPQUFPLFNBQVMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLENBQUM7cUJBQ3BHO29CQUVELEtBQUssQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztvQkFFbkMsS0FBSyxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXhFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUN2Qjt3QkFDQyxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUM7cUJBQzFCO29CQUVELGNBQWMsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFFbkQscUJBQXFCO29CQUVyQjs7dUJBRUc7b0JBQ0gsSUFBSSxXQUFXLEVBQ2Y7d0JBQ0MsTUFBTSxzQkFBYyxDQUFDLEtBQUssRUFBRTs0QkFDM0IsUUFBUTs0QkFDUixJQUFJOzRCQUNKLElBQUk7NEJBQ0osVUFBVTs0QkFDVixZQUFZLFdBQVcsRUFBRTt5QkFDekIsRUFBRTs0QkFDRixLQUFLLEVBQUUsU0FBUzs0QkFDaEIsR0FBRyxFQUFFLHNCQUFnQixDQUFDLFVBQVU7eUJBQ2hDLENBQUMsQ0FBQztxQkFDSDt5QkFFRDt3QkFDQyxNQUFNLHNCQUFjLENBQUMsS0FBSyxFQUFFOzRCQUMzQixRQUFROzRCQUNSLElBQUk7NEJBQ0osSUFBSTs0QkFDSixVQUFVO3lCQUNWLEVBQUU7NEJBQ0YsS0FBSyxFQUFFLFNBQVM7NEJBQ2hCLEdBQUcsRUFBRSxzQkFBZ0IsQ0FBQyxVQUFVO3lCQUNoQyxDQUFDLENBQUM7cUJBQ0g7b0JBRUQsT0FBTyxHQUFHLENBQUM7Z0JBQ1osQ0FBQyxDQUFDO3FCQUNELEdBQUcsQ0FBQztvQkFFSixFQUFFLEdBQUcsV0FBVyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBRXhDLEVBQUUsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRTt3QkFDaEMsTUFBTSxFQUFFLElBQUk7cUJBQ1osQ0FBQyxDQUFDO2dCQUNKLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsVUFBVSxDQUFDO29CQUVqQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBRXZCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxFQUMzQzt3QkFDQyxFQUFFLEdBQUcsV0FBVyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBRXhDLGFBQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ2hEO3lCQUVEO3dCQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ2pEO2dCQUNGLENBQUMsQ0FBQyxDQUNGO2dCQUVELE9BQU8sSUFBSSxDQUFDO2FBQ1o7aUJBRUQ7Z0JBQ0MsRUFBRSxHQUFHLFdBQVcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUV4QyxhQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzNDO1FBQ0YsQ0FBQyxDQUFDO2FBQ0QsR0FBRyxDQUFDLFVBQVUsRUFBRTtZQUVoQixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBRXJDLGFBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxDQUFDO1lBRWxDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsS0FBSztZQUVULElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFcEUsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTlCLGFBQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUVoQyxFQUFFLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUU7Z0JBQ2hDLE1BQU0sRUFBRSxJQUFJO2FBQ1osQ0FBQyxDQUFDO1lBRUg7Ozs7Y0FJRTtRQUNILENBQUMsQ0FBQyxDQUNGO0tBQ0Q7QUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO0FBRUwsU0FBUyxXQUFXLENBQUMsRUFBMkMsRUFBRSxRQUFnQixFQUFFLE9BQWU7SUFFbEcsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUUzQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxJQUFJLFFBQVEsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQztRQUUxRCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQTtJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsSUFBWSxFQUFFLEdBQVk7SUFFekQsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUMzQjtRQUNDLElBQUksQ0FBQyxHQUFHLEVBQ1I7WUFDQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6QjtRQUVELGFBQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTdCLElBQ0E7WUFDQyxNQUFNLHNCQUFjLENBQUMsS0FBSyxFQUFFO2dCQUMzQixJQUFJO2dCQUNKLElBQUk7YUFDSixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHO2FBQ0gsQ0FBQyxDQUFDO1NBQ0g7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZDLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvQjtBQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTgvMDE4LlxuICovXG5cbmltcG9ydCB7IGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCB7IHByb2Nlc3NUb2MgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bk91dHB1dCwgY3Jvc3NTcGF3blN5bmMsIGlzR2l0Um9vdCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7XG5cdEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsXG5cdEdJVF9TRVRUSU5HX0VQVUIsXG59IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IGdpdF9mYWtlX2F1dGhvciB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBub3ZlbEVwdWIgZnJvbSAnbm92ZWwtZXB1Yic7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgeyBfcGF0aCwgRElTVF9OT1ZFTCB9IGZyb20gJy4uL3NjcmlwdC9zZWdtZW50JztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgdHh0TWVyZ2UgZnJvbSAnbm92ZWwtdHh0LW1lcmdlJztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSBhcyBhcnJheVVuaXEgfSBmcm9tICdhcnJheS1oeXBlci11bmlxdWUnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcblxuaWYgKCFpc0dpdFJvb3QoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoKSlcbntcblx0Y29uc29sZS53YXJuKGBkaXN0X25vdmVsIG5vdCBhIGdpdDogJHtHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGh9YCk7XG5cblx0dGhyb3cgbmV3IEVycm9yKGBzb21ldGhpbmcgd3Jvbmcgd2hlbiBjcmVhdGUgZ2l0YCk7XG59XG5cbmNvbnNvbGUuaW5mbyhgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9Plxue1xuXG5cdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdkaWZmLW5vdmVsLmpzb24nKTtcblx0bGV0IGVwdWJfanNvbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLmpzb24nKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXHRsZXQgbHMyOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdHtcblx0XHRscyA9IGZzLnJlYWRKU09OU3luYyhqc29uZmlsZSk7XG5cdH1cblxuXHRpZiAoIWZzLmV4aXN0c1N5bmMoZXB1Yl9qc29uKSlcblx0e1xuXHRcdGxldCBDV0QgPSBwcm9jZXNzLmN3ZCgpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGxvYWRNYWluQ29uZmlnKENXRCk7XG5cblx0XHRpZiAocmVzdWx0LmNvbmZpZy5kaXNhYmxlSW5pdClcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDkvYbkuI3ln7fooYzliJ3lp4vljJbku7vli5lgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGBbRVBVQl0g5b+r5Y+W5qqU5qGI5LiN5a2Y5ZyoIOacrOasoeWwh+Wft+ihjOWIneWni+WMluaJgOaciSBlcHViIOaqlOahiGApO1xuXG5cdFx0XHRsczIgPSBhd2FpdCBQcm9taXNlXG5cdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2IoW1xuXHRcdFx0XHRcdCcqLyovKicsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpLFxuXHRcdFx0XHRcdG9ubHlEaXJlY3RvcmllczogdHJ1ZSxcblx0XHRcdFx0XHRvbmx5RmlsZXM6IGZhbHNlLFxuXHRcdFx0XHR9KSwgZnVuY3Rpb24gKGlkOiBzdHJpbmcpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgW3BhdGhNYWluLCBub3ZlbElEXSA9IGlkLnNwbGl0KC9bXFxcXFxcL10vKTtcblxuXHRcdFx0XHRcdGxldCBucCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmICghZnMuZXhpc3RzU3luYyhucCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7IHBhdGhNYWluLCBub3ZlbElEIH1cblx0XHRcdFx0fSlcblx0XHRcdDtcblx0XHR9XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bHMyID0gZnMucmVhZEpTT05TeW5jKGVwdWJfanNvbik7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDmnKzmrKHmlrDlop4gJHtscy5sZW5ndGh9ICwg5LiK5qyh5pyq5a6M5oiQICR7bHMyLmxlbmd0aH1gKTtcblxuXHRscyA9IChscyB8fCBbXSkuY29uY2F0KGxzMiB8fCBbXSk7XG5cblx0bHMgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdHtcblx0XHRyZXR1cm4gdlxuXHR9KTtcblxuXHRscyA9IGFycmF5VW5pcShscyk7XG5cblx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBscywge1xuXHRcdHNwYWNlczogJ1xcdCcsXG5cdH0pO1xuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cdFx0Y29uc3QgaGlzdG9yeVRvZGF5ID0gbm92ZWxTdGF0Q2FjaGUuaGlzdG9yeVRvZGF5KCk7XG5cblx0XHRjb25zdCBub3ZlbFN0YXRDYWNoZVRpbWVzdGFtcCA9IG5vdmVsU3RhdENhY2hlLnRpbWVzdGFtcDtcblxuXHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zdCB7IHBhdGhNYWluLCBub3ZlbElEIH0gPSBkYXRhO1xuXG5cdFx0XHRcdGxldCBfZG8gPSBmYWxzZTtcblxuXHRcdFx0XHRpZiAocGF0aE1haW4ubWF0Y2goL19vdXQkLykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguam9pbihfcGF0aChwYXRoTWFpbiArICdfb3V0Jywgbm92ZWxJRCksICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc29sZS5kZWJ1ZyhwYXRoTWFpbiwgbm92ZWxJRCwgX2RvKTtcblxuXHRcdFx0XHRpZiAoX2RvKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIHBhdGhNYWluKTtcblx0XHRcdFx0XHRjb25zdCBpbnB1dFBhdGggPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLnJlc29sdmUobm92ZWxFcHViKHtcblx0XHRcdFx0XHRcdFx0aW5wdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRwYWRFbmREYXRlOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0dXNlVGl0bGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGZpbGVuYW1lTG9jYWw6IG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdG5vTG9nOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSkpXG5cdFx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgdHh0ID0gYXdhaXQgdHh0TWVyZ2UoaW5wdXRQYXRoLCBvdXRwdXRQYXRoLCByZXQuYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAobm92ZWwudHh0X2Jhc2VuYW1lICYmIG5vdmVsLnR4dF9iYXNlbmFtZSAhPSB0eHQuZmlsZW5hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoLCAnb3V0Jywgbm92ZWwudHh0X2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAobm92ZWwuZXB1Yl9iYXNlbmFtZSAmJiBub3ZlbC5lcHViX2Jhc2VuYW1lICE9IHJldC5maWxlbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGgsIG5vdmVsLmVwdWJfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChwYXRoTWFpbi5tYXRjaCgvX291dCQvKSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBwYXRoTWFpbl9zcmMgPSBwYXRoTWFpbi5yZXBsYWNlKC9fb3V0JC8sICcnKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBvdXRwdXRQYXRoX3NyYyA9IHBhdGguam9pbihHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIHBhdGhNYWluX3NyYyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IG91dHB1dFBhdGggPSBvdXRwdXRQYXRoX3NyYztcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCByZXQuZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbC50eHRfYmFzZW5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgJ291dCcsIG5vdmVsLnR4dF9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLmVwdWJfYmFzZW5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgbm92ZWwuZXB1Yl9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgJ291dCcsIHR4dC5maWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRub3ZlbC50eHRfYmFzZW5hbWUgPSB0eHQuZmlsZW5hbWU7XG5cblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbWV0YTogUGFydGlhbDxJTWRjb25mTWV0YT4gPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoLmpvaW4oaW5wdXRQYXRoLCAnUkVBRE1FLm1kJykpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOeVtuaykuacieWMheWQq+W/heimgeeahOWFp+WuueaZguS4jeeUoueUn+mMr+iqpFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOWFgeioseS4jeaomea6lueahCBpbmZvIOWFp+WuuVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb3dDaGVja0xldmVsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGF1dGhvcl9uYW1lOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbCAmJiBtZXRhLm5vdmVsLmF1dGhvcilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF1dGhvcl9uYW1lID0gZ2l0X2Zha2VfYXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0Jy4nLFxuXHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRjd2Q6IG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBjb21taXRfbXNnID0gYFtlcHViXSAke3BhdGhNYWlufSAke25vdmVsSUR9YDtcblxuXHRcdFx0XHRcdFx0XHRoaXN0b3J5VG9kYXkuZXB1Yi5wdXNoKFtwYXRoTWFpbiwgbm92ZWxJRF0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5lcHViX2RhdGUgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChyZXQuc3RhdClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbFN0YXRDYWNoZVRpbWVzdGFtcCAhPSBub3ZlbC51cGRhdGVfZGF0ZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWVfb2xkID0gbm92ZWwudm9sdW1lIHwgMDtcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXJfb2xkID0gbm92ZWwuY2hhcHRlciB8IDA7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwudm9sdW1lID0gcmV0LnN0YXQudm9sdW1lO1xuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXIgPSByZXQuc3RhdC5jaGFwdGVyO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyArPSBgKCB2OiR7bm92ZWwudm9sdW1lfSwgYzoke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6JHtub3ZlbC5jaGFwdGVyIC0gbm92ZWwuY2hhcHRlcl9vbGR9IClgO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwuZXB1Yl9iYXNlbmFtZSA9IHJldC5maWxlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5ub3ZlbF9zdGF0dXMgPSAobWV0YSAmJiBtZXRhLm5vdmVsKSA/IG1ldGEubm92ZWwubm92ZWxfc3RhdHVzIDogMDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW5vdmVsLm5vdmVsX3N0YXR1cylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBub3ZlbC5ub3ZlbF9zdGF0dXM7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5vdmVsKTtcblxuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICog5a+m6amX5oCn5Yqf6IO9IOWPr+WIqeeUqCBnaXQgdXNlciDkvobpgY7mv77kvZzogIVcblx0XHRcdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0XHRcdGlmIChhdXRob3JfbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRcdGAtLWF1dGhvcj0ke2F1dGhvcl9uYW1lfWAsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgbHMsIHtcblx0XHRcdFx0XHRcdFx0XHRzcGFjZXM6ICdcXHQnLFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBtc2cgPSBlLnRvU3RyaW5nKCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1zZy5tYXRjaCgvbm90IGEgdmFsaWQgbm92ZWxJbmZvIGRhdGEvKSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tTS0lQXScsIHBhdGhNYWluLCBub3ZlbElELCBtc2cpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tFUlJPUl0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmdyZXkobHMubGVuZ3RoLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0bGV0IGNvdW50ID0gbHMuZmlsdGVyKHYgPT4gdikubGVuZ3RoO1xuXG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5YWx5pu05pawICR7Y291bnR9IOWwj+iqqmApO1xuXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZSh3YWl0cHVzaCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYGxzOiAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIFtdLCB7XG5cdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0YXdhaXQgcHVzaEdpdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIGdldFB1c2hVcmwoR0lUX1NFVFRJTkdfRVBVQi51cmwpKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUod2FpdHB1c2gpO1xuXHRcdFx0XHQqL1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGZpbHRlckNhY2hlKGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10sIHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZylcbntcblx0cmV0dXJuIGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdGxldCBib29sID0gdi5wYXRoTWFpbiA9PSBwYXRoTWFpbiAmJiB2Lm5vdmVsSUQgPT0gbm92ZWxJRDtcblxuXHRcdHJldHVybiB2ICYmICFib29sXG5cdH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGU6IHN0cmluZywgY3dkPzogc3RyaW5nKVxue1xuXHRpZiAoZnMucGF0aEV4aXN0c1N5bmMoZmlsZSkpXG5cdHtcblx0XHRpZiAoIWN3ZClcblx0XHR7XG5cdFx0XHRjd2QgPSBwYXRoLmRpcm5hbWUoZmlsZSk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coYOenu+mZpOiIiuaqlOahiCAke2ZpbGV9YCk7XG5cblx0XHR0cnlcblx0XHR7XG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncm0nLFxuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2QsXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXG5cdFx0YXdhaXQgZnMucmVtb3ZlKGZpbGUpLmNhdGNoKHYgPT4gbnVsbCk7XG5cblx0XHRyZXR1cm4gZnMucGF0aEV4aXN0c1N5bmMoZmlsZSk7XG5cdH1cbn1cbiJdfQ==