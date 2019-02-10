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
const novelGlobby = require("node-novel-globby/g");
const txt2epub3_1 = require("novel-epub/lib/txt2epub3");
const git_1 = require("../data/git");
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const util_2 = require("../lib/util");
const project_config_1 = require("../project.config");
const cache_json_1 = require("../script/cache/cache-json");
const git_2 = require("../script/git");
const git_api_pr_1 = require("../script/git-api-pr");
const index_2 = require("../index");
const path = require("path");
const fs = require("fs-extra");
const FastGlob = require("fast-glob");
const epub_maker2_1 = require("epub-maker2");
const novel_txt_merge_1 = require("novel-txt-merge");
const log_1 = require("../lib/log");
const meta_1 = require("../lib/util/meta");
const url = require("url");
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
                let txts = await toc_contents_1.getList(basePath);
                let meta = meta_1.getMdconfMeta(pathMain, novelID);
                if (!txts.length) {
                    log_1.default.warn(`[toc:contents]`, pathMain, novelID, '此目錄為書籤');
                    /*
                    if (meta)
                    {
                        novelStatCache.mdconf_set(pathMain, novelID, meta);
                    }
                    */
                    return;
                }
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
                        let _add = [];
                        {
                            let link_base = 'https://github.com/bluelovers/node-novel/blob/master/lib/locales/';
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
                        link_base = `${project_config_1.default.outputUrl}/${_pathMain}/`;
                        t = 'EPUB';
                        link = epub_file;
                        _add.push(` :heart: [${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)}) :heart: `);
                        t = 'TXT';
                        link = 'out/' + txt_file;
                        _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                        ret.push('- ' + _add.join(` ／ `) + ` - 如果連結錯誤 請點[這裡](${link_base})`);
                    }
                    const DISCORD_LINK = 'https://discord.gg/MnXkpmX';
                    {
                        let t = DISCORD_LINK;
                        let link = DISCORD_LINK;
                        let md = `[${util_1.md_link_escape(t)}](${link})`;
                        ret.push(`- :mega: ${md} - 報錯交流群，如果已經加入請點[這裡](https://discordapp.com/channels/467794087769014273/467794088285175809) 或 [Discord](https://discordapp.com/channels/@me)`);
                    }
                    {
                        let qt = util_2.qrcode_link(DISCORD_LINK);
                        let qu = util_2.qrcode_link(url.format(url.parse([
                            project_config_1.default.sourceUrl,
                            pathMain,
                            novelID,
                            '導航目錄.md',
                        ].join('/'))));
                        let c = `\n\n`;
                        ret.push(c + [
                            `![導航目錄](${util_1.md_link_escape(qu)} "導航目錄")`,
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
                            /*
                            await crossSpawnSync('git', [
                                'commit',
                                '-a',
                                '-m',
                                `[toc:contents] ${pathMain} ${novelID}`,
                            ], {
                                stdio: 'inherit',
                                cwd: basePath,
                            });
                            */
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
                /*
                await crossSpawnSync('git', [
                    'commit',
                    '-a',
                    '-m',
                    `[toc:contents] 導航目錄.md`,
                ], {
                    stdio: 'inherit',
                    cwd: ProjectConfig.novel_root,
                });
                */
                _update = `[toc:contents] 導航目錄.md`;
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
    return null;
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
            /*
            if (item.meta)
            {
                novelStatCache.mdconf_set(pathMain, novelID, item.meta);
            }

            if (!stat.chapter || !item.meta)
            {
                let meta = getMdconfMeta(pathMain, novelID);

                if (meta)
                {
                    item.meta = meta;
                    novelStatCache.mdconf_set(pathMain, novelID, item.meta);
                }
            }
            */
            if (!stat.chapter) {
                /**
                 * 補充沒有被記錄的資訊
                 */
                let txts = novelGlobby.globbySync([
                    '**/*.txt',
                ], {
                    cwd: path.join(project_config_1.default.novel_root, pathMain, novelID),
                    throwEmpty: false,
                });
                if (txts && txts.length) {
                    stat.chapter_old = stat.chapter | 0;
                    stat.chapter = txts.length;
                }
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
            /*
            await crossSpawnAsync('git', [
                'commit',
                '-a',
                '-m',
                `[TOC] toc root`,
            ], {
                stdio: 'inherit',
                cwd: ProjectConfig.novel_root,
            });
            */
            if (!_update || typeof _update != 'string') {
                _update = `[TOC] toc root`;
            }
            log_1.default.success(`[toc:root] 完成 已更新`);
            //_update = true;
        }
        else {
            log_1.default.warn(`[toc:root] 完成 但本次無更動內容`);
        }
    });
})
    .tap(async function () {
    return null;
    return toc_1.processToc(project_config_1.default.novel_root)
        .then(async function (ls) {
        await Promise.each(Object.keys(ls), function (pathMain) {
            let file = path.join(project_config_1.default.novel_root, pathMain, 'README.md');
            return index_2.crossSpawnAsync('git', [
                'add',
                '--verbose',
                file,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.default.novel_root,
            });
        });
        if (!_update || typeof _update != 'string') {
            _update = `[TOC] auto update toc`;
        }
    })
        .catch(e => log_1.default.error(e));
})
    .tap(async function () {
    if (_update) {
        await index_2.crossSpawnAsync('git', [
            'commit',
            '-a',
            '-m',
            typeof _update == 'string' ? _update : `[TOC] updated`,
        ], {
            stdio: 'inherit',
            cwd: project_config_1.default.novel_root,
        });
        _update = true;
    }
})
    .tap(async function () {
    if (_update) {
        log_1.default.info(`[toc] 完成 並且試圖 push 與 建立 PR`);
        let cp = await git_2.pushGit(project_config_1.default.novel_root, git_2.getPushUrlGitee(git_1.GIT_SETTING_DIST_NOVEL.url), true);
        await git_api_pr_1.createPullRequests();
        cache_json_1.updateCacheConfigHashHEAD();
    }
    novelStatCache.save();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUErRztBQUMvRyxvQ0FBcUM7QUFDckMsbURBQW9EO0FBQ3BELHdEQUF3RDtBQUN4RCxxQ0FBdUU7QUFDdkUsd0RBQTBFO0FBQzFFLHdDQUEwRTtBQUMxRSxzQ0FBMEM7QUFDMUMsc0RBQThDO0FBQzlDLDJEQUF1RTtBQUN2RSx1Q0FBcUU7QUFDckUscURBQTBEO0FBQzFELG9DQUEyRDtBQUMzRCw2QkFBOEI7QUFDOUIsK0JBQStCO0FBQy9CLHNDQUFzQztBQUV0Qyw2Q0FBMEQ7QUFDMUQscURBQTRFO0FBRTVFLG9DQUFpQztBQUVqQywyQ0FBc0U7QUFDdEUsMkJBQTRCO0FBRTVCLElBQUksT0FBeUIsQ0FBQztBQUU5QixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0FBRTNDLGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0lBRWpDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUM3RSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFFdEUsSUFBSSxFQUEyQyxDQUFDO0lBRWhELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFdEMsYUFBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUs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Q0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMvQixDQUFDLENBQUM7S0FDRCxHQUFHLENBQUMsS0FBSztJQUVULElBQUksT0FBTyxFQUNYO1FBQ0MsTUFBTSx1QkFBZSxDQUFDLEtBQUssRUFBRTtZQUM1QixRQUFRO1lBQ1IsSUFBSTtZQUNKLElBQUk7WUFDSixPQUFPLE9BQU8sSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtTQUN0RCxFQUFFO1lBQ0YsS0FBSyxFQUFFLFNBQVM7WUFDaEIsR0FBRyxFQUFFLHdCQUFhLENBQUMsVUFBVTtTQUM3QixDQUFDLENBQUM7UUFFSCxPQUFPLEdBQUcsSUFBSSxDQUFDO0tBQ2Y7QUFDRixDQUFDLENBQUM7S0FDRCxHQUFHLENBQUMsS0FBSztJQUVULElBQUksT0FBTyxFQUNYO1FBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBRTNDLElBQUksRUFBRSxHQUFHLE1BQU0sYUFBTyxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLHFCQUFlLENBQUMsNEJBQXNCLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFcEcsTUFBTSwrQkFBa0IsRUFBRSxDQUFDO1FBRTNCLHNDQUF5QixFQUFFLENBQUM7S0FDNUI7SUFFRCxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzgvMTQvMDE0LlxuICovXG5cbmltcG9ydCB7IGdldF9pZHMsIHByb2Nlc3NUb2MgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IHsgbWRfaHJlZiB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy9pbmRleCc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy9saWIvdXRpbCc7XG5pbXBvcnQgeyBjcmVhdGVUb2NSb290LCBJRGF0YUF1dGhvck5vdmVsSXRlbSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2Mtcm9vdCc7XG5pbXBvcnQgcHJvY2Vzc1RvY0NvbnRlbnRzLCB7IG1ha2VIZWFkZXIsIG1ha2VMaW5rLCBnZXRMaXN0IGFzIGdldFR4dExpc3QgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvdG9jX2NvbnRlbnRzJztcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBub3ZlbEdsb2JieSA9IHJlcXVpcmUoJ25vZGUtbm92ZWwtZ2xvYmJ5L2cnKTtcbmltcG9ydCB7IG1ha2VGaWxlbmFtZSB9IGZyb20gJ25vdmVsLWVwdWIvbGliL3R4dDJlcHViMyc7XG5pbXBvcnQgeyBHSVRfU0VUVElOR19ESVNUX05PVkVMLCBHSVRfU0VUVElOR19FUFVCIH0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3JlYXRlTW9tZW50LCBnZXROb3ZlbFN0YXRDYWNoZSB9IGZyb20gJy4uL2xpYi9jYWNoZS9ub3ZlbC1zdGF0JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgeyBxcmNvZGVfbGluayB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IHVwZGF0ZUNhY2hlQ29uZmlnSGFzaEhFQUQgfSBmcm9tICcuLi9zY3JpcHQvY2FjaGUvY2FjaGUtanNvbic7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCB7IGNyZWF0ZVB1bGxSZXF1ZXN0cyB9IGZyb20gJy4uL3NjcmlwdC9naXQtYXBpLXByJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jLCBjcm9zc1NwYXduQXN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCBFcHViTWFrZXIsIHsgaGFzaFN1bSwgc2x1Z2lmeSB9IGZyb20gJ2VwdWItbWFrZXIyJztcbmltcG9ydCB0eHRNZXJnZSwgeyBtYWtlRmlsZW5hbWUgYXMgbWFrZUZpbGVuYW1lVHh0IH0gZnJvbSAnbm92ZWwtdHh0LW1lcmdlJztcbmltcG9ydCBub3ZlbEVwdWIgZnJvbSAnbm92ZWwtZXB1Yic7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCB7IGdldE1kY29uZk1ldGEsIGdldE1kY29uZk1ldGFCeVBhdGggfSBmcm9tICcuLi9saWIvdXRpbC9tZXRhJztcbmltcG9ydCB1cmwgPSByZXF1aXJlKCd1cmwnKTtcblxubGV0IF91cGRhdGU6IGJvb2xlYW4gfCBzdHJpbmc7XG5cbmNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIFByb21pc2UucmVzb2x2ZSgoYXN5bmMgKCkgPT5cbntcblx0bGV0IF9jYWNoZV9pbml0ID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJy50b2NfY29udGVudHMuY2FjaGUnKTtcblx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2RpZmYtbm92ZWwuanNvbicpO1xuXG5cdGxldCBsczogeyBwYXRoTWFpbjogc3RyaW5nLCBub3ZlbElEOiBzdHJpbmcgfVtdO1xuXG5cdGxldCBib29sID0gZnMuZXhpc3RzU3luYyhfY2FjaGVfaW5pdCk7XG5cblx0Y29uc29sZS5kZWJ1ZyhgW3RvYzpjb250ZW50c10g5piv5ZCm5bey5pu+57aT5Yid5aeL5YyW5bCO6Iiq55uu6YyEYCwgYm9vbCwgX2NhY2hlX2luaXQpO1xuXG5cdGlmICghYm9vbClcblx0e1xuXHRcdGNvbnNvbGUud2FybihgW3RvYzpjb250ZW50c10g5Yid5aeL5YyW5omA5pyJIOWwj+iqqiDnmoQg5bCO6Iiq55uu6YyEYCk7XG5cdFx0bHMgPSBhd2FpdCBnZXRfaWRzKFByb2plY3RDb25maWcubm92ZWxfcm9vdClcblx0XHRcdC5yZWR1Y2UoYXN5bmMgZnVuY3Rpb24gKG1lbW8sIHBhdGhNYWluOiBzdHJpbmcpXG5cdFx0XHR7XG5cdFx0XHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdFx0XHQubWFwU2VyaWVzKEZhc3RHbG9iPHN0cmluZz4oW1xuXHRcdFx0XHRcdFx0JyovUkVBRE1FLm1kJyxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIHBhdGhNYWluKSxcblx0XHRcdFx0XHR9KSwgZnVuY3Rpb24gKHApXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IG5vdmVsSUQgPSBwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShwKSk7XG5cblx0XHRcdFx0XHRcdG1lbW8ucHVzaCh7IHBhdGhNYWluLCBub3ZlbElEIH0pO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdDtcblxuXHRcdFx0XHRyZXR1cm4gbWVtbztcblx0XHRcdH0sIFtdKVxuXHRcdDtcblx0fVxuXHRlbHNlIGlmICghZnMuZXhpc3RzU3luYyhqc29uZmlsZSkpXG5cdHtcblx0XHRjb25zb2xlLmdyZXkoYFt0b2M6Y29udGVudHNdIOacrOasoeaykuacieS7u+S9leW+heabtOaWsOWIl+ihqCAoMSlgKTtcblx0XHRyZXR1cm47XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bHMgPSBhd2FpdCBmcy5yZWFkSlNPTihqc29uZmlsZSk7XG5cdH1cblxuXHRpZiAobHMgJiYgbHMubGVuZ3RoKVxuXHR7XG5cdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnN0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGRhdGE7XG5cblx0XHRcdFx0bGV0IGJhc2VQYXRoID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdGxldCBtc2c6IHN0cmluZztcblx0XHRcdFx0bGV0IF9kaWQgPSBmYWxzZTtcblx0XHRcdFx0bGV0IF9maWxlX2NoYW5nZWQ6IGJvb2xlYW47XG5cblx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGJhc2VQYXRoLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IHR4dHMgPSBhd2FpdCBnZXRUeHRMaXN0KGJhc2VQYXRoKTtcblxuXHRcdFx0XHRcdGxldCBtZXRhID0gZ2V0TWRjb25mTWV0YShwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRpZiAoIXR4dHMubGVuZ3RoKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgW3RvYzpjb250ZW50c11gLCBwYXRoTWFpbiwgbm92ZWxJRCwgJ+atpOebrumMhOeCuuabuOexpCcpO1xuXG5cdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0aWYgKG1ldGEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIG1ldGEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKGJhc2VQYXRoLCAn5bCO6Iiq55uu6YyELm1kJyk7XG5cblx0XHRcdFx0XHRsZXQgb2xkID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbHMudG9TdHJpbmcoKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW3RvYzpjb250ZW50c11gLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgcmV0ID0gYXdhaXQgcHJvY2Vzc1RvY0NvbnRlbnRzKGJhc2VQYXRoLCBmaWxlLCBhc3luYyBmdW5jdGlvbiAoYmFzZVBhdGg6IHN0cmluZywgLi4uYXJndilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHJldCA9IGF3YWl0IG1ha2VIZWFkZXIoYmFzZVBhdGgsIC4uLmFyZ3YpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChtZXRhKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWIgPSBuZXcgRXB1Yk1ha2VyKClcblx0XHRcdFx0XHRcdFx0XHRcdC53aXRoVGl0bGUobWV0YS5ub3ZlbC50aXRsZSwgbWV0YS5ub3ZlbC50aXRsZV9zaG9ydCB8fCBtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViX2RhdGEgPSBhd2FpdCBtYWtlRmlsZW5hbWUoe1xuXHRcdFx0XHRcdFx0XHRcdFx0aW5wdXRQYXRoOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdG91dHB1dFBhdGg6ICcnLFxuXHRcdFx0XHRcdFx0XHRcdFx0cGFkRW5kRGF0ZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHR1c2VUaXRsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGVuYW1lTG9jYWw6IG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHRub0xvZzogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHR9LCBlcHViLCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViX2ZpbGUgPSBlcHViX2RhdGEuYmFzZW5hbWUgKyBlcHViX2RhdGEuZXh0O1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9maWxlID0gYXdhaXQgbWFrZUZpbGVuYW1lVHh0KG1ldGEsIGVwdWJfZGF0YS5iYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgX3BhdGhNYWluID0gcGF0aE1haW47XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oXG5cdFx0XHRcdFx0XHRcdFx0XHRQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXRoTWFpbiArICdfb3V0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHQnUkVBRE1FLm1kJyxcblx0XHRcdFx0XHRcdFx0XHQpKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRfcGF0aE1haW4gPSBwYXRoTWFpbiArICdfb3V0Jztcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgbGlua19iYXNlID0gYCR7UHJvamVjdENvbmZpZy5vdXRwdXRVcmx9LyR7X3BhdGhNYWlufS9gO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IHQ6IHN0cmluZztcblx0XHRcdFx0XHRcdFx0XHRsZXQgbGluazogc3RyaW5nO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBfYWRkID0gW107XG5cblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgbGlua19iYXNlID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9ibHVlbG92ZXJzL25vZGUtbm92ZWwvYmxvYi9tYXN0ZXIvbGliL2xvY2FsZXMvJztcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEub3B0aW9ucyAmJiBtZXRhLm9wdGlvbnMubm92ZWwgJiYgbWV0YS5vcHRpb25zLnBhdHRlcm4pXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSBtZXRhLm9wdGlvbnMucGF0dGVybjtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGluayA9IG1ldGEub3B0aW9ucy5wYXR0ZXJuICsgJy50cyc7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0X2FkZC5wdXNoKGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSAn5qC85byP6IiH6K2v5ZCN5pW05ZCI5qij5byPJztcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGluayA9IG5vdmVsSUQgKyAnLnRzJztcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IG1kID0gYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaCgnLSAnICsgbWQgKyBgIC0g5aaC5p6c6YCj57WQ6Yyv6KqkIOiri+m7nlvpgJnoo6FdKCR7bGlua19iYXNlfSlgKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRsaW5rX2Jhc2UgPSBgJHtQcm9qZWN0Q29uZmlnLm91dHB1dFVybH0vJHtfcGF0aE1haW59L2A7XG5cblx0XHRcdFx0XHRcdFx0XHR0ID0gJ0VQVUInO1xuXHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBlcHViX2ZpbGU7XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYCA6aGVhcnQ6IFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSkgOmhlYXJ0OiBgKTtcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnVFhUJztcblx0XHRcdFx0XHRcdFx0XHRsaW5rID0gJ291dC8nICsgdHh0X2ZpbGU7XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKCctICcgKyBfYWRkLmpvaW4oYCDvvI8gYCkgKyBgIC0g5aaC5p6c6YCj57WQ6Yyv6KqkIOiri+m7nlvpgJnoo6FdKCR7bGlua19iYXNlfSlgKTtcblxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Y29uc3QgRElTQ09SRF9MSU5LID0gJ2h0dHBzOi8vZGlzY29yZC5nZy9NblhrcG1YJztcblxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHQgPSBESVNDT1JEX0xJTks7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbmsgPSBESVNDT1JEX0xJTks7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgbWQgPSBgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmt9KWA7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaChgLSA6bWVnYTogJHttZH0gLSDloLHpjK/kuqTmtYHnvqTvvIzlpoLmnpzlt7LntpPliqDlhaXoq4vpu55b6YCZ6KOhXShodHRwczovL2Rpc2NvcmRhcHAuY29tL2NoYW5uZWxzLzQ2Nzc5NDA4Nzc2OTAxNDI3My80Njc3OTQwODgyODUxNzU4MDkpIOaIliBbRGlzY29yZF0oaHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9jaGFubmVscy9AbWUpYCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHF0ID0gcXJjb2RlX2xpbmsoRElTQ09SRF9MSU5LKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcXUgPSBxcmNvZGVfbGluayh1cmwuZm9ybWF0KHVybC5wYXJzZShbXG5cdFx0XHRcdFx0XHRcdFx0XHRQcm9qZWN0Q29uZmlnLnNvdXJjZVVybCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdCflsI7oiKrnm67pjIQubWQnLFxuXHRcdFx0XHRcdFx0XHRcdF0uam9pbignLycpKSkpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGMgPSBgXFxuXFxuYDtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKGMgKyBbXG5cdFx0XHRcdFx0XHRcdFx0XHRgIVvlsI7oiKrnm67pjIRdKCR7bWRfbGlua19lc2NhcGUocXUpfSBcIuWwjuiIquebrumMhFwiKWAsXG5cdFx0XHRcdFx0XHRcdFx0XHQvL2AhW0Rpc2NvcmRdKCR7bWRfbGlua19lc2NhcGUocXQpfSlgLFxuXHRcdFx0XHRcdFx0XHRcdF0uam9pbignICAnKSArIGMpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKGxzKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0X2ZpbGVfY2hhbmdlZCA9IG9sZCAhPSBscztcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghYm9vbCB8fCBfZmlsZV9jaGFuZ2VkKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YFt0b2M6Y29udGVudHNdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRfZGlkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdF91cGRhdGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bXNnID0gYOebrumMhOaqlOahiOW3suWtmOWcqOS4puS4lOaykuacieiuiuWMlmA7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdG1zZyA9IGDnhKHms5XnlJ/miJDnm67pjITvvIzlj6/og73kuI3lrZjlnKjku7vkvZXnq6Dnr4DmqpTmoYhgO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0aWYgKF9kaWQpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGBbU0tJUF1gLFxuXHRcdFx0XHRcdFx0XHRwYXRoTWFpbiwgbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bXNnLFxuXHRcdFx0XHRcdFx0XHRib29sLFxuXHRcdFx0XHRcdFx0XHRfZmlsZV9jaGFuZ2VkLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0aWYgKF91cGRhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0YFt0b2M6Y29udGVudHNdIOWwjuiIquebrumMhC5tZGAsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdCovXG5cblx0XHRcdFx0XHRfdXBkYXRlID0gYFt0b2M6Y29udGVudHNdIOWwjuiIquebrumMhC5tZGA7XG5cblx0XHRcdFx0XHRjb25zb2xlLmluZm8oYFt0b2M6Y29udGVudHNdIOWujOaIkGApO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZShfY2FjaGVfaW5pdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDlrozmiJAg5pys5qyh54Sh5pu05paw5Lu75L2V5qqU5qGIYCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbdG9jOmNvbnRlbnRzXSBkb25lLmApO1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDmnKzmrKHmspLmnInku7vkvZXlvoXmm7TmlrDliJfooaggKDIpYCk7XG5cdH1cbn0pKCkpXG5cdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0e1xuXHRcdHJldHVybiBudWxsO1xuXG5cdFx0Y29uc3QgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdSRUFETUUubWQnKTtcblxuXHRcdGNvbnN0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdGF3YWl0IGNyZWF0ZVRvY1Jvb3QoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBudWxsLCB7XG5cdFx0XHRjYkZvckVhY2hTdWJOb3ZlbCh0ZXh0LCBpdGVtKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gaXRlbTtcblxuXHRcdFx0XHRsZXQgc3RhdCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgdGV4dF9wbHVzOiBzdHJpbmcgPSAnJztcblxuXHRcdFx0XHRpZiAoc3RhdC5lcHViX2RhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGJ1aWxkOiAke2NyZWF0ZU1vbWVudChzdGF0LmVwdWJfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyl9ICBgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0aWYgKGl0ZW0ubWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIGl0ZW0ubWV0YSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIXN0YXQuY2hhcHRlciB8fCAhaXRlbS5tZXRhKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmIChtZXRhKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGl0ZW0ubWV0YSA9IG1ldGE7XG5cdFx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBpdGVtLm1ldGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQqL1xuXG5cdFx0XHRcdGlmICghc3RhdC5jaGFwdGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICog6KOc5YWF5rKS5pyJ6KKr6KiY6YyE55qE6LOH6KiKXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0bGV0IHR4dHMgPSBub3ZlbEdsb2JieS5nbG9iYnlTeW5jKFtcblx0XHRcdFx0XHRcdCcqKi8qLnR4dCcsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCksXG5cdFx0XHRcdFx0XHR0aHJvd0VtcHR5OiBmYWxzZSxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGlmICh0eHRzICYmIHR4dHMubGVuZ3RoKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0YXQuY2hhcHRlcl9vbGQgPSBzdGF0LmNoYXB0ZXIgfCAwO1xuXHRcdFx0XHRcdFx0c3RhdC5jaGFwdGVyID0gdHh0cy5sZW5ndGg7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHN0YXQuY2hhcHRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHRfcGx1cyArPSBgY2hhcHRlcjogJHtzdGF0LmNoYXB0ZXJ9ICBgO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBzdGF0LmNoYXB0ZXIgLSAoc3RhdC5jaGFwdGVyX29sZCB8IDApO1xuXHRcdFx0XHRcdG4gPSBuIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAobiAhPSBzdGF0LmNoYXB0ZXIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBhZGQ6ICR7bn0gIGA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRleHRfcGx1cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQgKz0gJ1xcbiAgPGJyLz4nICsgdGV4dF9wbHVzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHRleHQ7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKG1kKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAobWQgJiYgbWQgIT09IG9sZClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IGZzLndyaXRlRmlsZShmaWxlLCBtZCk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0YFtUT0NdIHRvYyByb290YCxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdGlmICghX3VwZGF0ZSB8fCB0eXBlb2YgX3VwZGF0ZSAhPSAnc3RyaW5nJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfdXBkYXRlID0gYFtUT0NdIHRvYyByb290YDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6cm9vdF0g5a6M5oiQIOW3suabtOaWsGApO1xuXG5cdFx0XHRcdFx0Ly9fdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6cm9vdF0g5a6M5oiQIOS9huacrOasoeeEoeabtOWLleWFp+WuuWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0cmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4gcHJvY2Vzc1RvYyhQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpXG5cdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdGF3YWl0IFByb21pc2UuZWFjaChPYmplY3Qua2V5cyhscyksIGZ1bmN0aW9uIChwYXRoTWFpbilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4sICdSRUFETUUubWQnKTtcblxuXHRcdFx0XHRcdHJldHVybiBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKCFfdXBkYXRlIHx8IHR5cGVvZiBfdXBkYXRlICE9ICdzdHJpbmcnKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X3VwZGF0ZSA9IGBbVE9DXSBhdXRvIHVwZGF0ZSB0b2NgO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihlKSlcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHQnLWEnLFxuXHRcdFx0XHQnLW0nLFxuXHRcdFx0XHR0eXBlb2YgX3VwZGF0ZSA9PSAnc3RyaW5nJyA/IF91cGRhdGUgOiBgW1RPQ10gdXBkYXRlZGAsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdF91cGRhdGUgPSB0cnVlO1xuXHRcdH1cblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jXSDlrozmiJAg5Lim5LiU6Kmm5ZyWIHB1c2gg6IiHIOW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgY3AgPSBhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXG5cdFx0XHR1cGRhdGVDYWNoZUNvbmZpZ0hhc2hIRUFEKCk7XG5cdFx0fVxuXG5cdFx0bm92ZWxTdGF0Q2FjaGUuc2F2ZSgpO1xuXHR9KVxuO1xuXG4iXX0=