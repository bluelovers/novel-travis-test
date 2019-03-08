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
    log_1.default.dir(ls);
    log_1.default.dir(ls2);
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
                        await _remove_file_git(file);
                    }
                    novel.txt_basename = txt.filename;
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
                        await index_1.crossSpawnAsync('git', [
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
                        await index_1.crossSpawnAsync('git', [
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQStCO0FBQy9CLG9DQUF3RjtBQUN4RixxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBOEM7QUFDOUMsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBb0M7QUFDcEMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBc0M7QUFDdEMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBRXJFLElBQUksQ0FBQyxpQkFBUyxDQUFDLHNCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUMzQztJQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsYUFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFcEQsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBR2pCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWpFLElBQUksRUFBRSxHQUE0QyxFQUFFLENBQUM7SUFDckQsSUFBSSxHQUFHLEdBQTRDLEVBQUUsQ0FBQztJQUV0RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFD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SSxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUM7UUFFMUQsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsS0FBSyxVQUFVLGdCQUFnQixDQUFDLElBQVksRUFBRSxHQUFZO0lBRXpELElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFDM0I7UUFDQyxJQUFJLENBQUMsR0FBRyxFQUNSO1lBQ0MsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDekI7UUFFRCxhQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUU3QixJQUNBO1lBQ0MsTUFBTSxzQkFBYyxDQUFDLEtBQUssRUFBRTtnQkFDM0IsSUFBSTtnQkFDSixJQUFJO2FBQ0osRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRzthQUNILENBQUMsQ0FBQztTQUNIO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7U0FFQztRQUVELE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDL0I7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC81LzE4LzAxOC5cbiAqL1xuXG5pbXBvcnQgeyBsb2FkTWFpbkNvbmZpZyB9IGZyb20gJ0Bub2RlLW5vdmVsL3Rhc2svbGliL2NvbmZpZyc7XG5pbXBvcnQgeyBwcm9jZXNzVG9jIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3bk91dHB1dCwgY3Jvc3NTcGF3blN5bmMsIGlzR2l0Um9vdCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7XG5cdEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsXG5cdEdJVF9TRVRUSU5HX0VQVUIsXG59IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IGdpdF9mYWtlX2F1dGhvciB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBub3ZlbEVwdWIgZnJvbSAnbm92ZWwtZXB1Yic7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgeyBfcGF0aCwgRElTVF9OT1ZFTCB9IGZyb20gJy4uL3NjcmlwdC9zZWdtZW50JztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgdHh0TWVyZ2UgZnJvbSAnbm92ZWwtdHh0LW1lcmdlJztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSBhcyBhcnJheVVuaXEgfSBmcm9tICdhcnJheS1oeXBlci11bmlxdWUnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcblxuaWYgKCFpc0dpdFJvb3QoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoKSlcbntcblx0Y29uc29sZS53YXJuKGBkaXN0X25vdmVsIG5vdCBhIGdpdDogJHtHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGh9YCk7XG5cblx0dGhyb3cgbmV3IEVycm9yKGBzb21ldGhpbmcgd3Jvbmcgd2hlbiBjcmVhdGUgZ2l0YCk7XG59XG5cbmNvbnNvbGUuaW5mbyhgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9Plxue1xuXG5cdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdkaWZmLW5vdmVsLmpzb24nKTtcblx0bGV0IGVwdWJfanNvbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLmpzb24nKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXHRsZXQgbHMyOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdHtcblx0XHRscyA9IGZzLnJlYWRKU09OU3luYyhqc29uZmlsZSk7XG5cdH1cblxuXHRpZiAoIWZzLmV4aXN0c1N5bmMoZXB1Yl9qc29uKSlcblx0e1xuXHRcdGxldCBDV0QgPSBwcm9jZXNzLmN3ZCgpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGxvYWRNYWluQ29uZmlnKENXRCk7XG5cblx0XHRpZiAocmVzdWx0LmNvbmZpZy5kaXNhYmxlSW5pdClcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDkvYbkuI3ln7fooYzliJ3lp4vljJbku7vli5lgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGBbRVBVQl0g5b+r5Y+W5qqU5qGI5LiN5a2Y5ZyoIOacrOasoeWwh+Wft+ihjOWIneWni+WMluaJgOaciSBlcHViIOaqlOahiGApO1xuXG5cdFx0XHRsczIgPSBhd2FpdCBQcm9taXNlXG5cdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2IoW1xuXHRcdFx0XHRcdCcqLyovKicsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpLFxuXHRcdFx0XHRcdG9ubHlEaXJlY3RvcmllczogdHJ1ZSxcblx0XHRcdFx0XHRvbmx5RmlsZXM6IGZhbHNlLFxuXHRcdFx0XHR9KSwgZnVuY3Rpb24gKGlkOiBzdHJpbmcpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgW3BhdGhNYWluLCBub3ZlbElEXSA9IGlkLnNwbGl0KC9bXFxcXFxcL10vKTtcblxuXHRcdFx0XHRcdGxldCBucCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmICghZnMuZXhpc3RzU3luYyhucCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7IHBhdGhNYWluLCBub3ZlbElEIH1cblx0XHRcdFx0fSlcblx0XHRcdDtcblx0XHR9XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bHMyID0gZnMucmVhZEpTT05TeW5jKGVwdWJfanNvbik7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDmnKzmrKHmlrDlop4gJHtscy5sZW5ndGh9ICwg5LiK5qyh5pyq5a6M5oiQICR7bHMyLmxlbmd0aH1gKTtcblxuXHRjb25zb2xlLmRpcihscyk7XG5cdGNvbnNvbGUuZGlyKGxzMik7XG5cblx0bHMgPSAobHMgfHwgW10pLmNvbmNhdChsczIgfHwgW10pO1xuXG5cdGxzID0gbHMuZmlsdGVyKGZ1bmN0aW9uICh2KVxuXHR7XG5cdFx0cmV0dXJuIHZcblx0fSk7XG5cblx0bHMgPSBhcnJheVVuaXEobHMpO1xuXG5cdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgbHMsIHtcblx0XHRzcGFjZXM6ICdcXHQnLFxuXHR9KTtcblxuXHRpZiAobHMgJiYgbHMubGVuZ3RoKVxuXHR7XG5cdFx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXHRcdGNvbnN0IGhpc3RvcnlUb2RheSA9IG5vdmVsU3RhdENhY2hlLmhpc3RvcnlUb2RheSgpO1xuXG5cdFx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGVUaW1lc3RhbXAgPSBub3ZlbFN0YXRDYWNoZS50aW1lc3RhbXA7XG5cblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRsZXQgX2RvID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKHBhdGhNYWluLm1hdGNoKC9fb3V0JC8pKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oX3BhdGgocGF0aE1haW4gKyAnX291dCcsIG5vdmVsSUQpLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnNvbGUuZGVidWcocGF0aE1haW4sIG5vdmVsSUQsIF9kbyk7XG5cblx0XHRcdFx0aWYgKF9kbylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBwYXRoTWFpbik7XG5cdFx0XHRcdFx0Y29uc3QgaW5wdXRQYXRoID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5yZXNvbHZlKG5vdmVsRXB1Yih7XG5cdFx0XHRcdFx0XHRcdGlucHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0b3V0cHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0cGFkRW5kRGF0ZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdHVzZVRpdGxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZUxvY2FsOiBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRub0xvZzogdHJ1ZSxcblx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHR4dCA9IGF3YWl0IHR4dE1lcmdlKGlucHV0UGF0aCwgb3V0cHV0UGF0aCwgcmV0LmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLnR4dF9iYXNlbmFtZSAmJiBub3ZlbC50eHRfYmFzZW5hbWUgIT0gdHh0LmZpbGVuYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aCwgJ291dCcsIG5vdmVsLnR4dF9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLmVwdWJfYmFzZW5hbWUgJiYgbm92ZWwuZXB1Yl9iYXNlbmFtZSAhPSByZXQuZmlsZW5hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBub3ZlbC5lcHViX2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAocGF0aE1haW4ubWF0Y2goL19vdXQkLykpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcGF0aE1haW5fc3JjID0gcGF0aE1haW4ucmVwbGFjZSgvX291dCQvLCAnJyk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgb3V0cHV0UGF0aF9zcmMgPSBwYXRoLmpvaW4oR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBwYXRoTWFpbl9zcmMpO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBvdXRwdXRQYXRoID0gb3V0cHV0UGF0aF9zcmM7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgcmV0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAobm92ZWwudHh0X2Jhc2VuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsICdvdXQnLCBub3ZlbC50eHRfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbC5lcHViX2Jhc2VuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsIG5vdmVsLmVwdWJfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsICdvdXQnLCB0eHQuZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLnR4dF9iYXNlbmFtZSA9IHR4dC5maWxlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBtZXRhOiBQYXJ0aWFsPElNZGNvbmZNZXRhPiA9IGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbihpbnB1dFBhdGgsICdSRUFETUUubWQnKSlcblx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAoZGF0YSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbWRjb25mX3BhcnNlKGRhdGEsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g55W25rKS5pyJ5YyF5ZCr5b+F6KaB55qE5YWn5a655pmC5LiN55Si55Sf6Yyv6KqkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g5YWB6Kix5LiN5qiZ5rqW55qEIGluZm8g5YWn5a65XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxvd0NoZWNrTGV2ZWw6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRsZXQgYXV0aG9yX25hbWU6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0XHRpZiAobWV0YSAmJiBtZXRhLm5vdmVsICYmIG1ldGEubm92ZWwuYXV0aG9yKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0YXV0aG9yX25hbWUgPSBnaXRfZmFrZV9hdXRob3IobWV0YS5ub3ZlbC5hdXRob3IpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdFx0XHQnLicsXG5cdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdGN3ZDogb3V0cHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGNvbW1pdF9tc2cgPSBgW2VwdWJdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gO1xuXG5cdFx0XHRcdFx0XHRcdGhpc3RvcnlUb2RheS5lcHViLnB1c2goW3BhdGhNYWluLCBub3ZlbElEXSk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLmVwdWJfZGF0ZSA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHJldC5zdGF0KVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsU3RhdENhY2hlVGltZXN0YW1wICE9IG5vdmVsLnVwZGF0ZV9kYXRlKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsLnZvbHVtZV9vbGQgPSBub3ZlbC52b2x1bWUgfCAwO1xuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlcl9vbGQgPSBub3ZlbC5jaGFwdGVyIHwgMDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWUgPSByZXQuc3RhdC52b2x1bWU7XG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlciA9IHJldC5zdGF0LmNoYXB0ZXI7XG5cblx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnICs9IGAoIHY6JHtub3ZlbC52b2x1bWV9LCBjOiR7bm92ZWwuY2hhcHRlcn0sIGFkZDoke25vdmVsLmNoYXB0ZXIgLSBub3ZlbC5jaGFwdGVyX29sZH0gKWA7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5lcHViX2Jhc2VuYW1lID0gcmV0LmZpbGVuYW1lO1xuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLm5vdmVsX3N0YXR1cyA9IChtZXRhICYmIG1ldGEubm92ZWwpID8gbWV0YS5ub3ZlbC5ub3ZlbF9zdGF0dXMgOiAwO1xuXG5cdFx0XHRcdFx0XHRcdGlmICghbm92ZWwubm92ZWxfc3RhdHVzKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIG5vdmVsLm5vdmVsX3N0YXR1cztcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2cobm92ZWwpO1xuXG5cdFx0XHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdFx0XHQgKiDlr6bpqZfmgKflip/og70g5Y+v5Yip55SoIGdpdCB1c2VyIOS+humBjua/vuS9nOiAhVxuXHRcdFx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRcdFx0aWYgKGF1dGhvcl9uYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRcdGAtLWF1dGhvcj0ke2F1dGhvcl9uYW1lfWAsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbW1pdF9tc2csXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbXNnID0gZS50b1N0cmluZygpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtc2cubWF0Y2goL25vdCBhIHZhbGlkIG5vdmVsSW5mbyBkYXRhLykpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdbU0tJUF0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdbRVJST1JdJywgcGF0aE1haW4sIG5vdmVsSUQsIG1zZyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5ncmV5KGxzLmxlbmd0aCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBjb3VudCA9IGxzLmZpbHRlcih2ID0+IHYpLmxlbmd0aDtcblxuXHRcdFx0XHRjb25zb2xlLmluZm8oYOacrOasoeWFseabtOaWsCAke2NvdW50fSDlsI/oqqpgKTtcblxuXHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgd2FpdHB1c2ggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZXB1Yi53YWl0cHVzaCcpO1xuXG5cdFx0XHRcdGF3YWl0IGZzLmVuc3VyZUZpbGUod2FpdHB1c2gpO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBsczogJHtscy5sZW5ndGh9YCk7XG5cblx0XHRcdFx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBbXSwge1xuXHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8qXG5cdFx0XHRcdGF3YWl0IHB1c2hHaXQoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBnZXRQdXNoVXJsKEdJVF9TRVRUSU5HX0VQVUIudXJsKSk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKHdhaXRwdXNoKTtcblx0XHRcdFx0Ki9cblx0XHRcdH0pXG5cdFx0O1xuXHR9XG59KSgpO1xuXG5mdW5jdGlvbiBmaWx0ZXJDYWNoZShsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdLCBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcpXG57XG5cdHJldHVybiBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdHtcblx0XHRsZXQgYm9vbCA9IHYucGF0aE1haW4gPT0gcGF0aE1haW4gJiYgdi5ub3ZlbElEID09IG5vdmVsSUQ7XG5cblx0XHRyZXR1cm4gdiAmJiAhYm9vbFxuXHR9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX3JlbW92ZV9maWxlX2dpdChmaWxlOiBzdHJpbmcsIGN3ZD86IHN0cmluZylcbntcblx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpKVxuXHR7XG5cdFx0aWYgKCFjd2QpXG5cdFx0e1xuXHRcdFx0Y3dkID0gcGF0aC5kaXJuYW1lKGZpbGUpO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKGDnp7vpmaToiIrmqpTmoYggJHtmaWxlfWApO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J3JtJyxcblx0XHRcdFx0ZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblxuXHRcdGF3YWl0IGZzLnJlbW92ZShmaWxlKS5jYXRjaCh2ID0+IG51bGwpO1xuXG5cdFx0cmV0dXJuIGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpO1xuXHR9XG59XG4iXX0=