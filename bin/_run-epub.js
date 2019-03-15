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
    if (ls && ls.length) {
        const novelStatCache = novel_stat_1.getNovelStatCache();
        const historyToday = novelStatCache.historyToday();
        const novelStatCacheTimestamp = novelStatCache.timestamp;
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQWdDO0FBQ2hDLG9DQUF3RjtBQUN4RixxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBMEQ7QUFDMUQsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBcUM7QUFDckMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBdUM7QUFDdkMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBQ3JFLDREQUFzRTtBQUV0RSxJQUFJLENBQUMsaUJBQVMsQ0FBQyxzQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFDM0M7SUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRXJFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztDQUNuRDtBQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxzQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBRXBELGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUdqQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEUsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVqRSxJQUFJLEVBQUUsR0FBNEMsRUFBRSxDQUFDO0lBQ3JELElBQUksR0FBRyxHQUE0QyxFQUFFLENBQUM7SUFFdEQsSUFBSSxFQUFFLENBQUMsVUFBVSxD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QyxNQUFNLHNCQUFjLENBQUMsS0FBSyxFQUFFO2dCQUMzQixJQUFJO2dCQUNKLElBQUk7YUFDSixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHO2FBQ0gsQ0FBQyxDQUFDO1NBQ0g7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZDLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvQjtBQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTgvMDE4LlxuICovXG5cbmltcG9ydCB7IGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCB7IHByb2Nlc3NUb2MgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3bk91dHB1dCwgY3Jvc3NTcGF3blN5bmMsIGlzR2l0Um9vdCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7XG5cdEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsXG5cdEdJVF9TRVRUSU5HX0VQVUIsXG59IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IGdpdF9mYWtlX2F1dGhvciwgcGF0aF9lcXVhbCB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgbm92ZWxFcHViIGZyb20gJ25vdmVsLWVwdWInO1xuaW1wb3J0IHsgZ2V0UHVzaFVybCwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuaW1wb3J0IHsgX3BhdGgsIERJU1RfTk9WRUwgfSBmcm9tICcuLi9zY3JpcHQvc2VnbWVudCc7XG5pbXBvcnQgRmFzdEdsb2IgPSByZXF1aXJlKCdmYXN0LWdsb2InKTtcbmltcG9ydCB0eHRNZXJnZSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIGFzIGFycmF5VW5pcSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgcGFyc2VQYXRoTWFpbkJhc2UgfSBmcm9tICdAbm9kZS1ub3ZlbC9jYWNoZS1sb2FkZXIvbGliL3V0aWwnO1xuXG5pZiAoIWlzR2l0Um9vdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgpKVxue1xuXHRjb25zb2xlLndhcm4oYGRpc3Rfbm92ZWwgbm90IGEgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoYHNvbWV0aGluZyB3cm9uZyB3aGVuIGNyZWF0ZSBnaXRgKTtcbn1cblxuY29uc29sZS5pbmZvKGBnaXQ6ICR7R0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRofWApO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+XG57XG5cblx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2RpZmYtbm92ZWwuanNvbicpO1xuXHRsZXQgZXB1Yl9qc29uID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2VwdWIuanNvbicpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdID0gW107XG5cdGxldCBsczI6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGxzID0gZnMucmVhZEpTT05TeW5jKGpzb25maWxlKTtcblx0fVxuXG5cdGxldCBhbGxvd1VwZGF0ZVRpbWVzdGFtcDogYm9vbGVhbiA9IHRydWU7XG5cblx0aWYgKCFmcy5leGlzdHNTeW5jKGVwdWJfanNvbikpXG5cdHtcblx0XHRsZXQgQ1dEID0gcHJvY2Vzcy5jd2QoKTtcblx0XHRjb25zdCByZXN1bHQgPSBsb2FkTWFpbkNvbmZpZyhDV0QpO1xuXG5cdFx0aWYgKHJlc3VsdC5jb25maWcuZGlzYWJsZUluaXQpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYFtFUFVCXSDlv6vlj5bmqpTmoYjkuI3lrZjlnKgg5L2G5LiN5Z+36KGM5Yid5aeL5YyW5Lu75YuZYCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDmnKzmrKHlsIfln7fooYzliJ3lp4vljJbmiYDmnIkgZXB1YiDmqpTmoYhgKTtcblxuXHRcdFx0bHMyID0gYXdhaXQgUHJvbWlzZVxuXHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iKFtcblx0XHRcdFx0XHQnKi8qLyonLFxuXHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KSxcblx0XHRcdFx0XHRvbmx5RGlyZWN0b3JpZXM6IHRydWUsXG5cdFx0XHRcdFx0b25seUZpbGVzOiBmYWxzZSxcblx0XHRcdFx0fSksIGZ1bmN0aW9uIChpZDogc3RyaW5nKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IFtwYXRoTWFpbiwgbm92ZWxJRF0gPSBpZC5zcGxpdCgvW1xcXFxcXC9dLyk7XG5cblx0XHRcdFx0XHRsZXQgbnAgPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmMobnApKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4geyBwYXRoTWFpbiwgbm92ZWxJRCB9XG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cblx0XHRcdGFsbG93VXBkYXRlVGltZXN0YW1wID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxzMiA9IGZzLnJlYWRKU09OU3luYyhlcHViX2pzb24pO1xuXHR9XG5cblx0Y29uc29sZS5kZWJ1Zyhg5pys5qyh5paw5aKeICR7bHMubGVuZ3RofSAsIOS4iuasoeacquWujOaIkCAke2xzMi5sZW5ndGh9YCk7XG5cblx0Y29uc29sZS5kaXIobHMpO1xuXHRjb25zb2xlLmRpcihsczIpO1xuXG5cdGxzID0gKGxzIHx8IFtdKS5jb25jYXQobHMyIHx8IFtdKTtcblxuXHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdHJldHVybiB2XG5cdH0pO1xuXG5cdGxzID0gYXJyYXlVbmlxKGxzKTtcblxuXHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0c3BhY2VzOiAnXFx0Jyxcblx0fSk7XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblx0XHRjb25zdCBoaXN0b3J5VG9kYXkgPSBub3ZlbFN0YXRDYWNoZS5oaXN0b3J5VG9kYXkoKTtcblxuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlVGltZXN0YW1wID0gbm92ZWxTdGF0Q2FjaGUudGltZXN0YW1wO1xuXG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IHsgaXNfb3V0LCBwYXRoTWFpbl9iYXNlLCBwYXRoTWFpbl9vdXQgfSA9IHBhcnNlUGF0aE1haW5CYXNlKHBhdGhNYWluKTtcblxuXHRcdFx0XHRsZXQgX2RvID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKGlzX291dClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKF9wYXRoKHBhdGhNYWluX291dCwgbm92ZWxJRCksICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc29sZS5kZWJ1ZyhwYXRoTWFpbiwgbm92ZWxJRCwgX2RvKTtcblxuXHRcdFx0XHRpZiAoX2RvKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIHBhdGhNYWluX2Jhc2UpO1xuXHRcdFx0XHRcdGNvbnN0IGlucHV0UGF0aCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UucmVzb2x2ZShub3ZlbEVwdWIoe1xuXHRcdFx0XHRcdFx0XHRpbnB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHR1c2VUaXRsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHR9KSlcblx0XHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCB0eHQgPSBhd2FpdCB0eHRNZXJnZShpbnB1dFBhdGgsIG91dHB1dFBhdGgsIHJldC5iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBlcHViX2Z1bGxwYXRoID0gcmV0LmZpbGU7XG5cdFx0XHRcdFx0XHRcdGxldCB0eHRfZnVsbHBhdGggPSB0eHQuZnVsbHBhdGg7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLnR4dF9iYXNlbmFtZSAmJiBub3ZlbC50eHRfYmFzZW5hbWUgIT0gdHh0LmZpbGVuYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aCwgJ291dCcsIG5vdmVsLnR4dF9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhdGhfZXF1YWwoZmlsZSwgdHh0X2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChub3ZlbC5lcHViX2Jhc2VuYW1lICYmIG5vdmVsLmVwdWJfYmFzZW5hbWUgIT0gcmV0LmZpbGVuYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aCwgbm92ZWwuZXB1Yl9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhdGhfZXF1YWwoZmlsZSwgZXB1Yl9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAoaXNfb3V0KVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHBhdGhNYWluX3NyYyA9IHBhdGhNYWluX2Jhc2U7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgb3V0cHV0UGF0aF9zcmMgPSBwYXRoLmpvaW4oR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBwYXRoTWFpbl9zcmMpO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBvdXRwdXRQYXRoID0gb3V0cHV0UGF0aF9zcmM7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgcmV0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCBlcHViX2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbC50eHRfYmFzZW5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgJ291dCcsIG5vdmVsLnR4dF9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmICghcGF0aF9lcXVhbChmaWxlLCB0eHRfZnVsbHBhdGgpKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGlmIChub3ZlbC5lcHViX2Jhc2VuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsIG5vdmVsLmVwdWJfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhdGhfZXF1YWwoZmlsZSwgZXB1Yl9mdWxscGF0aCkpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0ZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgJ291dCcsIHR4dC5maWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhdGhfZXF1YWwoZmlsZSwgdHh0X2Z1bGxwYXRoKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLnR4dF9iYXNlbmFtZSA9IHR4dC5maWxlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBtZXRhOiBQYXJ0aWFsPElNZGNvbmZNZXRhPiA9IGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbihpbnB1dFBhdGgsICdSRUFETUUubWQnKSlcblx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAoZGF0YSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbWRjb25mX3BhcnNlKGRhdGEsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g55W25rKS5pyJ5YyF5ZCr5b+F6KaB55qE5YWn5a655pmC5LiN55Si55Sf6Yyv6KqkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g5YWB6Kix5LiN5qiZ5rqW55qEIGluZm8g5YWn5a65XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxvd0NoZWNrTGV2ZWw6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRsZXQgYXV0aG9yX25hbWU6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0XHRpZiAobWV0YSAmJiBtZXRhLm5vdmVsICYmIG1ldGEubm92ZWwuYXV0aG9yKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0YXV0aG9yX25hbWUgPSBnaXRfZmFrZV9hdXRob3IobWV0YS5ub3ZlbC5hdXRob3IpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdFx0XHQnLicsXG5cdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdGN3ZDogb3V0cHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGNvbW1pdF9tc2cgPSBgW2VwdWJdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gO1xuXG5cdFx0XHRcdFx0XHRcdGFsbG93VXBkYXRlVGltZXN0YW1wICYmIGhpc3RvcnlUb2RheS5lcHViLnB1c2goW3BhdGhNYWluLCBub3ZlbElEXSk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGFsbG93VXBkYXRlVGltZXN0YW1wICYmIChub3ZlbC5lcHViX2RhdGUgPSBEYXRlLm5vdygpKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAocmV0LnN0YXQpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpZiAobm92ZWxTdGF0Q2FjaGVUaW1lc3RhbXAgIT0gbm92ZWwudXBkYXRlX2RhdGUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWwudm9sdW1lX29sZCA9IG5vdmVsLnZvbHVtZSB8IDA7XG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbC5jaGFwdGVyX29sZCA9IG5vdmVsLmNoYXB0ZXIgfCAwO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLnZvbHVtZSA9IHJldC5zdGF0LnZvbHVtZTtcblx0XHRcdFx0XHRcdFx0XHRub3ZlbC5jaGFwdGVyID0gcmV0LnN0YXQuY2hhcHRlcjtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbW1pdF9tc2cgKz0gYCggdjoke25vdmVsLnZvbHVtZX0sIGM6JHtub3ZlbC5jaGFwdGVyfSwgYWRkOiR7bm92ZWwuY2hhcHRlciAtIG5vdmVsLmNoYXB0ZXJfb2xkfSApYDtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLmVwdWJfYmFzZW5hbWUgPSByZXQuZmlsZW5hbWU7XG5cblx0XHRcdFx0XHRcdFx0bm92ZWwubm92ZWxfc3RhdHVzID0gKG1ldGEgJiYgbWV0YS5ub3ZlbCkgPyBtZXRhLm5vdmVsLm5vdmVsX3N0YXR1cyA6IDA7XG5cblx0XHRcdFx0XHRcdFx0aWYgKCFub3ZlbC5ub3ZlbF9zdGF0dXMpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRkZWxldGUgbm92ZWwubm92ZWxfc3RhdHVzO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUubWRjb25mX3NldChwYXRoTWFpbiwgbm92ZWxJRCwgbWV0YSk7XG5cblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhub3ZlbCk7XG5cblx0XHRcdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0XHRcdCAqIOWvpumpl+aAp+WKn+iDvSDlj6/liKnnlKggZ2l0IHVzZXIg5L6G6YGO5r++5L2c6ICFXG5cdFx0XHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdFx0XHRpZiAoYXV0aG9yX25hbWUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnLFxuXHRcdFx0XHRcdFx0XHRcdFx0YC0tYXV0aG9yPSR7YXV0aG9yX25hbWV9YCxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgbHMsIHtcblx0XHRcdFx0XHRcdFx0XHRzcGFjZXM6ICdcXHQnLFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBtc2cgPSBlLnRvU3RyaW5nKCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1zZy5tYXRjaCgvbm90IGEgdmFsaWQgbm92ZWxJbmZvIGRhdGEvKSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tTS0lQXScsIHBhdGhNYWluLCBub3ZlbElELCBtc2cpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tFUlJPUl0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmdyZXkobHMubGVuZ3RoLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0bGV0IGNvdW50ID0gbHMuZmlsdGVyKHYgPT4gdikubGVuZ3RoO1xuXG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5YWx5pu05pawICR7Y291bnR9IOWwj+iqqmApO1xuXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZSh3YWl0cHVzaCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYGxzOiAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIFtdLCB7XG5cdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0YXdhaXQgcHVzaEdpdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIGdldFB1c2hVcmwoR0lUX1NFVFRJTkdfRVBVQi51cmwpKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUod2FpdHB1c2gpO1xuXHRcdFx0XHQqL1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGZpbHRlckNhY2hlKGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10sIHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZylcbntcblx0cmV0dXJuIGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdGxldCBib29sID0gdi5wYXRoTWFpbiA9PSBwYXRoTWFpbiAmJiB2Lm5vdmVsSUQgPT0gbm92ZWxJRDtcblxuXHRcdHJldHVybiB2ICYmICFib29sXG5cdH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGU6IHN0cmluZywgY3dkPzogc3RyaW5nKVxue1xuXHRpZiAoZnMucGF0aEV4aXN0c1N5bmMoZmlsZSkpXG5cdHtcblx0XHRpZiAoIWN3ZClcblx0XHR7XG5cdFx0XHRjd2QgPSBwYXRoLmRpcm5hbWUoZmlsZSk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coYOenu+mZpOiIiuaqlOahiCAke2ZpbGV9YCk7XG5cblx0XHR0cnlcblx0XHR7XG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncm0nLFxuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2QsXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXG5cdFx0YXdhaXQgZnMucmVtb3ZlKGZpbGUpLmNhdGNoKHYgPT4gbnVsbCk7XG5cblx0XHRyZXR1cm4gZnMucGF0aEV4aXN0c1N5bmMoZmlsZSk7XG5cdH1cbn1cbiJdfQ==