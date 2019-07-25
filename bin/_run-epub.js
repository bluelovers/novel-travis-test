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
const util_2 = require("@node-novel/cache-loader/lib/util");
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
    let allowUpdateTimestamp = true;
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
            allowUpdateTimestamp = false;
        }
    }
    else {
        ls2 = fs.readJSONSync(epub_json);
    }
    ls2 = ls2.filter(function (v) {
        return v;
    });
    ls = array_hyper_unique_1.array_unique(ls);
    ls2 = array_hyper_unique_1.array_unique(ls2);
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
    const startTime = Date.now();
    const MAX_SCRIPT_TIMEOUT_EPUB = 2 * 60 * 1000;
    if (ls && ls.length) {
        const novelStatCache = novel_stat_1.getNovelStatCache();
        const historyToday = novelStatCache.historyToday();
        const novelStatCacheTimestamp = novelStatCache.timestamp;
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            if ((Date.now() - startTime) > MAX_SCRIPT_TIMEOUT_EPUB) {
                return null;
            }
            let { is_out, pathMain_base, pathMain_out } = util_2.parsePathMainBase(pathMain);
            let _do = false;
            if (is_out) {
                _do = true;
            }
            else if (!fs.existsSync(path.join(segment_1._path(pathMain_out, novelID), 'README.md'))) {
                _do = true;
            }
            log_1.default.debug(pathMain, novelID, _do);
            if (_do) {
                const outputPath = path.join(git_1.GIT_SETTING_EPUB.targetPath, pathMain_base);
                const inputPath = segment_1._path(pathMain, novelID);
                await Promise.resolve(novel_epub_1.default({
                    inputPath,
                    outputPath,
                    padEndDate: false,
                    useTitle: true,
                    filenameLocal: novelID,
                    noLog: true,
                    epubContextDate: project_config_1.default.EPUB_CONTEXT_DATE,
                }))
                    .then(async function (ret) {
                    let txt = await novel_txt_merge_1.default(inputPath, outputPath, ret.basename);
                    let novel = novelStatCache.novel(pathMain, novelID);
                    let epub_fullpath = ret.file;
                    let txt_fullpath = txt.fullpath;
                    if (novel.txt_basename && novel.txt_basename != txt.filename) {
                        let file = path.join(outputPath, 'out', novel.txt_basename);
                        if (!util_1.path_equal(file, txt_fullpath)) {
                            await _remove_file_git(file);
                        }
                    }
                    if (novel.epub_basename && novel.epub_basename != ret.filename) {
                        let file = path.join(outputPath, novel.epub_basename);
                        if (!util_1.path_equal(file, epub_fullpath)) {
                            await _remove_file_git(file);
                        }
                    }
                    if (is_out) {
                        let pathMain_src = pathMain_base;
                        let outputPath_src = path.join(git_1.GIT_SETTING_EPUB.targetPath, pathMain_src);
                        let outputPath = outputPath_src;
                        let file = path.join(outputPath_src, ret.filename);
                        if (!util_1.path_equal(file, epub_fullpath)) {
                            await _remove_file_git(file);
                        }
                        if (novel.txt_basename) {
                            file = path.join(outputPath_src, 'out', novel.txt_basename);
                            if (!util_1.path_equal(file, txt_fullpath)) {
                                await _remove_file_git(file);
                            }
                        }
                        if (novel.epub_basename) {
                            file = path.join(outputPath_src, novel.epub_basename);
                            if (!util_1.path_equal(file, epub_fullpath)) {
                                await _remove_file_git(file);
                            }
                        }
                        file = path.join(outputPath_src, 'out', txt.filename);
                        if (!util_1.path_equal(file, txt_fullpath)) {
                            await _remove_file_git(file);
                        }
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
                    allowUpdateTimestamp && historyToday.epub.push([pathMain, novelID]);
                    let novel = novelStatCache.novel(pathMain, novelID);
                    allowUpdateTimestamp && (novel.epub_date = Date.now());
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
            return false;
        })
            .tap(function (ls) {
            let _count = {
                done: 0,
                cancel: 0,
                ignore: 0,
            };
            let count = ls.filter(v => {
                if (v) {
                    _count.done++;
                }
                else if (v == null) {
                    _count.cancel++;
                }
                else {
                    _count.ignore++;
                }
                return v;
            }).length;
            log_1.default.info(`本次共更新 ${_count.done} 小說`, `取消 x ${_count.cancel}`, `忽略 x ${_count.ignore}`);
            novelStatCache.save();
        })
            .tap(async function () {
            let waitpush = path.join(project_config_1.default.cache_root, 'epub.waitpush');
            await fs.ensureFile(waitpush);
            ls = array_hyper_unique_1.array_unique(ls);
            ls2 = array_hyper_unique_1.array_unique(ls2);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQWdDO0FBQ2hDLG9DQUF3RjtBQUN4RixxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBMEQ7QUFDMUQsc0RBQXNFO0FBQ3RFLCtCQUFnQztBQUNoQyxvQ0FBcUM7QUFDckMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBdUM7QUFDdkMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBQ3JFLDREQUFzRTtBQUl0RSxJQUFJLENBQUMsaUJBQVMsQ0FBQyxzQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFDM0M7SUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRXJFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztDQUNuRDtBQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBRXBELGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUdqQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEUsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVqRSxJQUFJLEVBQUUsR0FBNEMsRUFBRSxDQUFDO0lBQ3JELElBQUksR0FBRyxHQUE0QyxFQUFFLENBQUM7SUFFdEQsSUFBSSxFQUFFLENBQUMsVUFBVSxD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QUNKLElBQUk7YUFDSixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHO2FBQ0gsQ0FBQyxDQUFDO1NBQ0g7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZDLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvQjtBQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTgvMDE4LlxuICovXG5cbmltcG9ydCB7IGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCB7IHByb2Nlc3NUb2MgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3bk91dHB1dCwgY3Jvc3NTcGF3blN5bmMsIGlzR2l0Um9vdCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7XG5cdEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsXG5cdEdJVF9TRVRUSU5HX0VQVUIsXG59IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IGdpdF9mYWtlX2F1dGhvciwgcGF0aF9lcXVhbCB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnLCB7IE1BWF9TQ1JJUFRfVElNRU9VVCB9IGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgbm92ZWxFcHViIGZyb20gJ25vdmVsLWVwdWInO1xuaW1wb3J0IHsgZ2V0UHVzaFVybCwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuaW1wb3J0IHsgX3BhdGgsIERJU1RfTk9WRUwgfSBmcm9tICcuLi9zY3JpcHQvc2VnbWVudCc7XG5pbXBvcnQgRmFzdEdsb2IgPSByZXF1aXJlKCdmYXN0LWdsb2InKTtcbmltcG9ydCB0eHRNZXJnZSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIGFzIGFycmF5VW5pcSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgcGFyc2VQYXRoTWFpbkJhc2UgfSBmcm9tICdAbm9kZS1ub3ZlbC9jYWNoZS1sb2FkZXIvbGliL3V0aWwnO1xuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uRXJyb3IsIFRpbWVvdXRFcnJvciB9IGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmlmICghaXNHaXRSb290KEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCkpXG57XG5cdGNvbnNvbGUud2FybihgZGlzdF9ub3ZlbCBub3QgYSBnaXQ6ICR7R0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRofWApO1xuXG5cdHRocm93IG5ldyBFcnJvcihgc29tZXRoaW5nIHdyb25nIHdoZW4gY3JlYXRlIGdpdGApO1xufVxuXG5jb25zb2xlLmluZm8oYGdpdDogJHtHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGh9YCk7XG5cbmNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lUXG5dKSAmJiAoYXN5bmMgKCkgPT5cbntcblxuXHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZGlmZi1ub3ZlbC5qc29uJyk7XG5cdGxldCBlcHViX2pzb24gPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZXB1Yi5qc29uJyk7XG5cblx0bGV0IGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10gPSBbXTtcblx0bGV0IGxzMjogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdID0gW107XG5cblx0aWYgKGZzLmV4aXN0c1N5bmMoanNvbmZpbGUpKVxuXHR7XG5cdFx0bHMgPSBmcy5yZWFkSlNPTlN5bmMoanNvbmZpbGUpO1xuXHR9XG5cblx0bGV0IGFsbG93VXBkYXRlVGltZXN0YW1wOiBib29sZWFuID0gdHJ1ZTtcblxuXHRpZiAoIWZzLmV4aXN0c1N5bmMoZXB1Yl9qc29uKSlcblx0e1xuXHRcdGxldCBDV0QgPSBwcm9jZXNzLmN3ZCgpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGxvYWRNYWluQ29uZmlnKENXRCk7XG5cblx0XHRpZiAocmVzdWx0LmNvbmZpZy5kaXNhYmxlSW5pdClcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDkvYbkuI3ln7fooYzliJ3lp4vljJbku7vli5lgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGBbRVBVQl0g5b+r5Y+W5qqU5qGI5LiN5a2Y5ZyoIOacrOasoeWwh+Wft+ihjOWIneWni+WMluaJgOaciSBlcHViIOaqlOahiGApO1xuXG5cdFx0XHRsczIgPSBhd2FpdCBQcm9taXNlXG5cdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2IoW1xuXHRcdFx0XHRcdCcqLyovKicsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpLFxuXHRcdFx0XHRcdG9ubHlEaXJlY3RvcmllczogdHJ1ZSxcblx0XHRcdFx0XHRvbmx5RmlsZXM6IGZhbHNlLFxuXHRcdFx0XHR9KSwgZnVuY3Rpb24gKGlkOiBzdHJpbmcpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgW3BhdGhNYWluLCBub3ZlbElEXSA9IGlkLnNwbGl0KC9bXFxcXFxcL10vKTtcblxuXHRcdFx0XHRcdGxldCBucCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmICghZnMuZXhpc3RzU3luYyhucCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7IHBhdGhNYWluLCBub3ZlbElEIH1cblx0XHRcdFx0fSlcblx0XHRcdDtcblxuXHRcdFx0YWxsb3dVcGRhdGVUaW1lc3RhbXAgPSBmYWxzZTtcblx0XHR9XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bHMyID0gZnMucmVhZEpTT05TeW5jKGVwdWJfanNvbik7XG5cdH1cblxuXHRsczIgPSBsczIuZmlsdGVyKGZ1bmN0aW9uICh2KVxuXHR7XG5cdFx0cmV0dXJuIHZcblx0fSk7XG5cblx0bHMgPSBhcnJheVVuaXEobHMpO1xuXHRsczIgPSBhcnJheVVuaXEobHMyKTtcblxuXHRjb25zb2xlLmRlYnVnKGDmnKzmrKHmlrDlop4gJHtscy5sZW5ndGh9ICwg5LiK5qyh5pyq5a6M5oiQICR7bHMyLmxlbmd0aH1gKTtcblxuXHRjb25zb2xlLmRpcihscyk7XG5cdGNvbnNvbGUuZGlyKGxzMik7XG5cblx0bHMgPSAobHMgfHwgW10pLmNvbmNhdChsczIgfHwgW10pO1xuXG5cdGxzID0gbHMuZmlsdGVyKGZ1bmN0aW9uICh2KVxuXHR7XG5cdFx0cmV0dXJuIHZcblx0fSk7XG5cblx0bHMgPSBhcnJheVVuaXEobHMpO1xuXG5cdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgbHMsIHtcblx0XHRzcGFjZXM6ICdcXHQnLFxuXHR9KTtcblxuXHRjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG5cdGNvbnN0IE1BWF9TQ1JJUFRfVElNRU9VVF9FUFVCID0gMiAqIDYwICogMTAwMDtcblxuXHRpZiAobHMgJiYgbHMubGVuZ3RoKVxuXHR7XG5cdFx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXHRcdGNvbnN0IGhpc3RvcnlUb2RheSA9IG5vdmVsU3RhdENhY2hlLmhpc3RvcnlUb2RheSgpO1xuXG5cdFx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGVUaW1lc3RhbXAgPSBub3ZlbFN0YXRDYWNoZS50aW1lc3RhbXA7XG5cblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRpZiAoKERhdGUubm93KCkgLSBzdGFydFRpbWUpID4gTUFYX1NDUklQVF9USU1FT1VUX0VQVUIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHsgaXNfb3V0LCBwYXRoTWFpbl9iYXNlLCBwYXRoTWFpbl9vdXQgfSA9IHBhcnNlUGF0aE1haW5CYXNlKHBhdGhNYWluKTtcblxuXHRcdFx0XHRsZXQgX2RvID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKGlzX291dClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKF9wYXRoKHBhdGhNYWluX291dCwgbm92ZWxJRCksICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc29sZS5kZWJ1ZyhwYXRoTWFpbiwgbm92ZWxJRCwgX2RvKTtcblxuXHRcdFx0XHRpZiAoX2RvKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIHBhdGhNYWluX2Jhc2UpO1xuXHRcdFx0XHRcdGNvbnN0IGlucHV0UGF0aCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UucmVzb2x2ZShub3ZlbEVwdWIoe1xuXHRcdFx0XHRcdFx0XHRpbnB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHR1c2VUaXRsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGVwdWJDb250ZXh0RGF0ZTogUHJvamVjdENvbmZpZy5FUFVCX0NPTlRFWFRfREFURSxcblx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHR4dCA9IGF3YWl0IHR4dE1lcmdlKGlucHV0UGF0aCwgb3V0cHV0UGF0aCwgcmV0LmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZnVsbHBhdGggPSByZXQuZmlsZTtcblx0XHRcdFx0XHRcdFx0bGV0IHR4dF9mdWxscGF0aCA9IHR4dC5mdWxscGF0aDtcblxuXHRcdFx0XHRcdFx0XHRpZiAobm92ZWwudHh0X2Jhc2VuYW1lICYmIG5vdmVsLnR4dF9iYXNlbmFtZSAhPSB0eHQuZmlsZW5hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoLCAnb3V0Jywgbm92ZWwudHh0X2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCB0eHRfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLmVwdWJfYmFzZW5hbWUgJiYgbm92ZWwuZXB1Yl9iYXNlbmFtZSAhPSByZXQuZmlsZW5hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBub3ZlbC5lcHViX2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCBlcHViX2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChpc19vdXQpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcGF0aE1haW5fc3JjID0gcGF0aE1haW5fYmFzZTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBvdXRwdXRQYXRoX3NyYyA9IHBhdGguam9pbihHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIHBhdGhNYWluX3NyYyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IG91dHB1dFBhdGggPSBvdXRwdXRQYXRoX3NyYztcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCByZXQuZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIGVwdWJfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLnR4dF9iYXNlbmFtZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0Jywgbm92ZWwudHh0X2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIHR4dF9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLmVwdWJfYmFzZW5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgbm92ZWwuZXB1Yl9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCBlcHViX2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0JywgdHh0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCB0eHRfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwudHh0X2Jhc2VuYW1lID0gdHh0LmZpbGVuYW1lO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IG1ldGE6IFBhcnRpYWw8SU1kY29uZk1ldGE+ID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKGlucHV0UGF0aCwgJ1JFQURNRS5tZCcpKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDnlbbmspLmnInljIXlkKvlv4XopoHnmoTlhaflrrnmmYLkuI3nlKLnlJ/pjK/oqqRcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDlhYHoqLHkuI3mqJnmupbnmoQgaW5mbyDlhaflrrlcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdGxldCBhdXRob3JfbmFtZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtZXRhICYmIG1ldGEubm92ZWwgJiYgbWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhdXRob3JfbmFtZSA9IGdpdF9mYWtlX2F1dGhvcihtZXRhLm5vdmVsLmF1dGhvcik7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0XHRcdCcuJyxcblx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0Y3dkOiBvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgY29tbWl0X21zZyA9IGBbZXB1Yl0gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWA7XG5cblx0XHRcdFx0XHRcdFx0YWxsb3dVcGRhdGVUaW1lc3RhbXAgJiYgaGlzdG9yeVRvZGF5LmVwdWIucHVzaChbcGF0aE1haW4sIG5vdmVsSURdKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0YWxsb3dVcGRhdGVUaW1lc3RhbXAgJiYgKG5vdmVsLmVwdWJfZGF0ZSA9IERhdGUubm93KCkpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChyZXQuc3RhdClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbFN0YXRDYWNoZVRpbWVzdGFtcCAhPSBub3ZlbC51cGRhdGVfZGF0ZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWVfb2xkID0gbm92ZWwudm9sdW1lIHwgMDtcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXJfb2xkID0gbm92ZWwuY2hhcHRlciB8IDA7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwudm9sdW1lID0gcmV0LnN0YXQudm9sdW1lO1xuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXIgPSByZXQuc3RhdC5jaGFwdGVyO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyArPSBgKCB2OiR7bm92ZWwudm9sdW1lfSwgYzoke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6JHtub3ZlbC5jaGFwdGVyIC0gbm92ZWwuY2hhcHRlcl9vbGR9IClgO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwuZXB1Yl9iYXNlbmFtZSA9IHJldC5maWxlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5ub3ZlbF9zdGF0dXMgPSAobWV0YSAmJiBtZXRhLm5vdmVsKSA/IG1ldGEubm92ZWwubm92ZWxfc3RhdHVzIDogMDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW5vdmVsLm5vdmVsX3N0YXR1cylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBub3ZlbC5ub3ZlbF9zdGF0dXM7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5vdmVsKTtcblxuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICog5a+m6amX5oCn5Yqf6IO9IOWPr+WIqeeUqCBnaXQgdXNlciDkvobpgY7mv77kvZzogIVcblx0XHRcdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0XHRcdGlmIChhdXRob3JfbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbW1pdF9tc2csXG5cdFx0XHRcdFx0XHRcdFx0XHRgLS1hdXRob3I9JHthdXRob3JfbmFtZX1gLFxuXHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCxcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnLFxuXHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCxcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBscywge1xuXHRcdFx0XHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IG1zZyA9IGUudG9TdHJpbmcoKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAobXNnLm1hdGNoKC9ub3QgYSB2YWxpZCBub3ZlbEluZm8gZGF0YS8pKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignW1NLSVBdJywgcGF0aE1haW4sIG5vdmVsSUQsIG1zZyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignW0VSUk9SXScsIHBhdGhNYWluLCBub3ZlbElELCBtc2cpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuZ3JleShscy5sZW5ndGgsIHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgX2NvdW50ID0ge1xuXHRcdFx0XHRcdGRvbmU6IDAsXG5cdFx0XHRcdFx0Y2FuY2VsOiAwLFxuXHRcdFx0XHRcdGlnbm9yZTogMCxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRsZXQgY291bnQgPSBscy5maWx0ZXIodiA9PiB7XG5cblx0XHRcdFx0XHRpZiAodilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfY291bnQuZG9uZSsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICh2ID09IG51bGwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0X2NvdW50LmNhbmNlbCsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0X2NvdW50Lmlnbm9yZSsrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB2O1xuXHRcdFx0XHR9KS5sZW5ndGg7XG5cblx0XHRcdFx0Y29uc29sZS5pbmZvKGDmnKzmrKHlhbHmm7TmlrAgJHtfY291bnQuZG9uZX0g5bCP6KqqYCwgYOWPlua2iCB4ICR7X2NvdW50LmNhbmNlbH1gLCBg5b+955WlIHggJHtfY291bnQuaWdub3JlfWApO1xuXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZSh3YWl0cHVzaCk7XG5cblx0XHRcdFx0bHMgPSBhcnJheVVuaXEobHMpO1xuXHRcdFx0XHRsczIgPSBhcnJheVVuaXEobHMyKTtcblxuXHRcdFx0XHRjb25zb2xlLmxvZyhgbHM6ICR7bHMubGVuZ3RofWApO1xuXG5cdFx0XHRcdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgW10sIHtcblx0XHRcdFx0XHRzcGFjZXM6ICdcXHQnLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvKlxuXHRcdFx0XHRhd2FpdCBwdXNoR2l0KEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgZ2V0UHVzaFVybChHSVRfU0VUVElOR19FUFVCLnVybCkpO1xuXG5cdFx0XHRcdGF3YWl0IGZzLnJlbW92ZSh3YWl0cHVzaCk7XG5cdFx0XHRcdCovXG5cdFx0XHR9KVxuXHRcdDtcblx0fVxufSkoKTtcblxuZnVuY3Rpb24gZmlsdGVyQ2FjaGUobHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSwgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nKVxue1xuXHRyZXR1cm4gbHMuZmlsdGVyKGZ1bmN0aW9uICh2KVxuXHR7XG5cdFx0bGV0IGJvb2wgPSB2LnBhdGhNYWluID09IHBhdGhNYWluICYmIHYubm92ZWxJRCA9PSBub3ZlbElEO1xuXG5cdFx0cmV0dXJuIHYgJiYgIWJvb2xcblx0fSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIF9yZW1vdmVfZmlsZV9naXQoZmlsZTogc3RyaW5nLCBjd2Q/OiBzdHJpbmcpXG57XG5cdGlmIChmcy5wYXRoRXhpc3RzU3luYyhmaWxlKSlcblx0e1xuXHRcdGlmICghY3dkKVxuXHRcdHtcblx0XHRcdGN3ZCA9IHBhdGguZGlybmFtZShmaWxlKTtcblx0XHR9XG5cblx0XHRjb25zb2xlLmxvZyhg56e76Zmk6IiK5qqU5qGIICR7ZmlsZX1gKTtcblxuXHRcdHRyeVxuXHRcdHtcblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdybScsXG5cdFx0XHRcdGZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZCxcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cblx0XHRhd2FpdCBmcy5yZW1vdmUoZmlsZSkuY2F0Y2godiA9PiBudWxsKTtcblxuXHRcdHJldHVybiBmcy5wYXRoRXhpc3RzU3luYyhmaWxlKTtcblx0fVxufVxuIl19