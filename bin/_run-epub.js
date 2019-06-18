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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQWdDO0FBQ2hDLG9DQUF3RjtBQUN4RixxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBMEQ7QUFDMUQsc0RBQXNFO0FBQ3RFLCtCQUFnQztBQUNoQyxvQ0FBcUM7QUFDckMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBdUM7QUFDdkMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBQ3JFLDREQUFzRTtBQUl0RSxJQUFJLENBQUMsaUJBQVMsQ0FBQyxzQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFDM0M7SUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRXJFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztDQUNuRDtBQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBRXBELGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUdqQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEUsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVqRSxJQUFJLEVBQUUsR0FBNEMsRUFBRSxDQUFDO0lBQ3JELElBQUksR0FBRyxHQUE0QyxFQUFFLENBQUM7SUFFdEQsSUFBSSxFQUFFLENBQUMsVUFBVSxD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U0FBUztnQkFDaEIsR0FBRzthQUNILENBQUMsQ0FBQztTQUNIO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7U0FFQztRQUVELE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDL0I7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC81LzE4LzAxOC5cbiAqL1xuXG5pbXBvcnQgeyBsb2FkTWFpbkNvbmZpZyB9IGZyb20gJ0Bub2RlLW5vdmVsL3Rhc2svbGliL2NvbmZpZyc7XG5pbXBvcnQgeyBwcm9jZXNzVG9jIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5pbXBvcnQgeyBjcm9zc1NwYXduQXN5bmMsIGNyb3NzU3Bhd25PdXRwdXQsIGNyb3NzU3Bhd25TeW5jLCBpc0dpdFJvb3QgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQge1xuXHRHSVRfU0VUVElOR19ESVNUX05PVkVMLFxuXHRHSVRfU0VUVElOR19FUFVCLFxufSBmcm9tICcuLi9kYXRhL2dpdCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSB9IGZyb20gJy4uL2xpYi9jYWNoZS9ub3ZlbC1zdGF0JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgeyBnaXRfZmFrZV9hdXRob3IsIHBhdGhfZXF1YWwgfSBmcm9tICcuLi9saWIvdXRpbCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZywgeyBNQVhfU0NSSVBUX1RJTUVPVVQgfSBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCB7IGdldFB1c2hVcmwsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCB7IF9wYXRoLCBESVNUX05PVkVMIH0gZnJvbSAnLi4vc2NyaXB0L3NlZ21lbnQnO1xuaW1wb3J0IEZhc3RHbG9iID0gcmVxdWlyZSgnZmFzdC1nbG9iJyk7XG5pbXBvcnQgdHh0TWVyZ2UgZnJvbSAnbm92ZWwtdHh0LW1lcmdlJztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSBhcyBhcnJheVVuaXEgfSBmcm9tICdhcnJheS1oeXBlci11bmlxdWUnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCB7IHBhcnNlUGF0aE1haW5CYXNlIH0gZnJvbSAnQG5vZGUtbm92ZWwvY2FjaGUtbG9hZGVyL2xpYi91dGlsJztcbmltcG9ydCB7IENhbmNlbGxhdGlvbkVycm9yLCBUaW1lb3V0RXJyb3IgfSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuXG5pZiAoIWlzR2l0Um9vdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgpKVxue1xuXHRjb25zb2xlLndhcm4oYGRpc3Rfbm92ZWwgbm90IGEgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoYHNvbWV0aGluZyB3cm9uZyB3aGVuIGNyZWF0ZSBnaXRgKTtcbn1cblxuY29uc29sZS5pbmZvKGBnaXQ6ICR7R0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRofWApO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+XG57XG5cblx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2RpZmYtbm92ZWwuanNvbicpO1xuXHRsZXQgZXB1Yl9qc29uID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2VwdWIuanNvbicpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdID0gW107XG5cdGxldCBsczI6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGxzID0gZnMucmVhZEpTT05TeW5jKGpzb25maWxlKTtcblx0fVxuXG5cdGxldCBhbGxvd1VwZGF0ZVRpbWVzdGFtcDogYm9vbGVhbiA9IHRydWU7XG5cblx0aWYgKCFmcy5leGlzdHNTeW5jKGVwdWJfanNvbikpXG5cdHtcblx0XHRsZXQgQ1dEID0gcHJvY2Vzcy5jd2QoKTtcblx0XHRjb25zdCByZXN1bHQgPSBsb2FkTWFpbkNvbmZpZyhDV0QpO1xuXG5cdFx0aWYgKHJlc3VsdC5jb25maWcuZGlzYWJsZUluaXQpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYFtFUFVCXSDlv6vlj5bmqpTmoYjkuI3lrZjlnKgg5L2G5LiN5Z+36KGM5Yid5aeL5YyW5Lu75YuZYCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDmnKzmrKHlsIfln7fooYzliJ3lp4vljJbmiYDmnIkgZXB1YiDmqpTmoYhgKTtcblxuXHRcdFx0bHMyID0gYXdhaXQgUHJvbWlzZVxuXHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iKFtcblx0XHRcdFx0XHQnKi8qLyonLFxuXHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KSxcblx0XHRcdFx0XHRvbmx5RGlyZWN0b3JpZXM6IHRydWUsXG5cdFx0XHRcdFx0b25seUZpbGVzOiBmYWxzZSxcblx0XHRcdFx0fSksIGZ1bmN0aW9uIChpZDogc3RyaW5nKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IFtwYXRoTWFpbiwgbm92ZWxJRF0gPSBpZC5zcGxpdCgvW1xcXFxcXC9dLyk7XG5cblx0XHRcdFx0XHRsZXQgbnAgPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmMobnApKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4geyBwYXRoTWFpbiwgbm92ZWxJRCB9XG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cblx0XHRcdGFsbG93VXBkYXRlVGltZXN0YW1wID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxzMiA9IGZzLnJlYWRKU09OU3luYyhlcHViX2pzb24pO1xuXHR9XG5cblx0bHMyID0gbHMyLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdHJldHVybiB2XG5cdH0pO1xuXG5cdGxzID0gYXJyYXlVbmlxKGxzKTtcblx0bHMyID0gYXJyYXlVbmlxKGxzMik7XG5cblx0Y29uc29sZS5kZWJ1Zyhg5pys5qyh5paw5aKeICR7bHMubGVuZ3RofSAsIOS4iuasoeacquWujOaIkCAke2xzMi5sZW5ndGh9YCk7XG5cblx0Y29uc29sZS5kaXIobHMpO1xuXHRjb25zb2xlLmRpcihsczIpO1xuXG5cdGxzID0gKGxzIHx8IFtdKS5jb25jYXQobHMyIHx8IFtdKTtcblxuXHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdHJldHVybiB2XG5cdH0pO1xuXG5cdGxzID0gYXJyYXlVbmlxKGxzKTtcblxuXHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0c3BhY2VzOiAnXFx0Jyxcblx0fSk7XG5cblx0Y29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuXHRjb25zdCBNQVhfU0NSSVBUX1RJTUVPVVRfRVBVQiA9IDIgKiA2MCAqIDEwMDA7XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblx0XHRjb25zdCBoaXN0b3J5VG9kYXkgPSBub3ZlbFN0YXRDYWNoZS5oaXN0b3J5VG9kYXkoKTtcblxuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlVGltZXN0YW1wID0gbm92ZWxTdGF0Q2FjaGUudGltZXN0YW1wO1xuXG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0aWYgKChEYXRlLm5vdygpIC0gc3RhcnRUaW1lKSA+IE1BWF9TQ1JJUFRfVElNRU9VVF9FUFVCKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB7IGlzX291dCwgcGF0aE1haW5fYmFzZSwgcGF0aE1haW5fb3V0IH0gPSBwYXJzZVBhdGhNYWluQmFzZShwYXRoTWFpbik7XG5cblx0XHRcdFx0bGV0IF9kbyA9IGZhbHNlO1xuXG5cdFx0XHRcdGlmIChpc19vdXQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguam9pbihfcGF0aChwYXRoTWFpbl9vdXQsIG5vdmVsSUQpLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnNvbGUuZGVidWcocGF0aE1haW4sIG5vdmVsSUQsIF9kbyk7XG5cblx0XHRcdFx0aWYgKF9kbylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBwYXRoTWFpbl9iYXNlKTtcblx0XHRcdFx0XHRjb25zdCBpbnB1dFBhdGggPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLnJlc29sdmUobm92ZWxFcHViKHtcblx0XHRcdFx0XHRcdFx0aW5wdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRwYWRFbmREYXRlOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0dXNlVGl0bGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGZpbGVuYW1lTG9jYWw6IG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdG5vTG9nOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSkpXG5cdFx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgdHh0ID0gYXdhaXQgdHh0TWVyZ2UoaW5wdXRQYXRoLCBvdXRwdXRQYXRoLCByZXQuYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9mdWxscGF0aCA9IHJldC5maWxlO1xuXHRcdFx0XHRcdFx0XHRsZXQgdHh0X2Z1bGxwYXRoID0gdHh0LmZ1bGxwYXRoO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChub3ZlbC50eHRfYmFzZW5hbWUgJiYgbm92ZWwudHh0X2Jhc2VuYW1lICE9IHR4dC5maWxlbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGgsICdvdXQnLCBub3ZlbC50eHRfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIHR4dF9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAobm92ZWwuZXB1Yl9iYXNlbmFtZSAmJiBub3ZlbC5lcHViX2Jhc2VuYW1lICE9IHJldC5maWxlbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGgsIG5vdmVsLmVwdWJfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIGVwdWJfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKGlzX291dClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBwYXRoTWFpbl9zcmMgPSBwYXRoTWFpbl9iYXNlO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG91dHB1dFBhdGhfc3JjID0gcGF0aC5qb2luKEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgcGF0aE1haW5fc3JjKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgb3V0cHV0UGF0aCA9IG91dHB1dFBhdGhfc3JjO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsIHJldC5maWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhdGhfZXF1YWwoZmlsZSwgZXB1Yl9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAobm92ZWwudHh0X2Jhc2VuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsICdvdXQnLCBub3ZlbC50eHRfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhdGhfZXF1YWwoZmlsZSwgdHh0X2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAobm92ZWwuZXB1Yl9iYXNlbmFtZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCBub3ZlbC5lcHViX2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIGVwdWJfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsICdvdXQnLCB0eHQuZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIHR4dF9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbC50eHRfYmFzZW5hbWUgPSB0eHQuZmlsZW5hbWU7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbWV0YTogUGFydGlhbDxJTWRjb25mTWV0YT4gPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoLmpvaW4oaW5wdXRQYXRoLCAnUkVBRE1FLm1kJykpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOeVtuaykuacieWMheWQq+W/heimgeeahOWFp+WuueaZguS4jeeUoueUn+mMr+iqpFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOWFgeioseS4jeaomea6lueahCBpbmZvIOWFp+WuuVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb3dDaGVja0xldmVsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGF1dGhvcl9uYW1lOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbCAmJiBtZXRhLm5vdmVsLmF1dGhvcilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF1dGhvcl9uYW1lID0gZ2l0X2Zha2VfYXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0Jy4nLFxuXHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRjd2Q6IG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBjb21taXRfbXNnID0gYFtlcHViXSAke3BhdGhNYWlufSAke25vdmVsSUR9YDtcblxuXHRcdFx0XHRcdFx0XHRhbGxvd1VwZGF0ZVRpbWVzdGFtcCAmJiBoaXN0b3J5VG9kYXkuZXB1Yi5wdXNoKFtwYXRoTWFpbiwgbm92ZWxJRF0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRhbGxvd1VwZGF0ZVRpbWVzdGFtcCAmJiAobm92ZWwuZXB1Yl9kYXRlID0gRGF0ZS5ub3coKSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHJldC5zdGF0KVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsU3RhdENhY2hlVGltZXN0YW1wICE9IG5vdmVsLnVwZGF0ZV9kYXRlKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsLnZvbHVtZV9vbGQgPSBub3ZlbC52b2x1bWUgfCAwO1xuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlcl9vbGQgPSBub3ZlbC5jaGFwdGVyIHwgMDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWUgPSByZXQuc3RhdC52b2x1bWU7XG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlciA9IHJldC5zdGF0LmNoYXB0ZXI7XG5cblx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnICs9IGAoIHY6JHtub3ZlbC52b2x1bWV9LCBjOiR7bm92ZWwuY2hhcHRlcn0sIGFkZDoke25vdmVsLmNoYXB0ZXIgLSBub3ZlbC5jaGFwdGVyX29sZH0gKWA7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5lcHViX2Jhc2VuYW1lID0gcmV0LmZpbGVuYW1lO1xuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLm5vdmVsX3N0YXR1cyA9IChtZXRhICYmIG1ldGEubm92ZWwpID8gbWV0YS5ub3ZlbC5ub3ZlbF9zdGF0dXMgOiAwO1xuXG5cdFx0XHRcdFx0XHRcdGlmICghbm92ZWwubm92ZWxfc3RhdHVzKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIG5vdmVsLm5vdmVsX3N0YXR1cztcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2cobm92ZWwpO1xuXG5cdFx0XHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdFx0XHQgKiDlr6bpqZfmgKflip/og70g5Y+v5Yip55SoIGdpdCB1c2VyIOS+humBjua/vuS9nOiAhVxuXHRcdFx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRcdFx0aWYgKGF1dGhvcl9uYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRcdGAtLWF1dGhvcj0ke2F1dGhvcl9uYW1lfWAsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbW1pdF9tc2csXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbXNnID0gZS50b1N0cmluZygpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtc2cubWF0Y2goL25vdCBhIHZhbGlkIG5vdmVsSW5mbyBkYXRhLykpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdbU0tJUF0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdbRVJST1JdJywgcGF0aE1haW4sIG5vdmVsSUQsIG1zZyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5ncmV5KGxzLmxlbmd0aCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBfY291bnQgPSB7XG5cdFx0XHRcdFx0ZG9uZTogMCxcblx0XHRcdFx0XHRjYW5jZWw6IDAsXG5cdFx0XHRcdFx0aWdub3JlOiAwLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGxldCBjb3VudCA9IGxzLmZpbHRlcih2ID0+IHtcblxuXHRcdFx0XHRcdGlmICh2KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdF9jb3VudC5kb25lKys7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKHYgPT0gbnVsbClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfY291bnQuY2FuY2VsKys7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfY291bnQuaWdub3JlKys7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHY7XG5cdFx0XHRcdH0pLmxlbmd0aDtcblxuXHRcdFx0XHRjb25zb2xlLmluZm8oYOacrOasoeWFseabtOaWsCAke19jb3VudC5kb25lfSDlsI/oqqpgLCBg5Y+W5raIIHggJHtfY291bnQuY2FuY2VsfWAsIGDlv73nlaUgeCAke19jb3VudC5pZ25vcmV9YCk7XG5cblx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUuc2F2ZSgpO1xuXHRcdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0bGV0IHdhaXRwdXNoID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2VwdWIud2FpdHB1c2gnKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5lbnN1cmVGaWxlKHdhaXRwdXNoKTtcblxuXHRcdFx0XHRscyA9IGFycmF5VW5pcShscyk7XG5cdFx0XHRcdGxzMiA9IGFycmF5VW5pcShsczIpO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBsczogJHtscy5sZW5ndGh9YCk7XG5cblx0XHRcdFx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBbXSwge1xuXHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8qXG5cdFx0XHRcdGF3YWl0IHB1c2hHaXQoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBnZXRQdXNoVXJsKEdJVF9TRVRUSU5HX0VQVUIudXJsKSk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKHdhaXRwdXNoKTtcblx0XHRcdFx0Ki9cblx0XHRcdH0pXG5cdFx0O1xuXHR9XG59KSgpO1xuXG5mdW5jdGlvbiBmaWx0ZXJDYWNoZShsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdLCBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcpXG57XG5cdHJldHVybiBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdHtcblx0XHRsZXQgYm9vbCA9IHYucGF0aE1haW4gPT0gcGF0aE1haW4gJiYgdi5ub3ZlbElEID09IG5vdmVsSUQ7XG5cblx0XHRyZXR1cm4gdiAmJiAhYm9vbFxuXHR9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX3JlbW92ZV9maWxlX2dpdChmaWxlOiBzdHJpbmcsIGN3ZD86IHN0cmluZylcbntcblx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpKVxuXHR7XG5cdFx0aWYgKCFjd2QpXG5cdFx0e1xuXHRcdFx0Y3dkID0gcGF0aC5kaXJuYW1lKGZpbGUpO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKGDnp7vpmaToiIrmqpTmoYggJHtmaWxlfWApO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J3JtJyxcblx0XHRcdFx0ZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblxuXHRcdGF3YWl0IGZzLnJlbW92ZShmaWxlKS5jYXRjaCh2ID0+IG51bGwpO1xuXG5cdFx0cmV0dXJuIGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpO1xuXHR9XG59XG4iXX0=