"use strict";
/**
 * Created by user on 2018/8/14/014.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const toc_1 = require("@node-novel/toc");
const index_1 = require("@node-novel/toc/index");
const util_1 = require("@node-novel/toc/lib/util");
const toc_root_1 = require("@node-novel/toc/toc-root");
const toc_contents_1 = require("@node-novel/toc/toc_contents");
const Promise = require("bluebird");
const txt2epub3_1 = require("novel-epub/lib/txt2epub3");
const git_1 = require("../data/git");
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const util_2 = require("../lib/util");
const project_config_1 = require("../project.config");
const git_2 = require("../script/git");
const gitee_pr_1 = require("../script/gitee-pr");
const index_2 = require("../index");
const path = require("path");
const fs = require("fs-extra");
const FastGlob = require("fast-glob");
const node_novel_info_1 = require("node-novel-info");
const epub_maker2_1 = require("epub-maker2");
const novel_txt_merge_1 = require("novel-txt-merge");
const log_1 = require("../lib/log");
let _update;
const novelStatCache = novel_stat_1.getNovelStatCache();
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && Promise.resolve((async () => {
    let _cache_init = path.join(project_config_1.default.cache_root, '.toc_contents.cache');
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let ls;
    let bool = fs.existsSync(_cache_init);
    log_1.default.debug(`[toc:contents] 是否已曾經初始化導航目錄`, bool, _cache_init);
    if (!bool) {
        log_1.default.warn(`[toc:contents] 初始化所有 小說 的 導航目錄`);
        ls = await toc_1.get_ids(project_config_1.default.novel_root)
            .reduce(async function (memo, pathMain) {
            await Promise
                .mapSeries(FastGlob([
                '*/README.md',
            ], {
                cwd: path.join(project_config_1.default.novel_root, pathMain),
            }), function (p) {
                let novelID = path.basename(path.dirname(p));
                memo.push({ pathMain, novelID });
            });
            return memo;
        }, []);
    }
    else if (!fs.existsSync(jsonfile)) {
        log_1.default.grey(`[toc:contents] 本次沒有任何待更新列表 (1)`);
        return;
    }
    else {
        ls = await fs.readJSON(jsonfile);
    }
    if (ls && ls.length) {
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let basePath = path.join(project_config_1.default.novel_root, pathMain, novelID);
            let msg;
            let _did = false;
            let _file_changed;
            if (fs.existsSync(path.join(basePath, 'README.md'))) {
                let file = path.join(basePath, '導航目錄.md');
                let old = await fs.readFile(file)
                    .catch(function () {
                    return '';
                })
                    .then(function (ls) {
                    return ls.toString();
                });
                //console.log(`[toc:contents]`, pathMain, novelID);
                let ret = await toc_contents_1.default(basePath, file, async function (basePath, ...argv) {
                    let ret = await toc_contents_1.makeHeader(basePath, ...argv);
                    let meta = await (async () => {
                        let data = await fs.readFile(path.join(basePath, 'README.md'));
                        return node_novel_info_1.mdconf_parse(data, {
                            throw: false,
                        });
                    })()
                        .then(node_novel_info_1.chkInfo)
                        .catch(function (e) {
                        log_1.default.error(e);
                        return null;
                    });
                    if (meta) {
                        let epub = new epub_maker2_1.default()
                            .withTitle(meta.novel.title, meta.novel.title_short || meta.novel.title_zh);
                        let epub_data = await txt2epub3_1.makeFilename({
                            inputPath: basePath,
                            outputPath: '',
                            padEndDate: false,
                            useTitle: true,
                            filenameLocal: novelID,
                            noLog: true,
                        }, epub, meta);
                        let epub_file = epub_data.basename + epub_data.ext;
                        let txt_file = await novel_txt_merge_1.makeFilename(meta, epub_data.basename);
                        let _pathMain = pathMain;
                        if (fs.existsSync(path.join(project_config_1.default.novel_root, pathMain + '_out', novelID, 'README.md'))) {
                            _pathMain = pathMain + '_out';
                        }
                        let link_base = `${project_config_1.default.outputUrl}/${_pathMain}/`;
                        let t;
                        let link;
                        t = 'EPUB';
                        link = epub_file;
                        let _add = [];
                        _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                        t = 'TXT';
                        link = 'out/' + txt_file;
                        _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                        ret.push('- ' + _add.join(` ／ `) + ` - 如果連結錯誤 請點[這裡](${link_base})`);
                        {
                            link_base = 'https://github.com/bluelovers/node-novel/blob/master/lib/locales/';
                            if (meta.options && meta.options.novel && meta.options.pattern) {
                                t = meta.options.pattern;
                                link = meta.options.pattern + '.ts';
                                _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                            }
                            else {
                                t = '格式與譯名整合樣式';
                                link = novelID + '.ts';
                            }
                            let md = `[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`;
                            ret.push('- ' + md + ` - 如果連結錯誤 請點[這裡](${link_base})`);
                        }
                    }
                    const DISCORD_LINK = 'https://discord.gg/MnXkpmX';
                    {
                        let t = DISCORD_LINK;
                        let link = DISCORD_LINK;
                        let md = `[${util_1.md_link_escape(t)}](${link})`;
                        ret.push(`- ${md} - 報錯交流群，如果已經加入請點[這裡](https://discordapp.com/channels/467794087769014273/467794088285175809) 或 [Discord](https://discordapp.com/channels/@me)`);
                    }
                    {
                        let qt = util_2.qrcode_link(DISCORD_LINK);
                        let qu = util_2.qrcode_link([
                            project_config_1.default.sourceUrl,
                            pathMain,
                            novelID,
                            '導航目錄.md',
                        ].join('/'));
                        let c = `\n\n`;
                        ret.push(c + [
                            `![導航目錄](${util_1.md_link_escape(qu)})`,
                            `![Discord](${util_1.md_link_escape(qt)})`,
                        ].join('  ') + c);
                    }
                    return ret;
                })
                    .tap(async function (ls) {
                    if (ls) {
                        _file_changed = old != ls;
                        if (!bool || _file_changed) {
                            await index_2.crossSpawnSync('git', [
                                'add',
                                file,
                            ], {
                                stdio: 'inherit',
                                cwd: basePath,
                            });
                            await index_2.crossSpawnSync('git', [
                                'commit',
                                '-a',
                                '-m',
                                `[toc:contents] ${pathMain} ${novelID}`,
                            ], {
                                stdio: 'inherit',
                                cwd: basePath,
                            });
                            _did = true;
                            _update = true;
                        }
                        else {
                            msg = `目錄檔案已存在並且沒有變化`;
                        }
                    }
                    else {
                        msg = `無法生成目錄，可能不存在任何章節檔案`;
                    }
                });
                if (_did) {
                    log_1.default.success(`[toc:contents]`, pathMain, novelID);
                }
                else {
                    log_1.default.dir({
                        title: `[SKIP]`,
                        pathMain, novelID,
                        msg,
                        bool,
                        _file_changed,
                    });
                }
                return ret;
            }
        })
            .tap(async function () {
            if (_update) {
                log_1.default.info(`[toc:contents] 完成`);
                await fs.ensureFile(_cache_init);
            }
            else {
                log_1.default.warn(`[toc:contents] 完成 本次無更新任何檔案`);
            }
        })
            .tap(function () {
            log_1.default.log(`[toc:contents] done.`);
        });
    }
    else {
        log_1.default.warn(`[toc:contents] 本次沒有任何待更新列表 (2)`);
    }
})())
    .tap(async function () {
    const file = path.join(project_config_1.default.novel_root, 'README.md');
    const old = await fs.readFile(file)
        .catch(function () {
        return '';
    })
        .then(function (ls) {
        return ls.toString();
    });
    await toc_root_1.createTocRoot(project_config_1.default.novel_root, null, {
        cbForEachSubNovel(text, item) {
            let { pathMain, novelID } = item;
            let stat = novelStatCache.novel(pathMain, novelID);
            let text_plus = '';
            if (stat.epub_date) {
                text_plus += `build: ${novel_stat_1.createMoment(stat.epub_date).format('YYYY-MM-DD')}  `;
            }
            if (item.meta) {
                novelStatCache.mdconf_set(pathMain, novelID, item.meta);
            }
            if (stat.chapter) {
                text_plus += `chapter: ${stat.chapter}  `;
                let n = stat.chapter - (stat.chapter_old | 0);
                n = n || 0;
                if (n != stat.chapter) {
                    text_plus += `add: ${n}  `;
                }
            }
            if (text_plus) {
                text += '\n  <br/>' + text_plus;
            }
            return text;
        }
    })
        .tap(async function (md) {
        if (md && md !== old) {
            await fs.writeFile(file, md);
            await index_2.crossSpawnAsync('git', [
                'add',
                '--verbose',
                file,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.default.novel_root,
            });
            await index_2.crossSpawnAsync('git', [
                'commit',
                '-a',
                '-m',
                `[TOC] toc root`,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.default.novel_root,
            });
            log_1.default.success(`[toc:root] 完成 已更新`);
            _update = true;
        }
        else {
            log_1.default.warn(`[toc:root] 完成 但本次無更動內容`);
        }
    });
    novelStatCache.save();
})
    .tap(async function () {
    if (_update) {
        log_1.default.info(`[toc] 完成 並且試圖 push 與 建立 PR`);
        let cp = await git_2.pushGit(project_config_1.default.novel_root, git_2.getPushUrlGitee(git_1.GIT_SETTING_DIST_NOVEL.url), true);
        await gitee_pr_1.createPullRequests();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUF1RjtBQUN2RixvQ0FBb0M7QUFDcEMsd0RBQXdEO0FBQ3hELHFDQUF1RTtBQUN2RSx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNDQUEwQztBQUMxQyxzREFBOEM7QUFDOUMsdUNBQXFFO0FBQ3JFLGlEQUF3RDtBQUN4RCxvQ0FBMkQ7QUFDM0QsNkJBQThCO0FBQzlCLCtCQUErQjtBQUMvQixzQ0FBc0M7QUFDdEMscURBQXFFO0FBQ3JFLDZDQUEwRDtBQUMxRCxxREFBNEU7QUFFNUUsb0NBQWlDO0FBR2pDLElBQUksT0FBZ0IsQ0FBQztBQUVyQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0FBRTNDLGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0lBRWpDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUM3RSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFFdEUsSUFBSSxFQUEyQyxDQUFDO0lBRWhELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFdEMsYUFBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFaEUsSUFBSSxDQUFDLElBQUksRUFD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QUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXJDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDZjthQUVEO1lBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1NBQ3ZDO0lBQ0YsQ0FBQyxDQUFDLENBQ0Y7SUFFRCxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0tBQ0QsR0FBRyxDQUFDLEtBQUs7SUFFVCxJQUFJLE9BQU8sRUFDWDtRQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUUzQyxJQUFJLEVBQUUsR0FBRyxNQUFNLGFBQU8sQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxxQkFBZSxDQUFDLDRCQUFzQixDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXBHLE1BQU0sNkJBQWtCLEVBQUUsQ0FBQztLQUMzQjtBQUNGLENBQUMsQ0FBQyxDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC84LzE0LzAxNC5cbiAqL1xuXG5pbXBvcnQgeyBnZXRfaWRzLCBwcm9jZXNzVG9jIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IG1kX2hyZWYgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvaW5kZXgnO1xuaW1wb3J0IHsgbWRfbGlua19lc2NhcGUgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvbGliL3V0aWwnO1xuaW1wb3J0IHsgY3JlYXRlVG9jUm9vdCwgSURhdGFBdXRob3JOb3ZlbEl0ZW0gfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvdG9jLXJvb3QnO1xuaW1wb3J0IHByb2Nlc3NUb2NDb250ZW50cywgeyBtYWtlSGVhZGVyLCBtYWtlTGlua30gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvY19jb250ZW50cyc7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IG1ha2VGaWxlbmFtZSB9IGZyb20gJ25vdmVsLWVwdWIvbGliL3R4dDJlcHViMyc7XG5pbXBvcnQgeyBHSVRfU0VUVElOR19ESVNUX05PVkVMLCBHSVRfU0VUVElOR19FUFVCIH0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3JlYXRlTW9tZW50LCBnZXROb3ZlbFN0YXRDYWNoZSB9IGZyb20gJy4uL2xpYi9jYWNoZS9ub3ZlbC1zdGF0JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgeyBxcmNvZGVfbGluayB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IGdldFB1c2hVcmwsIGdldFB1c2hVcmxHaXRlZSwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdGVlLXByJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jLCBjcm9zc1NwYXduQXN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCBFcHViTWFrZXIsIHsgaGFzaFN1bSwgc2x1Z2lmeSB9IGZyb20gJ2VwdWItbWFrZXIyJztcbmltcG9ydCB0eHRNZXJnZSwgeyBtYWtlRmlsZW5hbWUgYXMgbWFrZUZpbGVuYW1lVHh0IH0gZnJvbSAnbm92ZWwtdHh0LW1lcmdlJztcbmltcG9ydCBub3ZlbEVwdWIgZnJvbSAnbm92ZWwtZXB1Yic7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcblxubGV0IF91cGRhdGU6IGJvb2xlYW47XG5cbmNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIFByb21pc2UucmVzb2x2ZSgoYXN5bmMgKCkgPT5cbntcblx0bGV0IF9jYWNoZV9pbml0ID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJy50b2NfY29udGVudHMuY2FjaGUnKTtcblx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2RpZmYtbm92ZWwuanNvbicpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdO1xuXG5cdGxldCBib29sID0gZnMuZXhpc3RzU3luYyhfY2FjaGVfaW5pdCk7XG5cblx0Y29uc29sZS5kZWJ1ZyhgW3RvYzpjb250ZW50c10g5piv5ZCm5bey5pu+57aT5Yid5aeL5YyW5bCO6Iiq55uu6YyEYCwgYm9vbCwgX2NhY2hlX2luaXQpO1xuXG5cdGlmICghYm9vbClcblx0e1xuXHRcdGNvbnNvbGUud2FybihgW3RvYzpjb250ZW50c10g5Yid5aeL5YyW5omA5pyJIOWwj+iqqiDnmoQg5bCO6Iiq55uu6YyEYCk7XG5cdFx0bHMgPSBhd2FpdCBnZXRfaWRzKFByb2plY3RDb25maWcubm92ZWxfcm9vdClcblx0XHRcdC5yZWR1Y2UoYXN5bmMgZnVuY3Rpb24gKG1lbW8sIHBhdGhNYWluOiBzdHJpbmcpXG5cdFx0XHR7XG5cdFx0XHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iPHN0cmluZz4oW1xuXHRcdFx0XHRcdFx0JyovUkVBRE1FLm1kJyxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIHBhdGhNYWluKSxcblx0XHRcdFx0XHR9KSwgZnVuY3Rpb24gKHApXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IG5vdmVsSUQgPSBwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShwKSk7XG5cblx0XHRcdFx0XHRcdG1lbW8ucHVzaCh7IHBhdGhNYWluLCBub3ZlbElEIH0pO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdDtcblxuXHRcdFx0XHRyZXR1cm4gbWVtbztcblx0XHRcdH0sIFtdKVxuXHRcdDtcblx0fVxuXHRlbHNlIGlmICghZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdHtcblx0XHRjb25zb2xlLmdyZXkoYFt0b2M6Y29udGVudHNdIOacrOasoeaykuacieS7u+S9leW+heabtOaWsOWIl+ihqCAoMSlgKTtcblx0XHRyZXR1cm47XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bHMgPSBhd2FpdCBmcy5yZWFkSlNPTihqc29uZmlsZSk7XG5cdH1cblxuXHRpZiAobHMgJiYgbHMubGVuZ3RoKVxuXHR7XG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IGJhc2VQYXRoID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdGxldCBtc2c6IHN0cmluZztcblx0XHRcdFx0bGV0IF9kaWQgPSBmYWxzZTtcblx0XHRcdFx0bGV0IF9maWxlX2NoYW5nZWQ6IGJvb2xlYW47XG5cblx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGJhc2VQYXRoLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oYmFzZVBhdGgsICflsI7oiKrnm67pjIQubWQnKTtcblxuXHRcdFx0XHRcdGxldCBvbGQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBscy50b1N0cmluZygpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGxldCByZXQgPSBhd2FpdCBwcm9jZXNzVG9jQ29udGVudHMoYmFzZVBhdGgsIGZpbGUsIGFzeW5jIGZ1bmN0aW9uIChiYXNlUGF0aDogc3RyaW5nLCAuLi5hcmd2KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgcmV0ID0gYXdhaXQgbWFrZUhlYWRlcihiYXNlUGF0aCwgLi4uYXJndik7XG5cblx0XHRcdFx0XHRcdFx0bGV0IG1ldGE6IElNZGNvbmZNZXRhID0gYXdhaXQgKGFzeW5jICgpID0+XG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoLmpvaW4oYmFzZVBhdGgsICdSRUFETUUubWQnKSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9KSgpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oY2hrSW5mbylcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtZXRhKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWIgPSBuZXcgRXB1Yk1ha2VyKClcblx0XHRcdFx0XHRcdFx0XHRcdC53aXRoVGl0bGUobWV0YS5ub3ZlbC50aXRsZSwgbWV0YS5ub3ZlbC50aXRsZV9zaG9ydCB8fCBtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViX2RhdGEgPSBhd2FpdCBtYWtlRmlsZW5hbWUoe1xuXHRcdFx0XHRcdFx0XHRcdFx0aW5wdXRQYXRoOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdG91dHB1dFBhdGg6ICcnLFxuXHRcdFx0XHRcdFx0XHRcdFx0cGFkRW5kRGF0ZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHR1c2VUaXRsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGVuYW1lTG9jYWw6IG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHRub0xvZzogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHR9LCBlcHViLCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViX2ZpbGUgPSBlcHViX2RhdGEuYmFzZW5hbWUgKyBlcHViX2RhdGEuZXh0O1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9maWxlID0gYXdhaXQgbWFrZUZpbGVuYW1lVHh0KG1ldGEsIGVwdWJfZGF0YS5iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgX3BhdGhNYWluID0gcGF0aE1haW47XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oXG5cdFx0XHRcdFx0XHRcdFx0XHRQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXRoTWFpbiArICdfb3V0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHQnUkVBRE1FLm1kJyxcblx0XHRcdFx0XHRcdFx0XHQpKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRfcGF0aE1haW4gPSBwYXRoTWFpbiArICdfb3V0Jztcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgbGlua19iYXNlID0gYCR7UHJvamVjdENvbmZpZy5vdXRwdXRVcmx9LyR7X3BhdGhNYWlufS9gO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IHQ6IHN0cmluZztcblx0XHRcdFx0XHRcdFx0XHRsZXQgbGluazogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRcdFx0dCA9ICdFUFVCJztcblx0XHRcdFx0XHRcdFx0XHRsaW5rID0gZXB1Yl9maWxlO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9hZGQgPSBbXTtcblxuXHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXG5cdFx0XHRcdFx0XHRcdFx0dCA9ICdUWFQnO1xuXHRcdFx0XHRcdFx0XHRcdGxpbmsgPSAnb3V0LycgKyB0eHRfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goJy0gJyArIF9hZGQuam9pbihgIO+8jyBgKSArIGAgLSDlpoLmnpzpgKPntZDpjK/oqqQg6KuL6bueW+mAmeijoV0oJHtsaW5rX2Jhc2V9KWApO1xuXG5cblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRsaW5rX2Jhc2UgPSAnaHR0cHM6Ly9naXRodWIuY29tL2JsdWVsb3ZlcnMvbm9kZS1ub3ZlbC9ibG9iL21hc3Rlci9saWIvbG9jYWxlcy8nO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YS5vcHRpb25zICYmIG1ldGEub3B0aW9ucy5ub3ZlbCAmJiBtZXRhLm9wdGlvbnMucGF0dGVybilcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dCA9IG1ldGEub3B0aW9ucy5wYXR0ZXJuO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsaW5rID0gbWV0YS5vcHRpb25zLnBhdHRlcm4gKyAnLnRzJztcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dCA9ICfmoLzlvI/oiIfora/lkI3mlbTlkIjmqKPlvI8nO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsaW5rID0gbm92ZWxJRCArICcudHMnO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgbWQgPSBgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWA7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKCctICcgKyBtZCArIGAgLSDlpoLmnpzpgKPntZDpjK/oqqQg6KuL6bueW+mAmeijoV0oJHtsaW5rX2Jhc2V9KWApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRjb25zdCBESVNDT1JEX0xJTksgPSAnaHR0cHM6Ly9kaXNjb3JkLmdnL01uWGtwbVgnO1xuXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgdCA9IERJU0NPUkRfTElOSztcblx0XHRcdFx0XHRcdFx0XHRsZXQgbGluayA9IERJU0NPUkRfTElOSztcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBtZCA9IGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua30pYDtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKGAtICR7bWR9IC0g5aCx6Yyv5Lqk5rWB576k77yM5aaC5p6c5bey57aT5Yqg5YWl6KuL6bueW+mAmeijoV0oaHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9jaGFubmVscy80Njc3OTQwODc3NjkwMTQyNzMvNDY3Nzk0MDg4Mjg1MTc1ODA5KSDmiJYgW0Rpc2NvcmRdKGh0dHBzOi8vZGlzY29yZGFwcC5jb20vY2hhbm5lbHMvQG1lKWApO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBxdCA9IHFyY29kZV9saW5rKERJU0NPUkRfTElOSyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHF1ID0gcXJjb2RlX2xpbmsoW1xuXHRcdFx0XHRcdFx0XHRcdFx0UHJvamVjdENvbmZpZy5zb3VyY2VVcmwsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHQn5bCO6Iiq55uu6YyELm1kJyxcblx0XHRcdFx0XHRcdFx0XHRdLmpvaW4oJy8nKSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgYyA9IGBcXG5cXG5gO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goYyArIFtcblx0XHRcdFx0XHRcdFx0XHRcdGAhW+WwjuiIquebrumMhF0oJHttZF9saW5rX2VzY2FwZShxdSl9KWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRgIVtEaXNjb3JkXSgke21kX2xpbmtfZXNjYXBlKHF0KX0pYCxcblx0XHRcdFx0XHRcdFx0XHRdLmpvaW4oJyAgJykgKyBjKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmIChscylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQgPSBvbGQgIT0gbHM7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIWJvb2wgfHwgX2ZpbGVfY2hhbmdlZClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YFt0b2M6Y29udGVudHNdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdF9kaWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0X3VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRtc2cgPSBg55uu6YyE5qqU5qGI5bey5a2Y5Zyo5Lim5LiU5rKS5pyJ6K6K5YyWYDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bXNnID0gYOeEoeazleeUn+aIkOebrumMhO+8jOWPr+iDveS4jeWtmOWcqOS7u+S9leeroOevgOaqlOahiGA7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRpZiAoX2RpZClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6Y29udGVudHNdYCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogYFtTS0lQXWAsXG5cdFx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRtc2csXG5cdFx0XHRcdFx0XHRcdGJvb2wsXG5cdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoX3VwZGF0ZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhgW3RvYzpjb250ZW50c10g5a6M5oiQYCk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5lbnN1cmVGaWxlKF9jYWNoZV9pbml0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOWujOaIkCDmnKzmrKHnhKHmm7TmlrDku7vkvZXmqpTmoYhgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5sb2coYFt0b2M6Y29udGVudHNdIGRvbmUuYCk7XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOacrOasoeaykuacieS7u+S9leW+heabtOaWsOWIl+ihqCAoMilgKTtcblx0fVxufSkoKSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdSRUFETUUubWQnKTtcblxuXHRcdGNvbnN0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdGF3YWl0IGNyZWF0ZVRvY1Jvb3QoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBudWxsLCB7XG5cdFx0XHRjYkZvckVhY2hTdWJOb3ZlbCh0ZXh0LCBpdGVtKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gaXRlbTtcblxuXHRcdFx0XHRsZXQgc3RhdCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgdGV4dF9wbHVzOiBzdHJpbmcgPSAnJztcblxuXHRcdFx0XHRpZiAoc3RhdC5lcHViX2RhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGJ1aWxkOiAke2NyZWF0ZU1vbWVudChzdGF0LmVwdWJfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyl9ICBgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGl0ZW0ubWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIGl0ZW0ubWV0YSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc3RhdC5jaGFwdGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBjaGFwdGVyOiAke3N0YXQuY2hhcHRlcn0gIGA7XG5cblx0XHRcdFx0XHRsZXQgbiA9IHN0YXQuY2hhcHRlciAtIChzdGF0LmNoYXB0ZXJfb2xkIHwgMCk7XG5cdFx0XHRcdFx0biA9IG4gfHwgMDtcblxuXHRcdFx0XHRcdGlmIChuICE9IHN0YXQuY2hhcHRlcilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGFkZDogJHtufSAgYDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGV4dF9wbHVzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dCArPSAnXFxuICA8YnIvPicgKyB0ZXh0X3BsdXM7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdGV4dDtcblx0XHRcdH1cblx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAobWQpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChtZCAmJiBtZCAhPT0gb2xkKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXdhaXQgZnMud3JpdGVGaWxlKGZpbGUsIG1kKTtcblxuXHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0YFtUT0NdIHRvYyByb290YCxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6cm9vdF0g5a6M5oiQIOW3suabtOaWsGApO1xuXG5cdFx0XHRcdFx0X3VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbdG9jOnJvb3RdIOWujOaIkCDkvYbmnKzmrKHnhKHmm7Tli5XlhaflrrlgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKCk7XG5cdH0pXG5cdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0e1xuXHRcdGlmIChfdXBkYXRlKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuaW5mbyhgW3RvY10g5a6M5oiQIOS4puS4lOippuWcliBwdXNoIOiIhyDlu7rnq4sgUFJgKTtcblxuXHRcdFx0bGV0IGNwID0gYXdhaXQgcHVzaEdpdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIGdldFB1c2hVcmxHaXRlZShHSVRfU0VUVElOR19ESVNUX05PVkVMLnVybCksIHRydWUpO1xuXG5cdFx0XHRhd2FpdCBjcmVhdGVQdWxsUmVxdWVzdHMoKTtcblx0XHR9XG5cdH0pXG47XG4iXX0=