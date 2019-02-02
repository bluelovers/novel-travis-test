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
    novelStatCache.save();
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUErRztBQUMvRyxvQ0FBcUM7QUFDckMsbURBQW9EO0FBQ3BELHdEQUF3RDtBQUN4RCxxQ0FBdUU7QUFDdkUsd0RBQTBFO0FBQzFFLHdDQUEwRTtBQUMxRSxzQ0FBMEM7QUFDMUMsc0RBQThDO0FBQzlDLDJEQUF1RTtBQUN2RSx1Q0FBcUU7QUFDckUscURBQTBEO0FBQzFELG9DQUEyRDtBQUMzRCw2QkFBOEI7QUFDOUIsK0JBQStCO0FBQy9CLHNDQUFzQztBQUV0Qyw2Q0FBMEQ7QUFDMUQscURBQTRFO0FBRTVFLG9DQUFpQztBQUVqQywyQ0FBc0U7QUFDdEUsMkJBQTRCO0FBRTVCLElBQUksT0FBeUIsQ0FBQztBQUU5QixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0FBRTNDLGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0lBRWpDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUM3RSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFFdEUsSUFBSSxFQUEyQyxDQUFDO0lBRWhELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFdEMsYUFBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUs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ICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOC8xNC8wMTQuXG4gKi9cblxuaW1wb3J0IHsgZ2V0X2lkcywgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2luZGV4JztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IGNyZWF0ZVRvY1Jvb3QsIElEYXRhQXV0aG9yTm92ZWxJdGVtIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvYy1yb290JztcbmltcG9ydCBwcm9jZXNzVG9jQ29udGVudHMsIHsgbWFrZUhlYWRlciwgbWFrZUxpbmssIGdldExpc3QgYXMgZ2V0VHh0TGlzdCB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IG5vdmVsR2xvYmJ5ID0gcmVxdWlyZSgnbm9kZS1ub3ZlbC1nbG9iYnkvZycpO1xuaW1wb3J0IHsgbWFrZUZpbGVuYW1lIH0gZnJvbSAnbm92ZWwtZXB1Yi9saWIvdHh0MmVwdWIzJztcbmltcG9ydCB7IEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsIEdJVF9TRVRUSU5HX0VQVUIgfSBmcm9tICcuLi9kYXRhL2dpdCc7XG5pbXBvcnQgeyBjcmVhdGVNb21lbnQsIGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IHFyY29kZV9saW5rIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgdXBkYXRlQ2FjaGVDb25maWdIYXNoSEVBRCB9IGZyb20gJy4uL3NjcmlwdC9jYWNoZS9jYWNoZS1qc29uJztcbmltcG9ydCB7IGdldFB1c2hVcmwsIGdldFB1c2hVcmxHaXRlZSwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdC1hcGktcHInO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMsIGNyb3NzU3Bhd25Bc3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IEVwdWJNYWtlciwgeyBoYXNoU3VtLCBzbHVnaWZ5IH0gZnJvbSAnZXB1Yi1tYWtlcjInO1xuaW1wb3J0IHR4dE1lcmdlLCB7IG1ha2VGaWxlbmFtZSBhcyBtYWtlRmlsZW5hbWVUeHQgfSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHsgZ2V0TWRjb25mTWV0YSwgZ2V0TWRjb25mTWV0YUJ5UGF0aCB9IGZyb20gJy4uL2xpYi91dGlsL21ldGEnO1xuaW1wb3J0IHVybCA9IHJlcXVpcmUoJ3VybCcpO1xuXG5sZXQgX3VwZGF0ZTogYm9vbGVhbiB8IHN0cmluZztcblxuY29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgUHJvbWlzZS5yZXNvbHZlKChhc3luYyAoKSA9Plxue1xuXHRsZXQgX2NhY2hlX2luaXQgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLnRvY19jb250ZW50cy5jYWNoZScpO1xuXHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZGlmZi1ub3ZlbC5qc29uJyk7XG5cblx0bGV0IGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W107XG5cblx0bGV0IGJvb2wgPSBmcy5leGlzdHNTeW5jKF9jYWNoZV9pbml0KTtcblxuXHRjb25zb2xlLmRlYnVnKGBbdG9jOmNvbnRlbnRzXSDmmK/lkKblt7Lmm77ntpPliJ3lp4vljJblsI7oiKrnm67pjIRgLCBib29sLCBfY2FjaGVfaW5pdCk7XG5cblx0aWYgKCFib29sKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDliJ3lp4vljJbmiYDmnIkg5bCP6KqqIOeahCDlsI7oiKrnm67pjIRgKTtcblx0XHRscyA9IGF3YWl0IGdldF9pZHMoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHRcdFx0LnJlZHVjZShhc3luYyBmdW5jdGlvbiAobWVtbywgcGF0aE1haW46IHN0cmluZylcblx0XHRcdHtcblx0XHRcdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2I8c3RyaW5nPihbXG5cdFx0XHRcdFx0XHQnKi9SRUFETUUubWQnLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4pLFxuXHRcdFx0XHRcdH0pLCBmdW5jdGlvbiAocClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgbm92ZWxJRCA9IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHApKTtcblxuXHRcdFx0XHRcdFx0bWVtby5wdXNoKHsgcGF0aE1haW4sIG5vdmVsSUQgfSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdHJldHVybiBtZW1vO1xuXHRcdFx0fSwgW10pXG5cdFx0O1xuXHR9XG5cdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGNvbnNvbGUuZ3JleShgW3RvYzpjb250ZW50c10g5pys5qyh5rKS5pyJ5Lu75L2V5b6F5pu05paw5YiX6KGoICgxKWApO1xuXHRcdHJldHVybjtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRscyA9IGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlKTtcblx0fVxuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRsZXQgYmFzZVBhdGggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0bGV0IG1zZzogc3RyaW5nO1xuXHRcdFx0XHRsZXQgX2RpZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXQgX2ZpbGVfY2hhbmdlZDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdHh0cyA9IGF3YWl0IGdldFR4dExpc3QoYmFzZVBhdGgpO1xuXG5cdFx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmICghdHh0cy5sZW5ndGgpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElELCAn5q2k55uu6YyE54K65pu457GkJyk7XG5cblx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUubWRjb25mX3NldChwYXRoTWFpbiwgbm92ZWxJRCwgbWV0YSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oYmFzZVBhdGgsICflsI7oiKrnm67pjIQubWQnKTtcblxuXHRcdFx0XHRcdGxldCBvbGQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBscy50b1N0cmluZygpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGxldCByZXQgPSBhd2FpdCBwcm9jZXNzVG9jQ29udGVudHMoYmFzZVBhdGgsIGZpbGUsIGFzeW5jIGZ1bmN0aW9uIChiYXNlUGF0aDogc3RyaW5nLCAuLi5hcmd2KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgcmV0ID0gYXdhaXQgbWFrZUhlYWRlcihiYXNlUGF0aCwgLi4uYXJndik7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1YiA9IG5ldyBFcHViTWFrZXIoKVxuXHRcdFx0XHRcdFx0XHRcdFx0LndpdGhUaXRsZShtZXRhLm5vdmVsLnRpdGxlLCBtZXRhLm5vdmVsLnRpdGxlX3Nob3J0IHx8IG1ldGEubm92ZWwudGl0bGVfemgpXG5cdFx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZGF0YSA9IGF3YWl0IG1ha2VGaWxlbmFtZSh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpbnB1dFBhdGg6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0b3V0cHV0UGF0aDogJycsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYWRFbmREYXRlOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdHVzZVRpdGxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdG5vTG9nOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdH0sIGVwdWIsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZmlsZSA9IGVwdWJfZGF0YS5iYXNlbmFtZSArIGVwdWJfZGF0YS5leHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgdHh0X2ZpbGUgPSBhd2FpdCBtYWtlRmlsZW5hbWVUeHQobWV0YSwgZXB1Yl9kYXRhLmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfcGF0aE1haW4gPSBwYXRoTWFpbjtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihcblx0XHRcdFx0XHRcdFx0XHRcdFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGhNYWluICsgJ19vdXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdCdSRUFETUUubWQnLFxuXHRcdFx0XHRcdFx0XHRcdCkpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdF9wYXRoTWFpbiA9IHBhdGhNYWluICsgJ19vdXQnO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rX2Jhc2UgPSBgJHtQcm9qZWN0Q29uZmlnLm91dHB1dFVybH0vJHtfcGF0aE1haW59L2A7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgdDogc3RyaW5nO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rOiBzdHJpbmc7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9hZGQgPSBbXTtcblxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rX2Jhc2UgPSAnaHR0cHM6Ly9naXRodWIuY29tL2JsdWVsb3ZlcnMvbm9kZS1ub3ZlbC9ibG9iL21hc3Rlci9saWIvbG9jYWxlcy8nO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YS5vcHRpb25zICYmIG1ldGEub3B0aW9ucy5ub3ZlbCAmJiBtZXRhLm9wdGlvbnMucGF0dGVybilcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dCA9IG1ldGEub3B0aW9ucy5wYXR0ZXJuO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsaW5rID0gbWV0YS5vcHRpb25zLnBhdHRlcm4gKyAnLnRzJztcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dCA9ICfmoLzlvI/oiIfora/lkI3mlbTlkIjmqKPlvI8nO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsaW5rID0gbm92ZWxJRCArICcudHMnO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgbWQgPSBgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWA7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKCctICcgKyBtZCArIGAgLSDlpoLmnpzpgKPntZDpjK/oqqQg6KuL6bueW+mAmeijoV0oJHtsaW5rX2Jhc2V9KWApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGxpbmtfYmFzZSA9IGAke1Byb2plY3RDb25maWcub3V0cHV0VXJsfS8ke19wYXRoTWFpbn0vYDtcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnRVBVQic7XG5cdFx0XHRcdFx0XHRcdFx0bGluayA9IGVwdWJfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgIDpoZWFydDogWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KSA6aGVhcnQ6IGApO1xuXG5cdFx0XHRcdFx0XHRcdFx0dCA9ICdUWFQnO1xuXHRcdFx0XHRcdFx0XHRcdGxpbmsgPSAnb3V0LycgKyB0eHRfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goJy0gJyArIF9hZGQuam9pbihgIO+8jyBgKSArIGAgLSDlpoLmnpzpgKPntZDpjK/oqqQg6KuL6bueW+mAmeijoV0oJHtsaW5rX2Jhc2V9KWApO1xuXG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRjb25zdCBESVNDT1JEX0xJTksgPSAnaHR0cHM6Ly9kaXNjb3JkLmdnL01uWGtwbVgnO1xuXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgdCA9IERJU0NPUkRfTElOSztcblx0XHRcdFx0XHRcdFx0XHRsZXQgbGluayA9IERJU0NPUkRfTElOSztcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBtZCA9IGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua30pYDtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKGAtIDptZWdhOiAke21kfSAtIOWgsemMr+S6pOa1gee+pO+8jOWmguaenOW3sue2k+WKoOWFpeiri+m7nlvpgJnoo6FdKGh0dHBzOi8vZGlzY29yZGFwcC5jb20vY2hhbm5lbHMvNDY3Nzk0MDg3NzY5MDE0MjczLzQ2Nzc5NDA4ODI4NTE3NTgwOSkg5oiWIFtEaXNjb3JkXShodHRwczovL2Rpc2NvcmRhcHAuY29tL2NoYW5uZWxzL0BtZSlgKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcXQgPSBxcmNvZGVfbGluayhESVNDT1JEX0xJTkspO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBxdSA9IHFyY29kZV9saW5rKHVybC5mb3JtYXQodXJsLnBhcnNlKFtcblx0XHRcdFx0XHRcdFx0XHRcdFByb2plY3RDb25maWcuc291cmNlVXJsLFxuXHRcdFx0XHRcdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0J+WwjuiIquebrumMhC5tZCcsXG5cdFx0XHRcdFx0XHRcdFx0XS5qb2luKCcvJykpKSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgYyA9IGBcXG5cXG5gO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goYyArIFtcblx0XHRcdFx0XHRcdFx0XHRcdGAhW+WwjuiIquebrumMhF0oJHttZF9saW5rX2VzY2FwZShxdSl9IFwi5bCO6Iiq55uu6YyEXCIpYCxcblx0XHRcdFx0XHRcdFx0XHRcdC8vYCFbRGlzY29yZF0oJHttZF9saW5rX2VzY2FwZShxdCl9KWAsXG5cdFx0XHRcdFx0XHRcdFx0XS5qb2luKCcgICcpICsgYyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAobHMpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRfZmlsZV9jaGFuZ2VkID0gb2xkICE9IGxzO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFib29sIHx8IF9maWxlX2NoYW5nZWQpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Lypcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRgW3RvYzpjb250ZW50c10gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdCovXG5cblx0XHRcdFx0XHRcdFx0XHRcdF9kaWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0X3VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRtc2cgPSBg55uu6YyE5qqU5qGI5bey5a2Y5Zyo5Lim5LiU5rKS5pyJ6K6K5YyWYDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bXNnID0gYOeEoeazleeUn+aIkOebrumMhO+8jOWPr+iDveS4jeWtmOWcqOS7u+S9leeroOevgOaqlOahiGA7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRpZiAoX2RpZClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6Y29udGVudHNdYCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogYFtTS0lQXWAsXG5cdFx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRtc2csXG5cdFx0XHRcdFx0XHRcdGJvb2wsXG5cdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoX3VwZGF0ZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRgW3RvYzpjb250ZW50c10g5bCO6Iiq55uu6YyELm1kYCxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdF91cGRhdGUgPSBgW3RvYzpjb250ZW50c10g5bCO6Iiq55uu6YyELm1kYDtcblxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhgW3RvYzpjb250ZW50c10g5a6M5oiQYCk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5lbnN1cmVGaWxlKF9jYWNoZV9pbml0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOWujOaIkCDmnKzmrKHnhKHmm7TmlrDku7vkvZXmqpTmoYhgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5sb2coYFt0b2M6Y29udGVudHNdIGRvbmUuYCk7XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOacrOasoeaykuacieS7u+S9leW+heabtOaWsOWIl+ihqCAoMilgKTtcblx0fVxufSkoKSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdSRUFETUUubWQnKTtcblxuXHRcdGNvbnN0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdGF3YWl0IGNyZWF0ZVRvY1Jvb3QoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBudWxsLCB7XG5cdFx0XHRjYkZvckVhY2hTdWJOb3ZlbCh0ZXh0LCBpdGVtKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gaXRlbTtcblxuXHRcdFx0XHRsZXQgc3RhdCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgdGV4dF9wbHVzOiBzdHJpbmcgPSAnJztcblxuXHRcdFx0XHRpZiAoc3RhdC5lcHViX2RhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGJ1aWxkOiAke2NyZWF0ZU1vbWVudChzdGF0LmVwdWJfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyl9ICBgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Lypcblx0XHRcdFx0aWYgKGl0ZW0ubWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIGl0ZW0ubWV0YSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIXN0YXQuY2hhcHRlciB8fCAhaXRlbS5tZXRhKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG1ldGEgPSBnZXRNZGNvbmZNZXRhKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGlmIChtZXRhKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGl0ZW0ubWV0YSA9IG1ldGE7XG5cdFx0XHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5tZGNvbmZfc2V0KHBhdGhNYWluLCBub3ZlbElELCBpdGVtLm1ldGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQqL1xuXG5cdFx0XHRcdGlmICghc3RhdC5jaGFwdGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICog6KOc5YWF5rKS5pyJ6KKr6KiY6YyE55qE6LOH6KiKXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0bGV0IHR4dHMgPSBub3ZlbEdsb2JieS5nbG9iYnlTeW5jKFtcblx0XHRcdFx0XHRcdCcqKi8qLnR4dCcsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCksXG5cdFx0XHRcdFx0XHR0aHJvd0VtcHR5OiBmYWxzZSxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGlmICh0eHRzICYmIHR4dHMubGVuZ3RoKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0YXQuY2hhcHRlcl9vbGQgPSBzdGF0LmNoYXB0ZXIgfCAwO1xuXHRcdFx0XHRcdFx0c3RhdC5jaGFwdGVyID0gdHh0cy5sZW5ndGg7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHN0YXQuY2hhcHRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHRfcGx1cyArPSBgY2hhcHRlcjogJHtzdGF0LmNoYXB0ZXJ9ICBgO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBzdGF0LmNoYXB0ZXIgLSAoc3RhdC5jaGFwdGVyX29sZCB8IDApO1xuXHRcdFx0XHRcdG4gPSBuIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAobiAhPSBzdGF0LmNoYXB0ZXIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBhZGQ6ICR7bn0gIGA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRleHRfcGx1cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQgKz0gJ1xcbiAgPGJyLz4nICsgdGV4dF9wbHVzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHRleHQ7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKG1kKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAobWQgJiYgbWQgIT09IG9sZClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IGZzLndyaXRlRmlsZShmaWxlLCBtZCk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0YFtUT0NdIHRvYyByb290YCxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdGlmICghX3VwZGF0ZSB8fCB0eXBlb2YgX3VwZGF0ZSAhPSAnc3RyaW5nJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfdXBkYXRlID0gYFtUT0NdIHRvYyByb290YDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6cm9vdF0g5a6M5oiQIOW3suabtOaWsGApO1xuXG5cdFx0XHRcdFx0Ly9fdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6cm9vdF0g5a6M5oiQIOS9huacrOasoeeEoeabtOWLleWFp+WuuWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHQnLWEnLFxuXHRcdFx0XHQnLW0nLFxuXHRcdFx0XHR0eXBlb2YgX3VwZGF0ZSA9PSAnc3RyaW5nJyA/IF91cGRhdGUgOiBgW1RPQ10gdXBkYXRlZGAsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdF91cGRhdGUgPSB0cnVlO1xuXHRcdH1cblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jXSDlrozmiJAg5Lim5LiU6Kmm5ZyWIHB1c2gg6IiHIOW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgY3AgPSBhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXG5cdFx0XHR1cGRhdGVDYWNoZUNvbmZpZ0hhc2hIRUFEKCk7XG5cdFx0fVxuXHR9KVxuO1xuXG4iXX0=