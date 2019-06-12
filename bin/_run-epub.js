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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQWdDO0FBQ2hDLG9DQUF3RjtBQUN4RixxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBMEQ7QUFDMUQsc0RBQXNFO0FBQ3RFLCtCQUFnQztBQUNoQyxvQ0FBcUM7QUFDckMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBdUM7QUFDdkMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBQ3JFLDREQUFzRTtBQUl0RSxJQUFJLENBQUMsaUJBQVMsQ0FBQyxzQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFDM0M7SUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRXJFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztDQUNuRDtBQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBRXBELGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUdqQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEUsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVqRSxJQUFJLEVBQUUsR0FBNEMsRUFBRSxDQUFDO0lBQ3JELElBQUksR0FBRyxHQUE0QyxFQUFFLENBQUM7SUFFdEQsSUFBSSxFQUFFLENBQUMsVUFBVSxD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c2VyIG9uIDIwMTgvNS8xOC8wMTguXG4gKi9cblxuaW1wb3J0IHsgbG9hZE1haW5Db25maWcgfSBmcm9tICdAbm9kZS1ub3ZlbC90YXNrL2xpYi9jb25maWcnO1xuaW1wb3J0IHsgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduT3V0cHV0LCBjcm9zc1NwYXduU3luYywgaXNHaXRSb290IH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHtcblx0R0lUX1NFVFRJTkdfRElTVF9OT1ZFTCxcblx0R0lUX1NFVFRJTkdfRVBVQixcbn0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgZ2l0X2Zha2VfYXV0aG9yLCBwYXRoX2VxdWFsIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcsIHsgTUFYX1NDUklQVF9USU1FT1VUIH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBub3ZlbEVwdWIgZnJvbSAnbm92ZWwtZXB1Yic7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgeyBfcGF0aCwgRElTVF9OT1ZFTCB9IGZyb20gJy4uL3NjcmlwdC9zZWdtZW50JztcbmltcG9ydCBGYXN0R2xvYiA9IHJlcXVpcmUoJ2Zhc3QtZ2xvYicpO1xuaW1wb3J0IHR4dE1lcmdlIGZyb20gJ25vdmVsLXR4dC1tZXJnZSc7XG5pbXBvcnQgeyBhcnJheV91bmlxdWUgYXMgYXJyYXlVbmlxIH0gZnJvbSAnYXJyYXktaHlwZXItdW5pcXVlJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgbWRjb25mX3BhcnNlLCBJTWRjb25mTWV0YSwgY2hrSW5mbyB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQgeyBwYXJzZVBhdGhNYWluQmFzZSB9IGZyb20gJ0Bub2RlLW5vdmVsL2NhY2hlLWxvYWRlci9saWIvdXRpbCc7XG5pbXBvcnQgeyBDYW5jZWxsYXRpb25FcnJvciwgVGltZW91dEVycm9yIH0gZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaWYgKCFpc0dpdFJvb3QoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoKSlcbntcblx0Y29uc29sZS53YXJuKGBkaXN0X25vdmVsIG5vdCBhIGdpdDogJHtHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGh9YCk7XG5cblx0dGhyb3cgbmV3IEVycm9yKGBzb21ldGhpbmcgd3Jvbmcgd2hlbiBjcmVhdGUgZ2l0YCk7XG59XG5cbmNvbnNvbGUuaW5mbyhgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9Plxue1xuXG5cdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdkaWZmLW5vdmVsLmpzb24nKTtcblx0bGV0IGVwdWJfanNvbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLmpzb24nKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXHRsZXQgbHMyOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdHtcblx0XHRscyA9IGZzLnJlYWRKU09OU3luYyhqc29uZmlsZSk7XG5cdH1cblxuXHRsZXQgYWxsb3dVcGRhdGVUaW1lc3RhbXA6IGJvb2xlYW4gPSB0cnVlO1xuXG5cdGlmICghZnMuZXhpc3RzU3luYyhlcHViX2pzb24pKVxuXHR7XG5cdFx0bGV0IENXRCA9IHByb2Nlc3MuY3dkKCk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gbG9hZE1haW5Db25maWcoQ1dEKTtcblxuXHRcdGlmIChyZXN1bHQuY29uZmlnLmRpc2FibGVJbml0KVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGBbRVBVQl0g5b+r5Y+W5qqU5qGI5LiN5a2Y5ZyoIOS9huS4jeWft+ihjOWIneWni+WMluS7u+WLmWApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYFtFUFVCXSDlv6vlj5bmqpTmoYjkuI3lrZjlnKgg5pys5qyh5bCH5Z+36KGM5Yid5aeL5YyW5omA5pyJIGVwdWIg5qqU5qGIYCk7XG5cblx0XHRcdGxzMiA9IGF3YWl0IFByb21pc2Vcblx0XHRcdFx0Lm1hcFNlcmllcyhGYXN0R2xvYihbXG5cdFx0XHRcdFx0JyovKi8qJyxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCksXG5cdFx0XHRcdFx0b25seURpcmVjdG9yaWVzOiB0cnVlLFxuXHRcdFx0XHRcdG9ubHlGaWxlczogZmFsc2UsXG5cdFx0XHRcdH0pLCBmdW5jdGlvbiAoaWQ6IHN0cmluZylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBbcGF0aE1haW4sIG5vdmVsSURdID0gaWQuc3BsaXQoL1tcXFxcXFwvXS8pO1xuXG5cdFx0XHRcdFx0bGV0IG5wID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0aWYgKCFmcy5leGlzdHNTeW5jKG5wKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHsgcGF0aE1haW4sIG5vdmVsSUQgfVxuXHRcdFx0XHR9KVxuXHRcdFx0O1xuXG5cdFx0XHRhbGxvd1VwZGF0ZVRpbWVzdGFtcCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXHRlbHNlXG5cdHtcblx0XHRsczIgPSBmcy5yZWFkSlNPTlN5bmMoZXB1Yl9qc29uKTtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOacrOasoeaWsOWiniAke2xzLmxlbmd0aH0gLCDkuIrmrKHmnKrlrozmiJAgJHtsczIubGVuZ3RofWApO1xuXG5cdGNvbnNvbGUuZGlyKGxzKTtcblx0Y29uc29sZS5kaXIobHMyKTtcblxuXHRscyA9IChscyB8fCBbXSkuY29uY2F0KGxzMiB8fCBbXSk7XG5cblx0bHMgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdHtcblx0XHRyZXR1cm4gdlxuXHR9KTtcblxuXHRscyA9IGFycmF5VW5pcShscyk7XG5cblx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBscywge1xuXHRcdHNwYWNlczogJ1xcdCcsXG5cdH0pO1xuXG5cdGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cblx0Y29uc3QgTUFYX1NDUklQVF9USU1FT1VUX0VQVUIgPSAyICogNjAgKiAxMDAwO1xuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cdFx0Y29uc3QgaGlzdG9yeVRvZGF5ID0gbm92ZWxTdGF0Q2FjaGUuaGlzdG9yeVRvZGF5KCk7XG5cblx0XHRjb25zdCBub3ZlbFN0YXRDYWNoZVRpbWVzdGFtcCA9IG5vdmVsU3RhdENhY2hlLnRpbWVzdGFtcDtcblxuXHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zdCB7IHBhdGhNYWluLCBub3ZlbElEIH0gPSBkYXRhO1xuXG5cdFx0XHRcdGlmICgoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgPiBNQVhfU0NSSVBUX1RJTUVPVVRfRVBVQilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgeyBpc19vdXQsIHBhdGhNYWluX2Jhc2UsIHBhdGhNYWluX291dCB9ID0gcGFyc2VQYXRoTWFpbkJhc2UocGF0aE1haW4pO1xuXG5cdFx0XHRcdGxldCBfZG8gPSBmYWxzZTtcblxuXHRcdFx0XHRpZiAoaXNfb3V0KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oX3BhdGgocGF0aE1haW5fb3V0LCBub3ZlbElEKSwgJ1JFQURNRS5tZCcpKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmRlYnVnKHBhdGhNYWluLCBub3ZlbElELCBfZG8pO1xuXG5cdFx0XHRcdGlmIChfZG8pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgcGF0aE1haW5fYmFzZSk7XG5cdFx0XHRcdFx0Y29uc3QgaW5wdXRQYXRoID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5yZXNvbHZlKG5vdmVsRXB1Yih7XG5cdFx0XHRcdFx0XHRcdGlucHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0b3V0cHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0cGFkRW5kRGF0ZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdHVzZVRpdGxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZUxvY2FsOiBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRub0xvZzogdHJ1ZSxcblx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHR4dCA9IGF3YWl0IHR4dE1lcmdlKGlucHV0UGF0aCwgb3V0cHV0UGF0aCwgcmV0LmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZnVsbHBhdGggPSByZXQuZmlsZTtcblx0XHRcdFx0XHRcdFx0bGV0IHR4dF9mdWxscGF0aCA9IHR4dC5mdWxscGF0aDtcblxuXHRcdFx0XHRcdFx0XHRpZiAobm92ZWwudHh0X2Jhc2VuYW1lICYmIG5vdmVsLnR4dF9iYXNlbmFtZSAhPSB0eHQuZmlsZW5hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoLCAnb3V0Jywgbm92ZWwudHh0X2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCB0eHRfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLmVwdWJfYmFzZW5hbWUgJiYgbm92ZWwuZXB1Yl9iYXNlbmFtZSAhPSByZXQuZmlsZW5hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBub3ZlbC5lcHViX2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCBlcHViX2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChpc19vdXQpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcGF0aE1haW5fc3JjID0gcGF0aE1haW5fYmFzZTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBvdXRwdXRQYXRoX3NyYyA9IHBhdGguam9pbihHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIHBhdGhNYWluX3NyYyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IG91dHB1dFBhdGggPSBvdXRwdXRQYXRoX3NyYztcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCByZXQuZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIGVwdWJfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLnR4dF9iYXNlbmFtZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0Jywgbm92ZWwudHh0X2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFwYXRoX2VxdWFsKGZpbGUsIHR4dF9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLmVwdWJfYmFzZW5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgbm92ZWwuZXB1Yl9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCBlcHViX2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0JywgdHh0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCB0eHRfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwudHh0X2Jhc2VuYW1lID0gdHh0LmZpbGVuYW1lO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IG1ldGE6IFBhcnRpYWw8SU1kY29uZk1ldGE+ID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKGlucHV0UGF0aCwgJ1JFQURNRS5tZCcpKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDnlbbmspLmnInljIXlkKvlv4XopoHnmoTlhaflrrnmmYLkuI3nlKLnlJ/pjK/oqqRcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDlhYHoqLHkuI3mqJnmupbnmoQgaW5mbyDlhaflrrlcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdGxldCBhdXRob3JfbmFtZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtZXRhICYmIG1ldGEubm92ZWwgJiYgbWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhdXRob3JfbmFtZSA9IGdpdF9mYWtlX2F1dGhvcihtZXRhLm5vdmVsLmF1dGhvcik7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0XHRcdCcuJyxcblx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0Y3dkOiBvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgY29tbWl0X21zZyA9IGBbZXB1Yl0gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWA7XG5cblx0XHRcdFx0XHRcdFx0YWxsb3dVcGRhdGVUaW1lc3RhbXAgJiYgaGlzdG9yeVRvZGF5LmVwdWIucHVzaChbcGF0aE1haW4sIG5vdmVsSURdKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0YWxsb3dVcGRhdGVUaW1lc3RhbXAgJiYgKG5vdmVsLmVwdWJfZGF0ZSA9IERhdGUubm93KCkpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChyZXQuc3RhdClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbFN0YXRDYWNoZVRpbWVzdGFtcCAhPSBub3ZlbC51cGRhdGVfZGF0ZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWVfb2xkID0gbm92ZWwudm9sdW1lIHwgMDtcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXJfb2xkID0gbm92ZWwuY2hhcHRlciB8IDA7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwudm9sdW1lID0gcmV0LnN0YXQudm9sdW1lO1xuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXIgPSByZXQuc3RhdC5jaGFwdGVyO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyArPSBgKCB2OiR7bm92ZWwudm9sdW1lfSwgYzoke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6JHtub3ZlbC5jaGFwdGVyIC0gbm92ZWwuY2hhcHRlcl9vbGR9IClgO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwuZXB1Yl9iYXNlbmFtZSA9IHJldC5maWxlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5ub3ZlbF9zdGF0dXMgPSAobWV0YSAmJiBtZXRhLm5vdmVsKSA/IG1ldGEubm92ZWwubm92ZWxfc3RhdHVzIDogMDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW5vdmVsLm5vdmVsX3N0YXR1cylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBub3ZlbC5ub3ZlbF9zdGF0dXM7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5vdmVsKTtcblxuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICog5a+m6amX5oCn5Yqf6IO9IOWPr+WIqeeUqCBnaXQgdXNlciDkvobpgY7mv77kvZzogIVcblx0XHRcdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0XHRcdGlmIChhdXRob3JfbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbW1pdF9tc2csXG5cdFx0XHRcdFx0XHRcdFx0XHRgLS1hdXRob3I9JHthdXRob3JfbmFtZX1gLFxuXHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCxcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnLFxuXHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCxcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBscywge1xuXHRcdFx0XHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IG1zZyA9IGUudG9TdHJpbmcoKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAobXNnLm1hdGNoKC9ub3QgYSB2YWxpZCBub3ZlbEluZm8gZGF0YS8pKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignW1NLSVBdJywgcGF0aE1haW4sIG5vdmVsSUQsIG1zZyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignW0VSUk9SXScsIHBhdGhNYWluLCBub3ZlbElELCBtc2cpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuZ3JleShscy5sZW5ndGgsIHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgX2NvdW50ID0ge1xuXHRcdFx0XHRcdGRvbmU6IDAsXG5cdFx0XHRcdFx0Y2FuY2VsOiAwLFxuXHRcdFx0XHRcdGlnbm9yZTogMCxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRsZXQgY291bnQgPSBscy5maWx0ZXIodiA9PiB7XG5cblx0XHRcdFx0XHRpZiAodilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfY291bnQuZG9uZSsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICh2ID09IG51bGwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0X2NvdW50LmNhbmNlbCsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0X2NvdW50Lmlnbm9yZSsrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB2O1xuXHRcdFx0XHR9KS5sZW5ndGg7XG5cblx0XHRcdFx0Y29uc29sZS5pbmZvKGDmnKzmrKHlhbHmm7TmlrAgJHtfY291bnQuZG9uZX0g5bCP6KqqYCwgYOWPlua2iCB4ICR7X2NvdW50LmNhbmNlbH1gLCBg5b+955WlIHggJHtfY291bnQuaWdub3JlfWApO1xuXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZSh3YWl0cHVzaCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYGxzOiAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIFtdLCB7XG5cdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0YXdhaXQgcHVzaEdpdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIGdldFB1c2hVcmwoR0lUX1NFVFRJTkdfRVBVQi51cmwpKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUod2FpdHB1c2gpO1xuXHRcdFx0XHQqL1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGZpbHRlckNhY2hlKGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10sIHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZylcbntcblx0cmV0dXJuIGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdGxldCBib29sID0gdi5wYXRoTWFpbiA9PSBwYXRoTWFpbiAmJiB2Lm5vdmVsSUQgPT0gbm92ZWxJRDtcblxuXHRcdHJldHVybiB2ICYmICFib29sXG5cdH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGU6IHN0cmluZywgY3dkPzogc3RyaW5nKVxue1xuXHRpZiAoZnMucGF0aEV4aXN0c1N5bmMoZmlsZSkpXG5cdHtcblx0XHRpZiAoIWN3ZClcblx0XHR7XG5cdFx0XHRjd2QgPSBwYXRoLmRpcm5hbWUoZmlsZSk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coYOenu+mZpOiIiuaqlOahiCAke2ZpbGV9YCk7XG5cblx0XHR0cnlcblx0XHR7XG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncm0nLFxuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2QsXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXG5cdFx0YXdhaXQgZnMucmVtb3ZlKGZpbGUpLmNhdGNoKHYgPT4gbnVsbCk7XG5cblx0XHRyZXR1cm4gZnMucGF0aEV4aXN0c1N5bmMoZmlsZSk7XG5cdH1cbn1cbiJdfQ==