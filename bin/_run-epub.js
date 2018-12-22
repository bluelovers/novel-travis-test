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
                    if (pathMain.match(/_out$/)) {
                        let pathMain_src = pathMain.replace(/_out$/, '');
                        let outputPath_src = path.join(git_1.GIT_SETTING_EPUB.targetPath, pathMain_src);
                        let outputPath = outputPath_src;
                        let file = path.join(outputPath_src, ret.filename);
                        if (fs.existsSync(file)) {
                            try {
                                await index_1.crossSpawnSync('git', [
                                    'rm',
                                    file,
                                ], {
                                    stdio: 'inherit',
                                    cwd: outputPath,
                                });
                            }
                            catch (e) {
                            }
                            await fs.remove(file).catch(v => null);
                        }
                        file = path.join(outputPath_src, 'out', txt.filename);
                        if (fs.existsSync(file)) {
                            try {
                                await index_1.crossSpawnSync('git', [
                                    'rm',
                                    file,
                                ], {
                                    stdio: 'inherit',
                                    cwd: outputPath,
                                });
                            }
                            catch (e) {
                            }
                            await fs.remove(file).catch(v => null);
                        }
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
                        novel.volume_old = novel.volume | 0;
                        novel.chapter_old = novel.chapter | 0;
                        novel.volume = ret.stat.volume;
                        novel.chapter = ret.stat.chapter;
                        commit_msg += `( v:${novel.volume}, c:${novel.chapter}, add:${novel.chapter - novel.chapter_old} )`;
                    }
                    novel.epub_basename = ret.basename;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQStCO0FBQy9CLG9DQUF1RTtBQUN2RSxxQ0FHcUI7QUFDckIsd0RBQTRFO0FBQzVFLHdDQUEwRTtBQUMxRSxzQ0FBOEM7QUFDOUMsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBb0M7QUFDcEMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBc0M7QUFDdEMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBRXJFLElBQUksQ0FBQyxpQkFBUyxDQUFDLHNCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUMzQztJQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsYUFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFcEQsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBR2pCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWpFLElBQUksRUFBRSxHQUE0QyxFQUFFLENBQUM7SUFDckQsSUFBSSxHQUFHLEdBQTRDLEVBQUUsQ0FBQztJQUV0RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFD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QUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUVwRSxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFOUIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRWhDLEVBQUUsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRTtnQkFDaEMsTUFBTSxFQUFFLElBQUk7YUFDWixDQUFDLENBQUM7WUFFSDs7OztjQUlFO1FBQ0gsQ0FBQyxDQUFDLENBQ0Y7S0FDRDtBQUNGLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFFTCxTQUFTLFdBQVcsQ0FBQyxFQUEyQyxFQUFFLFFBQWdCLEVBQUUsT0FBZTtJQUVsRyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBRTNCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUSxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDO1FBRTFELE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xOC8wMTguXG4gKi9cblxuaW1wb3J0IHsgbG9hZE1haW5Db25maWcgfSBmcm9tICdAbm9kZS1ub3ZlbC90YXNrL2xpYi9jb25maWcnO1xuaW1wb3J0IHsgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBjcm9zc1NwYXduT3V0cHV0LCBjcm9zc1NwYXduU3luYywgaXNHaXRSb290IH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHtcblx0R0lUX1NFVFRJTkdfRElTVF9OT1ZFTCxcblx0R0lUX1NFVFRJTkdfRVBVQixcbn0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgTm92ZWxTdGF0Q2FjaGUsIGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IGdpdF9mYWtlX2F1dGhvciB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBub3ZlbEVwdWIgZnJvbSAnbm92ZWwtZXB1Yic7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgeyBfcGF0aCwgRElTVF9OT1ZFTCB9IGZyb20gJy4uL3NjcmlwdC9zZWdtZW50JztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgdHh0TWVyZ2UgZnJvbSAnbm92ZWwtdHh0LW1lcmdlJztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSBhcyBhcnJheVVuaXEgfSBmcm9tICdhcnJheS1oeXBlci11bmlxdWUnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcblxuaWYgKCFpc0dpdFJvb3QoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoKSlcbntcblx0Y29uc29sZS53YXJuKGBkaXN0X25vdmVsIG5vdCBhIGdpdDogJHtHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGh9YCk7XG5cblx0dGhyb3cgbmV3IEVycm9yKGBzb21ldGhpbmcgd3Jvbmcgd2hlbiBjcmVhdGUgZ2l0YCk7XG59XG5cbmNvbnNvbGUuaW5mbyhgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9Plxue1xuXG5cdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdkaWZmLW5vdmVsLmpzb24nKTtcblx0bGV0IGVwdWJfanNvbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLmpzb24nKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXHRsZXQgbHMyOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdHtcblx0XHRscyA9IGZzLnJlYWRKU09OU3luYyhqc29uZmlsZSk7XG5cdH1cblxuXHRpZiAoIWZzLmV4aXN0c1N5bmMoZXB1Yl9qc29uKSlcblx0e1xuXHRcdGxldCBDV0QgPSBwcm9jZXNzLmN3ZCgpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGxvYWRNYWluQ29uZmlnKENXRCk7XG5cblx0XHRpZiAocmVzdWx0LmNvbmZpZy5kaXNhYmxlSW5pdClcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDkvYbkuI3ln7fooYzliJ3lp4vljJbku7vli5lgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGBbRVBVQl0g5b+r5Y+W5qqU5qGI5LiN5a2Y5ZyoIOacrOasoeWwh+Wft+ihjOWIneWni+WMluaJgOaciSBlcHViIOaqlOahiGApO1xuXG5cdFx0XHRsczIgPSBhd2FpdCBQcm9taXNlXG5cdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2IoW1xuXHRcdFx0XHRcdCcqLyovKicsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpLFxuXHRcdFx0XHRcdG9ubHlEaXJlY3RvcmllczogdHJ1ZSxcblx0XHRcdFx0XHRvbmx5RmlsZXM6IGZhbHNlLFxuXHRcdFx0XHR9KSwgZnVuY3Rpb24gKGlkOiBzdHJpbmcpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgW3BhdGhNYWluLCBub3ZlbElEXSA9IGlkLnNwbGl0KC9bXFxcXFxcL10vKTtcblxuXHRcdFx0XHRcdGxldCBucCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmICghZnMuZXhpc3RzU3luYyhucCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7IHBhdGhNYWluLCBub3ZlbElEIH1cblx0XHRcdFx0fSlcblx0XHRcdDtcblx0XHR9XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bHMyID0gZnMucmVhZEpTT05TeW5jKGVwdWJfanNvbik7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDmnKzmrKHmlrDlop4gJHtscy5sZW5ndGh9ICwg5LiK5qyh5pyq5a6M5oiQICR7bHMyLmxlbmd0aH1gKTtcblxuXHRscyA9IChscyB8fCBbXSkuY29uY2F0KGxzMiB8fCBbXSk7XG5cblx0bHMgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdHtcblx0XHRyZXR1cm4gdlxuXHR9KTtcblxuXHRscyA9IGFycmF5VW5pcShscyk7XG5cblx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBscywge1xuXHRcdHNwYWNlczogJ1xcdCcsXG5cdH0pO1xuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cdFx0Y29uc3QgaGlzdG9yeVRvZGF5ID0gbm92ZWxTdGF0Q2FjaGUuaGlzdG9yeVRvZGF5KCk7XG5cblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRsZXQgX2RvID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKHBhdGhNYWluLm1hdGNoKC9fb3V0JC8pKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oX3BhdGgocGF0aE1haW4gKyAnX291dCcsIG5vdmVsSUQpLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChfZG8pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgcGF0aE1haW4pO1xuXHRcdFx0XHRcdGNvbnN0IGlucHV0UGF0aCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UucmVzb2x2ZShub3ZlbEVwdWIoe1xuXHRcdFx0XHRcdFx0XHRpbnB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHR1c2VUaXRsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHR9KSlcblx0XHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCB0eHQgPSBhd2FpdCB0eHRNZXJnZShpbnB1dFBhdGgsIG91dHB1dFBhdGgsIHJldC5iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHBhdGhNYWluLm1hdGNoKC9fb3V0JC8pKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHBhdGhNYWluX3NyYyA9IHBhdGhNYWluLnJlcGxhY2UoL19vdXQkLywgJycpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG91dHB1dFBhdGhfc3JjID0gcGF0aC5qb2luKEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgcGF0aE1haW5fc3JjKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgb3V0cHV0UGF0aCA9IG91dHB1dFBhdGhfc3JjO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsIHJldC5maWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhmaWxlKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHR0cnlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQncm0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogb3V0cHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRjYXRjaCAoZSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUoZmlsZSkuY2F0Y2godiA9PiBudWxsKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0JywgdHh0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKGZpbGUpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHRyeVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCdybScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdGNhdGNoIChlKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGZzLnJlbW92ZShmaWxlKS5jYXRjaCh2ID0+IG51bGwpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IG1ldGE6IFBhcnRpYWw8SU1kY29uZk1ldGE+ID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKGlucHV0UGF0aCwgJ1JFQURNRS5tZCcpKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDnlbbmspLmnInljIXlkKvlv4XopoHnmoTlhaflrrnmmYLkuI3nlKLnlJ/pjK/oqqRcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDlhYHoqLHkuI3mqJnmupbnmoQgaW5mbyDlhaflrrlcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdGxldCBhdXRob3JfbmFtZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtZXRhICYmIG1ldGEubm92ZWwgJiYgbWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhdXRob3JfbmFtZSA9IGdpdF9mYWtlX2F1dGhvcihtZXRhLm5vdmVsLmF1dGhvcik7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0XHRcdCcuJyxcblx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0Y3dkOiBvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgY29tbWl0X21zZyA9IGBbZXB1Yl0gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWA7XG5cblx0XHRcdFx0XHRcdFx0aGlzdG9yeVRvZGF5LmVwdWIucHVzaChbcGF0aE1haW4sIG5vdmVsSURdKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwuZXB1Yl9kYXRlID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAocmV0LnN0YXQpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWVfb2xkID0gbm92ZWwudm9sdW1lIHwgMDtcblx0XHRcdFx0XHRcdFx0XHRub3ZlbC5jaGFwdGVyX29sZCA9IG5vdmVsLmNoYXB0ZXIgfCAwO1xuXG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwudm9sdW1lID0gcmV0LnN0YXQudm9sdW1lO1xuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXIgPSByZXQuc3RhdC5jaGFwdGVyO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyArPSBgKCB2OiR7bm92ZWwudm9sdW1lfSwgYzoke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6JHtub3ZlbC5jaGFwdGVyIC0gbm92ZWwuY2hhcHRlcl9vbGR9IClgO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwuZXB1Yl9iYXNlbmFtZSA9IHJldC5iYXNlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5ub3ZlbF9zdGF0dXMgPSAobWV0YSAmJiBtZXRhLm5vdmVsKSA/IG1ldGEubm92ZWwubm92ZWxfc3RhdHVzIDogMDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW5vdmVsLm5vdmVsX3N0YXR1cylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBub3ZlbC5ub3ZlbF9zdGF0dXM7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5vdmVsKTtcblxuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICog5a+m6amX5oCn5Yqf6IO9IOWPr+WIqeeUqCBnaXQgdXNlciDkvobpgY7mv77kvZzogIVcblx0XHRcdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0XHRcdGlmIChhdXRob3JfbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRcdGAtLWF1dGhvcj0ke2F1dGhvcl9uYW1lfWAsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgbHMsIHtcblx0XHRcdFx0XHRcdFx0XHRzcGFjZXM6ICdcXHQnLFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBtc2cgPSBlLnRvU3RyaW5nKCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1zZy5tYXRjaCgvbm90IGEgdmFsaWQgbm92ZWxJbmZvIGRhdGEvKSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tTS0lQXScsIHBhdGhNYWluLCBub3ZlbElELCBtc2cpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tFUlJPUl0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmdyZXkobHMubGVuZ3RoLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0bGV0IGNvdW50ID0gbHMuZmlsdGVyKHYgPT4gdikubGVuZ3RoO1xuXG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5YWx5pu05pawICR7Y291bnR9IOWwj+iqqmApO1xuXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZSh3YWl0cHVzaCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYGxzOiAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIFtdLCB7XG5cdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0YXdhaXQgcHVzaEdpdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIGdldFB1c2hVcmwoR0lUX1NFVFRJTkdfRVBVQi51cmwpKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUod2FpdHB1c2gpO1xuXHRcdFx0XHQqL1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGZpbHRlckNhY2hlKGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10sIHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZylcbntcblx0cmV0dXJuIGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdGxldCBib29sID0gdi5wYXRoTWFpbiA9PSBwYXRoTWFpbiAmJiB2Lm5vdmVsSUQgPT0gbm92ZWxJRDtcblxuXHRcdHJldHVybiB2ICYmICFib29sXG5cdH0pO1xufVxuIl19