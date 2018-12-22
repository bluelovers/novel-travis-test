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
                    novel.novel_status = (meta && meta.novel) ? meta.novel.novel_status : 0;
                    if (!novel.novel_status) {
                        delete novel.novel_status;
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi1lcHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi1lcHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx3REFBNkQ7QUFFN0QsK0JBQStCO0FBQy9CLG9DQUF1RTtBQUN2RSxxQ0FHcUI7QUFDckIsd0RBQTRFO0FBQzVFLHdDQUEwRTtBQUMxRSxzQ0FBOEM7QUFDOUMsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBb0M7QUFDcEMsMkNBQW1DO0FBRW5DLCtDQUFzRDtBQUN0RCxzQ0FBc0M7QUFDdEMscURBQXVDO0FBQ3ZDLDJEQUErRDtBQUMvRCxvQ0FBaUM7QUFDakMscURBQXFFO0FBRXJFLElBQUksQ0FBQyxpQkFBUyxDQUFDLHNCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUMzQztJQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsYUFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLHNCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFcEQsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBR2pCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWpFLElBQUksRUFBRSxHQUE0QyxFQUFFLENBQUM7SUFDckQsSUFBSSxHQUFHLEdBQTRDLEVBQUUsQ0FBQztJQUV0RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFD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RyxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFaEMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFO2dCQUNoQyxNQUFNLEVBQUUsSUFBSTthQUNaLENBQUMsQ0FBQztZQUVIOzs7O2NBSUU7UUFDSCxDQUFDLENBQUMsQ0FDRjtLQUNEO0FBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUVMLFNBQVMsV0FBVyxDQUFDLEVBQTJDLEVBQUUsUUFBZ0IsRUFBRSxPQUFlO0lBRWxHLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFFM0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUM7UUFFMUQsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC81LzE4LzAxOC5cbiAqL1xuXG5pbXBvcnQgeyBsb2FkTWFpbkNvbmZpZyB9IGZyb20gJ0Bub2RlLW5vdmVsL3Rhc2svbGliL2NvbmZpZyc7XG5pbXBvcnQgeyBwcm9jZXNzVG9jIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNyb3NzU3Bhd25PdXRwdXQsIGNyb3NzU3Bhd25TeW5jLCBpc0dpdFJvb3QgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQge1xuXHRHSVRfU0VUVElOR19ESVNUX05PVkVMLFxuXHRHSVRfU0VUVElOR19FUFVCLFxufSBmcm9tICcuLi9kYXRhL2dpdCc7XG5pbXBvcnQgeyBOb3ZlbFN0YXRDYWNoZSwgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgZ2l0X2Zha2VfYXV0aG9yIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCB7IGdldFB1c2hVcmwsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCB7IF9wYXRoLCBESVNUX05PVkVMIH0gZnJvbSAnLi4vc2NyaXB0L3NlZ21lbnQnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCB0eHRNZXJnZSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIGFzIGFycmF5VW5pcSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuXG5pZiAoIWlzR2l0Um9vdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgpKVxue1xuXHRjb25zb2xlLndhcm4oYGRpc3Rfbm92ZWwgbm90IGEgZ2l0OiAke0dJVF9TRVRUSU5HX0VQVUIudGFyZ2V0UGF0aH1gKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoYHNvbWV0aGluZyB3cm9uZyB3aGVuIGNyZWF0ZSBnaXRgKTtcbn1cblxuY29uc29sZS5pbmZvKGBnaXQ6ICR7R0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRofWApO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+XG57XG5cblx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2RpZmYtbm92ZWwuanNvbicpO1xuXHRsZXQgZXB1Yl9qc29uID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2VwdWIuanNvbicpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdID0gW107XG5cdGxldCBsczI6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXSA9IFtdO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGxzID0gZnMucmVhZEpTT05TeW5jKGpzb25maWxlKTtcblx0fVxuXG5cdGlmICghZnMuZXhpc3RzU3luYyhlcHViX2pzb24pKVxuXHR7XG5cdFx0bGV0IENXRCA9IHByb2Nlc3MuY3dkKCk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gbG9hZE1haW5Db25maWcoQ1dEKTtcblxuXHRcdGlmIChyZXN1bHQuY29uZmlnLmRpc2FibGVJbml0KVxuXHRcdHtcblx0XHRcdGNvbnNvbGUucmVkKGBbRVBVQl0g5b+r5Y+W5qqU5qGI5LiN5a2Y5ZyoIOS9huS4jeWft+ihjOWIneWni+WMluS7u+WLmWApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYFtFUFVCXSDlv6vlj5bmqpTmoYjkuI3lrZjlnKgg5pys5qyh5bCH5Z+36KGM5Yid5aeL5YyW5omA5pyJIGVwdWIg5qqU5qGIYCk7XG5cblx0XHRcdGxzMiA9IGF3YWl0IFByb21pc2Vcblx0XHRcdFx0Lm1hcFNlcmllcyhGYXN0R2xvYihbXG5cdFx0XHRcdFx0JyovKi8qJyxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCksXG5cdFx0XHRcdFx0b25seURpcmVjdG9yaWVzOiB0cnVlLFxuXHRcdFx0XHRcdG9ubHlGaWxlczogZmFsc2UsXG5cdFx0XHRcdH0pLCBmdW5jdGlvbiAoaWQ6IHN0cmluZylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBbcGF0aE1haW4sIG5vdmVsSURdID0gaWQuc3BsaXQoL1tcXFxcXFwvXS8pO1xuXG5cdFx0XHRcdFx0bGV0IG5wID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0aWYgKCFmcy5leGlzdHNTeW5jKG5wKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHsgcGF0aE1haW4sIG5vdmVsSUQgfVxuXHRcdFx0XHR9KVxuXHRcdFx0O1xuXHRcdH1cblx0fVxuXHRlbHNlXG5cdHtcblx0XHRsczIgPSBmcy5yZWFkSlNPTlN5bmMoZXB1Yl9qc29uKTtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOacrOasoeaWsOWiniAke2xzLmxlbmd0aH0gLCDkuIrmrKHmnKrlrozmiJAgJHtsczIubGVuZ3RofWApO1xuXG5cdGxzID0gKGxzIHx8IFtdKS5jb25jYXQobHMyIHx8IFtdKTtcblxuXHRscyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdHJldHVybiB2XG5cdH0pO1xuXG5cdGxzID0gYXJyYXlVbmlxKGxzKTtcblxuXHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIGxzLCB7XG5cdFx0c3BhY2VzOiAnXFx0Jyxcblx0fSk7XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblx0XHRjb25zdCBoaXN0b3J5VG9kYXkgPSBub3ZlbFN0YXRDYWNoZS5oaXN0b3J5VG9kYXkoKTtcblxuXHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zdCB7IHBhdGhNYWluLCBub3ZlbElEIH0gPSBkYXRhO1xuXG5cdFx0XHRcdGxldCBfZG8gPSBmYWxzZTtcblxuXHRcdFx0XHRpZiAocGF0aE1haW4ubWF0Y2goL19vdXQkLykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguam9pbihfcGF0aChwYXRoTWFpbiArICdfb3V0Jywgbm92ZWxJRCksICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKF9kbylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBwYXRoTWFpbik7XG5cdFx0XHRcdFx0Y29uc3QgaW5wdXRQYXRoID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5yZXNvbHZlKG5vdmVsRXB1Yih7XG5cdFx0XHRcdFx0XHRcdGlucHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0b3V0cHV0UGF0aCxcblx0XHRcdFx0XHRcdFx0cGFkRW5kRGF0ZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdHVzZVRpdGxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZUxvY2FsOiBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRub0xvZzogdHJ1ZSxcblx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHR4dCA9IGF3YWl0IHR4dE1lcmdlKGlucHV0UGF0aCwgb3V0cHV0UGF0aCwgcmV0LmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAocGF0aE1haW4ubWF0Y2goL19vdXQkLykpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcGF0aE1haW5fc3JjID0gcGF0aE1haW4ucmVwbGFjZSgvX291dCQvLCAnJyk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgb3V0cHV0UGF0aF9zcmMgPSBwYXRoLmpvaW4oR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLCBwYXRoTWFpbl9zcmMpO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBvdXRwdXRQYXRoID0gb3V0cHV0UGF0aF9zcmM7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihvdXRwdXRQYXRoX3NyYywgcmV0LmZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKGZpbGUpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHRyeVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCdybScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBvdXRwdXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdGNhdGNoIChlKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGZzLnJlbW92ZShmaWxlKS5jYXRjaCh2ID0+IG51bGwpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGZpbGUgPSBwYXRoLmpvaW4ob3V0cHV0UGF0aF9zcmMsICdvdXQnLCB0eHQuZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMoZmlsZSkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0dHJ5XG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0J3JtJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0Y2F0Y2ggKGUpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKGZpbGUpLmNhdGNoKHYgPT4gbnVsbCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocmV0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgbWV0YTogUGFydGlhbDxJTWRjb25mTWV0YT4gPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoLmpvaW4oaW5wdXRQYXRoLCAnUkVBRE1FLm1kJykpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOeVtuaykuacieWMheWQq+W/heimgeeahOWFp+WuueaZguS4jeeUoueUn+mMr+iqpFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOWFgeioseS4jeaomea6lueahCBpbmZvIOWFp+WuuVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb3dDaGVja0xldmVsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGF1dGhvcl9uYW1lOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbCAmJiBtZXRhLm5vdmVsLmF1dGhvcilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF1dGhvcl9uYW1lID0gZ2l0X2Zha2VfYXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0Jy4nLFxuXHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRjd2Q6IG91dHB1dFBhdGgsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBjb21taXRfbXNnID0gYFtlcHViXSAke3BhdGhNYWlufSAke25vdmVsSUR9YDtcblxuXHRcdFx0XHRcdFx0XHRoaXN0b3J5VG9kYXkuZXB1Yi5wdXNoKFtwYXRoTWFpbiwgbm92ZWxJRF0pO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5lcHViX2RhdGUgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChyZXQuc3RhdClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLnZvbHVtZV9vbGQgPSBub3ZlbC52b2x1bWUgfCAwO1xuXHRcdFx0XHRcdFx0XHRcdG5vdmVsLmNoYXB0ZXJfb2xkID0gbm92ZWwuY2hhcHRlciB8IDA7XG5cblx0XHRcdFx0XHRcdFx0XHRub3ZlbC52b2x1bWUgPSByZXQuc3RhdC52b2x1bWU7XG5cdFx0XHRcdFx0XHRcdFx0bm92ZWwuY2hhcHRlciA9IHJldC5zdGF0LmNoYXB0ZXI7XG5cblx0XHRcdFx0XHRcdFx0XHRjb21taXRfbXNnICs9IGAoIHY6JHtub3ZlbC52b2x1bWV9LCBjOiR7bm92ZWwuY2hhcHRlcn0sIGFkZDoke25vdmVsLmNoYXB0ZXIgLSBub3ZlbC5jaGFwdGVyX29sZH0gKWA7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRub3ZlbC5ub3ZlbF9zdGF0dXMgPSAobWV0YSAmJiBtZXRhLm5vdmVsKSA/IG1ldGEubm92ZWwubm92ZWxfc3RhdHVzIDogMDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW5vdmVsLm5vdmVsX3N0YXR1cylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBub3ZlbC5ub3ZlbF9zdGF0dXM7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5vdmVsKTtcblxuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICog5a+m6amX5oCn5Yqf6IO9IOWPr+WIqeeUqCBnaXQgdXNlciDkvobpgY7mv77kvZzogIVcblx0XHRcdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0XHRcdGlmIChhdXRob3JfbmFtZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRcdGAtLWF1dGhvcj0ke2F1dGhvcl9uYW1lfWAsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogR0lUX1NFVFRJTkdfRVBVQi50YXJnZXRQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbWl0X21zZyxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bHMgPSBmaWx0ZXJDYWNoZShscywgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0XHRcdGZzLm91dHB1dEpTT05TeW5jKGVwdWJfanNvbiwgbHMsIHtcblx0XHRcdFx0XHRcdFx0XHRzcGFjZXM6ICdcXHQnLFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBtc2cgPSBlLnRvU3RyaW5nKCk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1zZy5tYXRjaCgvbm90IGEgdmFsaWQgbm92ZWxJbmZvIGRhdGEvKSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxzID0gZmlsdGVyQ2FjaGUobHMsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tTS0lQXScsIHBhdGhNYWluLCBub3ZlbElELCBtc2cpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tFUlJPUl0nLCBwYXRoTWFpbiwgbm92ZWxJRCwgbXNnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRscyA9IGZpbHRlckNhY2hlKGxzLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmdyZXkobHMubGVuZ3RoLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0bGV0IGNvdW50ID0gbHMuZmlsdGVyKHYgPT4gdikubGVuZ3RoO1xuXG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5YWx5pu05pawICR7Y291bnR9IOWwj+iqqmApO1xuXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZSh3YWl0cHVzaCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYGxzOiAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0XHRmcy5vdXRwdXRKU09OU3luYyhlcHViX2pzb24sIFtdLCB7XG5cdFx0XHRcdFx0c3BhY2VzOiAnXFx0Jyxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0YXdhaXQgcHVzaEdpdChHSVRfU0VUVElOR19FUFVCLnRhcmdldFBhdGgsIGdldFB1c2hVcmwoR0lUX1NFVFRJTkdfRVBVQi51cmwpKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUod2FpdHB1c2gpO1xuXHRcdFx0XHQqL1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGZpbHRlckNhY2hlKGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W10sIHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZylcbntcblx0cmV0dXJuIGxzLmZpbHRlcihmdW5jdGlvbiAodilcblx0e1xuXHRcdGxldCBib29sID0gdi5wYXRoTWFpbiA9PSBwYXRoTWFpbiAmJiB2Lm5vdmVsSUQgPT0gbm92ZWxJRDtcblxuXHRcdHJldHVybiB2ICYmICFib29sXG5cdH0pO1xufVxuIl19