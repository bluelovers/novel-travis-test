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
                        t = 'EPUB';
                        link = epub_file;
                        _add.push(` :heart: [${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)}) :heart: `);
                        t = 'TXT';
                        link = 'out/' + txt_file;
                        _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                        ret.push('- ' + _add.join(` ／ `) + ` - 如果連結錯誤 請點[這裡](${link_base}${_pathMain})`);
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
                await index_2.crossSpawnSync('git', [
                    'commit',
                    '-a',
                    '-m',
                    `[toc:contents] 導航目錄.md`,
                ], {
                    stdio: 'inherit',
                    cwd: project_config_1.default.novel_root,
                });
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
        await git_api_pr_1.createPullRequests();
        cache_json_1.updateCacheConfigHashHEAD();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUErRztBQUMvRyxvQ0FBcUM7QUFDckMsbURBQW9EO0FBQ3BELHdEQUF3RDtBQUN4RCxxQ0FBdUU7QUFDdkUsd0RBQTBFO0FBQzFFLHdDQUEwRTtBQUMxRSxzQ0FBMEM7QUFDMUMsc0RBQThDO0FBQzlDLDJEQUF1RTtBQUN2RSx1Q0FBcUU7QUFDckUscURBQTBEO0FBQzFELG9DQUEyRDtBQUMzRCw2QkFBOEI7QUFDOUIsK0JBQStCO0FBQy9CLHNDQUFzQztBQUV0Qyw2Q0FBMEQ7QUFDMUQscURBQTRFO0FBRTVFLG9DQUFpQztBQUVqQywyQ0FBc0U7QUFDdEUsMkJBQTRCO0FBRTVCLElBQUksT0FBZ0IsQ0FBQztBQUVyQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0FBRTNDLGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0lBRWpDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUM3RSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFFdEUsSUFBSSxFQUEyQyxDQUFDO0lBRWhELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFdEMsYUFBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUs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QkFDWCxJQUFJO2FBQ0osRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLHdCQUFhLENBQUMsVUFBVTthQUM3QixDQUFDLENBQUM7WUFFSCxNQUFNLHVCQUFlLENBQUMsS0FBSyxFQUFFO2dCQUM1QixRQUFRO2dCQUNSLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixnQkFBZ0I7YUFDaEIsRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLHdCQUFhLENBQUMsVUFBVTthQUM3QixDQUFDLENBQUM7WUFFSCxhQUFPLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFckMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNmO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7U0FDdkM7SUFDRixDQUFDLENBQUMsQ0FDRjtJQUVELGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUM7S0FDRCxHQUFHLENBQUMsS0FBSztJQUVULElBQUksT0FBTyxFQUNYO1FBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBRTNDLElBQUksRUFBRSxHQUFHLE1BQU0sYUFBTyxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLHFCQUFlLENBQUMsNEJBQXNCLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFcEcsTUFBTSwrQkFBa0IsRUFBRSxDQUFDO1FBRTNCLHNDQUF5QixFQUFFLENBQUM7S0FDNUI7QUFDRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOC8xNC8wMTQuXG4gKi9cblxuaW1wb3J0IHsgZ2V0X2lkcywgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2luZGV4JztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IGNyZWF0ZVRvY1Jvb3QsIElEYXRhQXV0aG9yTm92ZWxJdGVtIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvYy1yb290JztcbmltcG9ydCBwcm9jZXNzVG9jQ29udGVudHMsIHsgbWFrZUhlYWRlciwgbWFrZUxpbmssIGdldExpc3QgYXMgZ2V0VHh0TGlzdCB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IG5vdmVsR2xvYmJ5ID0gcmVxdWlyZSgnbm9kZS1ub3ZlbC1nbG9iYnkvZycpO1xuaW1wb3J0IHsgbWFrZUZpbGVuYW1lIH0gZnJvbSAnbm92ZWwtZXB1Yi9saWIvdHh0MmVwdWIzJztcbmltcG9ydCB7IEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsIEdJVF9TRVRUSU5HX0VQVUIgfSBmcm9tICcuLi9kYXRhL2dpdCc7XG5pbXBvcnQgeyBjcmVhdGVNb21lbnQsIGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IHFyY29kZV9saW5rIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgdXBkYXRlQ2FjaGVDb25maWdIYXNoSEVBRCB9IGZyb20gJy4uL3NjcmlwdC9jYWNoZS9jYWNoZS1qc29uJztcbmltcG9ydCB7IGdldFB1c2hVcmwsIGdldFB1c2hVcmxHaXRlZSwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdC1hcGktcHInO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMsIGNyb3NzU3Bhd25Bc3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IEVwdWJNYWtlciwgeyBoYXNoU3VtLCBzbHVnaWZ5IH0gZnJvbSAnZXB1Yi1tYWtlcjInO1xuaW1wb3J0IHR4dE1lcmdlLCB7IG1ha2VGaWxlbmFtZSBhcyBtYWtlRmlsZW5hbWVUeHQgfSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHsgZ2V0TWRjb25mTWV0YSwgZ2V0TWRjb25mTWV0YUJ5UGF0aCB9IGZyb20gJy4uL2xpYi91dGlsL21ldGEnO1xuaW1wb3J0IHVybCA9IHJlcXVpcmUoJ3VybCcpO1xuXG5sZXQgX3VwZGF0ZTogYm9vbGVhbjtcblxuY29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgUHJvbWlzZS5yZXNvbHZlKChhc3luYyAoKSA9Plxue1xuXHRsZXQgX2NhY2hlX2luaXQgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLnRvY19jb250ZW50cy5jYWNoZScpO1xuXHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZGlmZi1ub3ZlbC5qc29uJyk7XG5cblx0bGV0IGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W107XG5cblx0bGV0IGJvb2wgPSBmcy5leGlzdHNTeW5jKF9jYWNoZV9pbml0KTtcblxuXHRjb25zb2xlLmRlYnVnKGBbdG9jOmNvbnRlbnRzXSDmmK/lkKblt7Lmm77ntpPliJ3lp4vljJblsI7oiKrnm67pjIRgLCBib29sLCBfY2FjaGVfaW5pdCk7XG5cblx0aWYgKCFib29sKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDliJ3lp4vljJbmiYDmnIkg5bCP6KqqIOeahCDlsI7oiKrnm67pjIRgKTtcblx0XHRscyA9IGF3YWl0IGdldF9pZHMoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHRcdFx0LnJlZHVjZShhc3luYyBmdW5jdGlvbiAobWVtbywgcGF0aE1haW46IHN0cmluZylcblx0XHRcdHtcblx0XHRcdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2I8c3RyaW5nPihbXG5cdFx0XHRcdFx0XHQnKi9SRUFETUUubWQnLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4pLFxuXHRcdFx0XHRcdH0pLCBmdW5jdGlvbiAocClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgbm92ZWxJRCA9IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHApKTtcblxuXHRcdFx0XHRcdFx0bWVtby5wdXNoKHsgcGF0aE1haW4sIG5vdmVsSUQgfSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdHJldHVybiBtZW1vO1xuXHRcdFx0fSwgW10pXG5cdFx0O1xuXHR9XG5cdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGNvbnNvbGUuZ3JleShgW3RvYzpjb250ZW50c10g5pys5qyh5rKS5pyJ5Lu75L2V5b6F5pu05paw5YiX6KGoICgxKWApO1xuXHRcdHJldHVybjtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRscyA9IGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlKTtcblx0fVxuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRsZXQgYmFzZVBhdGggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0bGV0IG1zZzogc3RyaW5nO1xuXHRcdFx0XHRsZXQgX2RpZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXQgX2ZpbGVfY2hhbmdlZDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdHh0cyA9IGF3YWl0IGdldFR4dExpc3QoYmFzZVBhdGgpO1xuXG5cdFx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmICghdHh0cy5sZW5ndGgpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElELCAn5q2k55uu6YyE54K65pu457GkJyk7XG5cblx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUubWRjb25mX3NldChwYXRoTWFpbiwgbm92ZWxJRCwgbWV0YSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oYmFzZVBhdGgsICflsI7oiKrnm67pjIQubWQnKTtcblxuXHRcdFx0XHRcdGxldCBvbGQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBscy50b1N0cmluZygpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGxldCByZXQgPSBhd2FpdCBwcm9jZXNzVG9jQ29udGVudHMoYmFzZVBhdGgsIGZpbGUsIGFzeW5jIGZ1bmN0aW9uIChiYXNlUGF0aDogc3RyaW5nLCAuLi5hcmd2KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgcmV0ID0gYXdhaXQgbWFrZUhlYWRlcihiYXNlUGF0aCwgLi4uYXJndik7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1YiA9IG5ldyBFcHViTWFrZXIoKVxuXHRcdFx0XHRcdFx0XHRcdFx0LndpdGhUaXRsZShtZXRhLm5vdmVsLnRpdGxlLCBtZXRhLm5vdmVsLnRpdGxlX3Nob3J0IHx8IG1ldGEubm92ZWwudGl0bGVfemgpXG5cdFx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZGF0YSA9IGF3YWl0IG1ha2VGaWxlbmFtZSh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpbnB1dFBhdGg6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0b3V0cHV0UGF0aDogJycsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYWRFbmREYXRlOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdHVzZVRpdGxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdG5vTG9nOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdH0sIGVwdWIsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZmlsZSA9IGVwdWJfZGF0YS5iYXNlbmFtZSArIGVwdWJfZGF0YS5leHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgdHh0X2ZpbGUgPSBhd2FpdCBtYWtlRmlsZW5hbWVUeHQobWV0YSwgZXB1Yl9kYXRhLmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfcGF0aE1haW4gPSBwYXRoTWFpbjtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihcblx0XHRcdFx0XHRcdFx0XHRcdFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGhNYWluICsgJ19vdXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdCdSRUFETUUubWQnLFxuXHRcdFx0XHRcdFx0XHRcdCkpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdF9wYXRoTWFpbiA9IHBhdGhNYWluICsgJ19vdXQnO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rX2Jhc2UgPSBgJHtQcm9qZWN0Q29uZmlnLm91dHB1dFVybH0vJHtfcGF0aE1haW59L2A7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgdDogc3RyaW5nO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rOiBzdHJpbmc7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9hZGQgPSBbXTtcblxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxpbmtfYmFzZSA9ICdodHRwczovL2dpdGh1Yi5jb20vYmx1ZWxvdmVycy9ub2RlLW5vdmVsL2Jsb2IvbWFzdGVyL2xpYi9sb2NhbGVzLyc7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhLm9wdGlvbnMgJiYgbWV0YS5vcHRpb25zLm5vdmVsICYmIG1ldGEub3B0aW9ucy5wYXR0ZXJuKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0ID0gbWV0YS5vcHRpb25zLnBhdHRlcm47XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBtZXRhLm9wdGlvbnMucGF0dGVybiArICcudHMnO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0ID0gJ+agvOW8j+iIh+itr+WQjeaVtOWQiOaoo+W8jyc7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBub3ZlbElEICsgJy50cyc7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdGxldCBtZCA9IGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goJy0gJyArIG1kICsgYCAtIOWmguaenOmAo+e1kOmMr+iqpCDoq4vpu55b6YCZ6KOhXSgke2xpbmtfYmFzZX0pYCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0dCA9ICdFUFVCJztcblx0XHRcdFx0XHRcdFx0XHRsaW5rID0gZXB1Yl9maWxlO1xuXG5cdFx0XHRcdFx0XHRcdFx0X2FkZC5wdXNoKGAgOmhlYXJ0OiBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pIDpoZWFydDogYCk7XG5cblx0XHRcdFx0XHRcdFx0XHR0ID0gJ1RYVCc7XG5cdFx0XHRcdFx0XHRcdFx0bGluayA9ICdvdXQvJyArIHR4dF9maWxlO1xuXG5cdFx0XHRcdFx0XHRcdFx0X2FkZC5wdXNoKGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYCk7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaCgnLSAnICsgX2FkZC5qb2luKGAg77yPIGApICsgYCAtIOWmguaenOmAo+e1kOmMr+iqpCDoq4vpu55b6YCZ6KOhXSgke2xpbmtfYmFzZX0ke19wYXRoTWFpbn0pYCk7XG5cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IERJU0NPUkRfTElOSyA9ICdodHRwczovL2Rpc2NvcmQuZ2cvTW5Ya3BtWCc7XG5cblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCB0ID0gRElTQ09SRF9MSU5LO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rID0gRElTQ09SRF9MSU5LO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG1kID0gYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rfSlgO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goYC0gOm1lZ2E6ICR7bWR9IC0g5aCx6Yyv5Lqk5rWB576k77yM5aaC5p6c5bey57aT5Yqg5YWl6KuL6bueW+mAmeijoV0oaHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9jaGFubmVscy80Njc3OTQwODc3NjkwMTQyNzMvNDY3Nzk0MDg4Mjg1MTc1ODA5KSDmiJYgW0Rpc2NvcmRdKGh0dHBzOi8vZGlzY29yZGFwcC5jb20vY2hhbm5lbHMvQG1lKWApO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBxdCA9IHFyY29kZV9saW5rKERJU0NPUkRfTElOSyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHF1ID0gcXJjb2RlX2xpbmsodXJsLmZvcm1hdCh1cmwucGFyc2UoW1xuXHRcdFx0XHRcdFx0XHRcdFx0UHJvamVjdENvbmZpZy5zb3VyY2VVcmwsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHQn5bCO6Iiq55uu6YyELm1kJyxcblx0XHRcdFx0XHRcdFx0XHRdLmpvaW4oJy8nKSkpKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBjID0gYFxcblxcbmA7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaChjICsgW1xuXHRcdFx0XHRcdFx0XHRcdFx0YCFb5bCO6Iiq55uu6YyEXSgke21kX2xpbmtfZXNjYXBlKHF1KX0gXCLlsI7oiKrnm67pjIRcIilgLFxuXHRcdFx0XHRcdFx0XHRcdFx0Ly9gIVtEaXNjb3JkXSgke21kX2xpbmtfZXNjYXBlKHF0KX0pYCxcblx0XHRcdFx0XHRcdFx0XHRdLmpvaW4oJyAgJykgKyBjKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmIChscylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQgPSBvbGQgIT0gbHM7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIWJvb2wgfHwgX2ZpbGVfY2hhbmdlZClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGBbdG9jOmNvbnRlbnRzXSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdFx0XHRcdFx0X2RpZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRfdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdG1zZyA9IGDnm67pjITmqpTmoYjlt7LlrZjlnKjkuKbkuJTmspLmnInororljJZgO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRtc2cgPSBg54Sh5rOV55Sf5oiQ55uu6YyE77yM5Y+v6IO95LiN5a2Y5Zyo5Lu75L2V56ug56+A5qqU5qGIYDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdGlmIChfZGlkKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW3RvYzpjb250ZW50c11gLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmRpcih7XG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBgW1NLSVBdYCxcblx0XHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdG1zZyxcblx0XHRcdFx0XHRcdFx0Ym9vbCxcblx0XHRcdFx0XHRcdFx0X2ZpbGVfY2hhbmdlZCxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChfdXBkYXRlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRgW3RvYzpjb250ZW50c10g5bCO6Iiq55uu6YyELm1kYCxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmluZm8oYFt0b2M6Y29udGVudHNdIOWujOaIkGApO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZShfY2FjaGVfaW5pdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDlrozmiJAg5pys5qyh54Sh5pu05paw5Lu75L2V5qqU5qGIYCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbdG9jOmNvbnRlbnRzXSBkb25lLmApO1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDmnKzmrKHmspLmnInku7vkvZXlvoXmm7TmlrDliJfooaggKDIpYCk7XG5cdH1cbn0pKCkpXG5cdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0e1xuXHRcdGNvbnN0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCAnUkVBRE1FLm1kJyk7XG5cblx0XHRjb25zdCBvbGQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBscy50b1N0cmluZygpO1xuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRhd2FpdCBjcmVhdGVUb2NSb290KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgbnVsbCwge1xuXHRcdFx0Y2JGb3JFYWNoU3ViTm92ZWwodGV4dCwgaXRlbSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGl0ZW07XG5cblx0XHRcdFx0bGV0IHN0YXQgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0bGV0IHRleHRfcGx1czogc3RyaW5nID0gJyc7XG5cblx0XHRcdFx0aWYgKHN0YXQuZXB1Yl9kYXRlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBidWlsZDogJHtjcmVhdGVNb21lbnQoc3RhdC5lcHViX2RhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpfSAgYDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8qXG5cdFx0XHRcdGlmIChpdGVtLm1ldGEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBpdGVtLm1ldGEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCFzdGF0LmNoYXB0ZXIgfHwgIWl0ZW0ubWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBtZXRhID0gZ2V0TWRjb25mTWV0YShwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpdGVtLm1ldGEgPSBtZXRhO1xuXHRcdFx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUubWRjb25mX3NldChwYXRoTWFpbiwgbm92ZWxJRCwgaXRlbS5tZXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ki9cblxuXHRcdFx0XHRpZiAoIXN0YXQuY2hhcHRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIOijnOWFheaykuacieiiq+iomOmMhOeahOizh+ioilxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGxldCB0eHRzID0gbm92ZWxHbG9iYnkuZ2xvYmJ5U3luYyhbXG5cdFx0XHRcdFx0XHQnKiovKi50eHQnLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4sIG5vdmVsSUQpLFxuXHRcdFx0XHRcdFx0dGhyb3dFbXB0eTogZmFsc2UsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpZiAodHh0cyAmJiB0eHRzLmxlbmd0aClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdGF0LmNoYXB0ZXJfb2xkID0gc3RhdC5jaGFwdGVyIHwgMDtcblx0XHRcdFx0XHRcdHN0YXQuY2hhcHRlciA9IHR4dHMubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzdGF0LmNoYXB0ZXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGNoYXB0ZXI6ICR7c3RhdC5jaGFwdGVyfSAgYDtcblxuXHRcdFx0XHRcdGxldCBuID0gc3RhdC5jaGFwdGVyIC0gKHN0YXQuY2hhcHRlcl9vbGQgfCAwKTtcblx0XHRcdFx0XHRuID0gbiB8fCAwO1xuXG5cdFx0XHRcdFx0aWYgKG4gIT0gc3RhdC5jaGFwdGVyKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRleHRfcGx1cyArPSBgYWRkOiAke259ICBgO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0ZXh0X3BsdXMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0ICs9ICdcXG4gIDxici8+JyArIHRleHRfcGx1cztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uIChtZClcblx0XHRcdHtcblx0XHRcdFx0aWYgKG1kICYmIG1kICE9PSBvbGQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBmcy53cml0ZUZpbGUoZmlsZSwgbWQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRgW1RPQ10gdG9jIHJvb3RgLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW3RvYzpyb290XSDlrozmiJAg5bey5pu05pawYCk7XG5cblx0XHRcdFx0XHRfdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6cm9vdF0g5a6M5oiQIOS9huacrOasoeeEoeabtOWLleWFp+WuuWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jXSDlrozmiJAg5Lim5LiU6Kmm5ZyWIHB1c2gg6IiHIOW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgY3AgPSBhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXG5cdFx0XHR1cGRhdGVDYWNoZUNvbmZpZ0hhc2hIRUFEKCk7XG5cdFx0fVxuXHR9KVxuO1xuXG4iXX0=