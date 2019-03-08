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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQStCO0FBQy9CLG9DQUF3RjtBQUN4RixxQ0FHcUI7QUFDckIsd0RBQTREO0FBQzVELHdDQUEwRTtBQUMxRSxzQ0FBOEM7QUFDOUMsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBb0M7QUFDcEMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBc0M7QUFDdEMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBRXJFLElBQUksQ0FBQyxpQkFBUyxDQUFDLHNCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUMzQztJQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsYUFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFcEQsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBR2pCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWpFLElBQUksRUFBRSxHQUE0QyxFQUFFLENBQUM7SUFDckQsSUFBSSxHQUFHLEdBQTRDLEVBQUUsQ0FBQztJQUV0RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFD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LENBQUMsRUFBMkMsRUFBRSxRQUFnQixFQUFFLE9BQWU7SUFFbEcsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUUzQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxJQUFJLFFBQVEsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQztRQUUxRCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQTtJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsSUFBWSxFQUFFLEdBQVk7SUFFekQsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUMzQjtRQUNDLElBQUksQ0FBQyxHQUFHLEVBQ1I7WUFDQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6QjtRQUVELGFBQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTdCLElBQ0E7WUFDQyxNQUFNLHNCQUFjLENBQUMsS0FBSyxFQUFFO2dCQUMzQixJQUFJO2dCQUNKLElBQUk7YUFDSixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHO2FBQ0gsQ0FBQyxDQUFDO1NBQ0g7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZDLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvQjtBQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTgvMDE4LlxuICovXG5cbmltcG9ydCB7IGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCB7IHByb2Nlc3NUb2MgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduT3V0cHV0LCBjcm9zc1NwYXduU3luYywgaXNHaXRSb290IH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHtcblx0R0lUX1NFVFRJTkdfRElTVF9OT1ZFTCxcblx0R0lUX1NFVFRJTkdfRVBVQixcbn0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgZ2l0X2Zha2VfYXV0aG9yIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCB7IGdldFB1c2hVcmwsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCB7IF9wYXRoLCBESVNUX05PVkVMIH0gZnJvbSAnLi4vc2NyaXB0L3NlZ21lbnQnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCB0eHRNZXJnZSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIGFzIGFycmF5VW5pcSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuXG5pZiAoIWlzR2l0Um9vdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgpKVxue1xuXHRjb25zb2xlLndhcm4oYGRpc3Rfbm92ZWwgbm90IGEgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoYHNvbWV0aGluZyB3cm9uZyB3aGVuIGNyZWF0ZSBnaXRgKTtcbn1cblxuY29uc29sZS5pbmZvKGBnaXQ6ICR7R0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRofWApO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+XG57XG5cblx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2RpZmYtbm92ZWwuanNvbicpO1xuXHRsZXQgZXB1Yl9qc29uID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2VwdWIuanNvbicpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdID0gW107XG5cdGxldCBsczI6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGxzID0gZnMucmVhZEpTT05TeW5jKGpzb25maWxlKTtcblx0fVxuXG5cdGxldCBhbGxvd1VwZGF0ZVRpbWVzdGFtcDogYm9vbGVhbiA9IHRydWU7XG5cblx0aWYgKCFmcy5leGlzdHNTeW5jKGVwdWJfanNvbikpXG5cdHtcblx0XHRsZXQgQ1dEID0gcHJvY2Vzcy5jd2QoKTtcblx0XHRjb25zdCByZXN1bHQgPSBsb2FkTWFpbkNvbmZpZyhDV0QpO1xuXG5cdFx0aWYgKHJlc3VsdC5jb25maWcuZGlzYWJsZUluaXQpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYFtFUFVCXSDlv6vlj5bmqpTmoYjkuI3lrZjlnKgg5L2G5LiN5Z+36KGM5Yid5aeL5YyW5Lu75YuZYCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLnJlZChgW0VQVUJdIOW/q+WPluaqlOahiOS4jeWtmOWcqCDmnKzmrKHlsIfln7fooYzliJ3lp4vljJbmiYDmnIkgZXB1YiDmqpTmoYhgKTtcblxuXHRcdFx0bHMyID0gYXdhaXQgUHJvbWlzZVxuXHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iKFtcblx0XHRcdFx0XHQnKi8qLyonLFxuXHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KSxcblx0XHRcdFx0XHRvbmx5RGlyZWN0b3JpZXM6IHRydWUsXG5cdFx0XHRcdFx0b25seUZpbGVzOiBmYWxzZSxcblx0XHRcdFx0fSksIGZ1bmN0aW9uIChpZDogc3RyaW5nKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IFtwYXRoTWFpbiwgbm92ZWxJRF0gPSBpZC5zcGxpdCgvW1xcXFxcXC9dLyk7XG5cblx0XHRcdFx0XHRsZXQgbnAgPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmMobnApKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4geyBwYXRoTWFpbiwgbm92ZWxJRCB9XG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cblx0XHRcdGFsbG93VXBkYXRlVGltZXN0YW1wID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxzMiA9IGZzLnJlYWRKU09OU3luYyhlcHViX2pzb24pO1xuXHR9XG5cblx0Y29uc29sZS5kZWJ1Zyhg5pys5qyh5paw5aKeICR7bHMubGVuZ3RofSAsIOS4iuasoeacquWujOaIkCAke2xzMi5sZW5ndGh9YCk7XG5cblx0Y29uc29sZS5kaXIobHMpO1xuXHRjb25zb2xlLmRpcihsczIpO1xuXG5cdGxzID0gKGxzIHx8IFtdKS5jb25jYXQobHMyIHx8IFtdKTtcblxuXHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdHJldHVybiB2XG5cdH0pO1xuXG5cdGxzID0gYXJyYXlVbmlxKGxzKTtcblxuXHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0c3BhY2VzOiAnXFx0Jyxcblx0fSk7XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblx0XHRjb25zdCBoaXN0b3J5VG9kYXkgPSBub3ZlbFN0YXRDYWNoZS5oaXN0b3J5VG9kYXkoKTtcblxuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlVGltZXN0YW1wID0gbm92ZWxTdGF0Q2FjaGUudGltZXN0YW1wO1xuXG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IF9kbyA9IGZhbHNlO1xuXG5cdFx0XHRcdGlmIChwYXRoTWFpbi5tYXRjaCgvX291dCQvKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKF9wYXRoKHBhdGhNYWluICsgJ19vdXQnLCBub3ZlbElEKSwgJ1JFQURNRS5tZCcpKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmRlYnVnKHBhdGhNYWluLCBub3ZlbElELCBfZG8pO1xuXG5cdFx0XHRcdGlmIChfZG8pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgcGF0aE1haW4pO1xuXHRcdFx0XHRcdGNvbnN0IGlucHV0UGF0aCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UucmVzb2x2ZShub3ZlbEVwdWIoe1xuXHRcdFx0XHRcdFx0XHRpbnB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHR1c2VUaXRsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHR9KSlcblx0XHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCB0eHQgPSBhd2FpdCB0eHRNZXJnZShpbnB1dFBhdGgsIG91dHB1dFBhdGgsIHJldC5iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChub3ZlbC50eHRfYmFzZW5hbWUgJiYgbm92ZWwudHh0X2Jhc2VuYW1lICE9IHR4dC5maWxlbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGgsICdvdXQnLCBub3ZlbC50eHRfYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChub3ZlbC5lcHViX2Jhc2VuYW1lICYmIG5vdmVsLmVwdWJfYmFzZW5hbWUgIT0gcmV0LmZpbGVuYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aCwgbm92ZWwuZXB1Yl9iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKHBhdGhNYWluLm1hdGNoKC9fb3V0JC8pKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHBhdGhNYWluX3NyYyA9IHBhdGhNYWluLnJlcGxhY2UoL19vdXQkLywgJycpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG91dHB1dFBhdGhfc3JjID0gcGF0aC5qb2luKEdJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aCwgcGF0aE1haW5fc3JjKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgb3V0cHV0UGF0aCA9IG91dHB1dFBhdGhfc3JjO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsIHJldC5maWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfcmVtb3ZlX2ZpbGVfZ2l0KGZpbGUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsLnR4dF9iYXNlbmFtZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0Jywgbm92ZWwudHh0X2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAobm92ZWwuZXB1Yl9iYXNlbmFtZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCBub3ZlbC5lcHViX2Jhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX3JlbW92ZV9maWxlX2dpdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRmaWxlID0gcGF0aC5qb2luKG91dHB1dFBhdGhfc3JjLCAnb3V0JywgdHh0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9yZW1vdmVfZmlsZV9naXQoZmlsZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbC50eHRfYmFzZW5hbWUgPSB0eHQuZmlsZW5hbWU7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbWV0YTogUGFydGlhbDxJTWRjb25mTWV0YT4gPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoLmpvaW4oaW5wdXRQYXRoLCAnUkVBRE1FLm1kJykpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOeVtuaykuacieWMheWQq+W/heimgeeahOWFp+WuueaZguS4jeeUoueUn+mMr+iqpFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOWFgeioseS4jeaomea6lueahCBpbmZvIOWFp+WuuVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb3dDaGVja0xldmVsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGF1dGhvcl9uYW1lOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbCAmJiBtZXRhLm5vdmVsLmF1dGhvcilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF1dGhvcl9uYW1lID0gZ2l0X2Zha2VfYXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0Jy4nLFxuXHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRjd2Q6IG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBjb21taXRfbXNnID0gYFtlcHViXSAke3BhdGhNYWlufSAke25vdmVsSUR9YDtcblxuXHRcdFx0XHRcdFx0XHRoaXN0b3J5VG9kYXkuZXB1Yi5wdXNoKFtwYXRoTWFpbiwgbm92ZWxJRF0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRhbGxvd1VwZGF0ZVRpbWVzdGFtcCAmJiAobm92ZWwuZXB1Yl9kYXRlID0gRGF0ZS5ub3coKSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHJldC5zdGF0KVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5vdmVsU3RhdENhY2hlVGltZXN0YW1wICE9IG5vdmVsLnVwZGF0ZV9kYXRlKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsLnZvbHVtZV9vbGQgPSBub3ZlbC52b2x1bWUgfCAwO1xuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlcl9vbGQgPSBub3ZlbC5jaGFwdGVyIHwgMDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWUgPSByZXQuc3RhdC52b2x1bWU7XG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlciA9IHJldC5zdGF0LmNoYXB0ZXI7XG5cblx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnICs9IGAoIHY6JHtub3ZlbC52b2x1bWV9LCBjOiR7bm92ZWwuY2hhcHRlcn0sIGFkZDoke25vdmVsLmNoYXB0ZXIgLSBub3ZlbC5jaGFwdGVyX29sZH0gKWA7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5lcHViX2Jhc2VuYW1lID0gcmV0LmZpbGVuYW1lO1xuXG5cdFx0XHRcdFx0XHRcdG5vdmVsLm5vdmVsX3N0YXR1cyA9IChtZXRhICYmIG1ldGEubm92ZWwpID8gbWV0YS5ub3ZlbC5ub3ZlbF9zdGF0dXMgOiAwO1xuXG5cdFx0XHRcdFx0XHRcdGlmICghbm92ZWwubm92ZWxfc3RhdHVzKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIG5vdmVsLm5vdmVsX3N0YXR1cztcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2cobm92ZWwpO1xuXG5cdFx0XHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdFx0XHQgKiDlr6bpqZfmgKflip/og70g5Y+v5Yip55SoIGdpdCB1c2VyIOS+humBjua/vuS9nOiAhVxuXHRcdFx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRcdFx0aWYgKGF1dGhvcl9uYW1lKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRcdGAtLWF1dGhvcj0ke2F1dGhvcl9uYW1lfWAsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbW1pdF9tc2csXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbXNnID0gZS50b1N0cmluZygpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtc2cubWF0Y2goL25vdCBhIHZhbGlkIG5vdmVsSW5mbyBkYXRhLykpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdbU0tJUF0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdbRVJST1JdJywgcGF0aE1haW4sIG5vdmVsSUQsIG1zZyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5ncmV5KGxzLmxlbmd0aCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBjb3VudCA9IGxzLmZpbHRlcih2ID0+IHYpLmxlbmd0aDtcblxuXHRcdFx0XHRjb25zb2xlLmluZm8oYOacrOasoeWFseabtOaWsCAke2NvdW50fSDlsI/oqqpgKTtcblxuXHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgd2FpdHB1c2ggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZXB1Yi53YWl0cHVzaCcpO1xuXG5cdFx0XHRcdGF3YWl0IGZzLmVuc3VyZUZpbGUod2FpdHB1c2gpO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBsczogJHtscy5sZW5ndGh9YCk7XG5cblx0XHRcdFx0ZnMub3V0cHV0SlNPTlN5bmMoZXB1Yl9qc29uLCBbXSwge1xuXHRcdFx0XHRcdHNwYWNlczogJ1xcdCcsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8qXG5cdFx0XHRcdGF3YWl0IHB1c2hHaXQoR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBnZXRQdXNoVXJsKEdJVF9TRVRUSU5HX0VQVUIudXJsKSk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKHdhaXRwdXNoKTtcblx0XHRcdFx0Ki9cblx0XHRcdH0pXG5cdFx0O1xuXHR9XG59KSgpO1xuXG5mdW5jdGlvbiBmaWx0ZXJDYWNoZShsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdLCBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcpXG57XG5cdHJldHVybiBscy5maWx0ZXIoZnVuY3Rpb24gKHYpXG5cdHtcblx0XHRsZXQgYm9vbCA9IHYucGF0aE1haW4gPT0gcGF0aE1haW4gJiYgdi5ub3ZlbElEID09IG5vdmVsSUQ7XG5cblx0XHRyZXR1cm4gdiAmJiAhYm9vbFxuXHR9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX3JlbW92ZV9maWxlX2dpdChmaWxlOiBzdHJpbmcsIGN3ZD86IHN0cmluZylcbntcblx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpKVxuXHR7XG5cdFx0aWYgKCFjd2QpXG5cdFx0e1xuXHRcdFx0Y3dkID0gcGF0aC5kaXJuYW1lKGZpbGUpO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKGDnp7vpmaToiIrmqpTmoYggJHtmaWxlfWApO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J3JtJyxcblx0XHRcdFx0ZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblxuXHRcdGF3YWl0IGZzLnJlbW92ZShmaWxlKS5jYXRjaCh2ID0+IG51bGwpO1xuXG5cdFx0cmV0dXJuIGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpO1xuXHR9XG59XG4iXX0=