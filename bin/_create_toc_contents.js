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
const moment = require("moment");
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
                        let link_base = `https://gitlab.com/demonovel/epub-txt/blob/master/${_pathMain}/`;
                        let t;
                        let link;
                        t = 'EPUB';
                        link = epub_file;
                        let _add = [];
                        _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                        t = 'TXT';
                        link = 'out/' + txt_file;
                        _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                        ret.push('- ' + _add.join(` ／ `) + ` - 如果連結錯誤 請點[這裡](https://gitlab.com/demonovel/epub-txt/tree/master)`);
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
                            ret.push('- ' + md + ` - 如果連結錯誤 請點[這裡](https://github.com/bluelovers/node-novel/tree/master/lib/locales)`);
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
                            `https://gitee.com/bluelovers/novel/blob/master`,
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
                text_plus += `build: ${moment.unix(stat.epub_date).format('YYYY-MM-DD')}  `;
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
                text += '<br/>' + text_plus;
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
})
    .tap(async function () {
    if (_update) {
        log_1.default.info(`[toc] 完成 並且試圖 push 與 建立 PR`);
        let cp = await git_2.pushGit(project_config_1.default.novel_root, git_2.getPushUrlGitee(git_1.GIT_SETTING_DIST_NOVEL.url), true);
        await gitee_pr_1.createPullRequests();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUF1RjtBQUN2RixvQ0FBb0M7QUFDcEMsd0RBQXdEO0FBQ3hELHFDQUF1RTtBQUN2RSx3REFBNEQ7QUFDNUQsd0NBQTBFO0FBQzFFLHNDQUEwQztBQUMxQyxzREFBOEM7QUFDOUMsdUNBQXFFO0FBQ3JFLGlEQUF3RDtBQUN4RCxvQ0FBMkQ7QUFDM0QsNkJBQThCO0FBQzlCLCtCQUErQjtBQUMvQixzQ0FBc0M7QUFDdEMscURBQXFFO0FBQ3JFLDZDQUEwRDtBQUMxRCxxREFBNEU7QUFFNUUsb0NBQWlDO0FBQ2pDLGlDQUFrQztBQUVsQyxJQUFJLE9BQWdCLENBQUM7QUFFckIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztBQUUzQyxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVqQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUFDN0UsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRXRFLElBQUksRUFBMkMsQ0FBQztJQUVoRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXRDLGFBQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWhFLElBQUks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RjtBQUNGLENBQUMsQ0FBQztLQUNELEdBQUcsQ0FBQyxLQUFLO0lBRVQsSUFBSSxPQUFPLEVBQ1g7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFFM0MsSUFBSSxFQUFFLEdBQUcsTUFBTSxhQUFPLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQWUsQ0FBQyw0QkFBc0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwRyxNQUFNLDZCQUFrQixFQUFFLENBQUM7S0FDM0I7QUFDRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOC8xNC8wMTQuXG4gKi9cblxuaW1wb3J0IHsgZ2V0X2lkcywgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2luZGV4JztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IGNyZWF0ZVRvY1Jvb3QsIElEYXRhQXV0aG9yTm92ZWxJdGVtIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvYy1yb290JztcbmltcG9ydCBwcm9jZXNzVG9jQ29udGVudHMsIHsgbWFrZUhlYWRlciwgbWFrZUxpbmt9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBtYWtlRmlsZW5hbWUgfSBmcm9tICdub3ZlbC1lcHViL2xpYi90eHQyZXB1YjMnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCwgR0lUX1NFVFRJTkdfRVBVQiB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IHFyY29kZV9saW5rIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgZ2V0UHVzaFVybCwgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgeyBjcmVhdGVQdWxsUmVxdWVzdHMgfSBmcm9tICcuLi9zY3JpcHQvZ2l0ZWUtcHInO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMsIGNyb3NzU3Bhd25Bc3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IEVwdWJNYWtlciwgeyBoYXNoU3VtLCBzbHVnaWZ5IH0gZnJvbSAnZXB1Yi1tYWtlcjInO1xuaW1wb3J0IHR4dE1lcmdlLCB7IG1ha2VGaWxlbmFtZSBhcyBtYWtlRmlsZW5hbWVUeHQgfSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG5sZXQgX3VwZGF0ZTogYm9vbGVhbjtcblxuY29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgUHJvbWlzZS5yZXNvbHZlKChhc3luYyAoKSA9Plxue1xuXHRsZXQgX2NhY2hlX2luaXQgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLnRvY19jb250ZW50cy5jYWNoZScpO1xuXHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZGlmZi1ub3ZlbC5qc29uJyk7XG5cblx0bGV0IGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W107XG5cblx0bGV0IGJvb2wgPSBmcy5leGlzdHNTeW5jKF9jYWNoZV9pbml0KTtcblxuXHRjb25zb2xlLmRlYnVnKGBbdG9jOmNvbnRlbnRzXSDmmK/lkKblt7Lmm77ntpPliJ3lp4vljJblsI7oiKrnm67pjIRgLCBib29sLCBfY2FjaGVfaW5pdCk7XG5cblx0aWYgKCFib29sKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDliJ3lp4vljJbmiYDmnIkg5bCP6KqqIOeahCDlsI7oiKrnm67pjIRgKTtcblx0XHRscyA9IGF3YWl0IGdldF9pZHMoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHRcdFx0LnJlZHVjZShhc3luYyBmdW5jdGlvbiAobWVtbywgcGF0aE1haW46IHN0cmluZylcblx0XHRcdHtcblx0XHRcdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2I8c3RyaW5nPihbXG5cdFx0XHRcdFx0XHQnKi9SRUFETUUubWQnLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4pLFxuXHRcdFx0XHRcdH0pLCBmdW5jdGlvbiAocClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgbm92ZWxJRCA9IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHApKTtcblxuXHRcdFx0XHRcdFx0bWVtby5wdXNoKHsgcGF0aE1haW4sIG5vdmVsSUQgfSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdHJldHVybiBtZW1vO1xuXHRcdFx0fSwgW10pXG5cdFx0O1xuXHR9XG5cdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGNvbnNvbGUuZ3JleShgW3RvYzpjb250ZW50c10g5pys5qyh5rKS5pyJ5Lu75L2V5b6F5pu05paw5YiX6KGoICgxKWApO1xuXHRcdHJldHVybjtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRscyA9IGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlKTtcblx0fVxuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRsZXQgYmFzZVBhdGggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0bGV0IG1zZzogc3RyaW5nO1xuXHRcdFx0XHRsZXQgX2RpZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXQgX2ZpbGVfY2hhbmdlZDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihiYXNlUGF0aCwgJ+WwjuiIquebrumMhC5tZCcpO1xuXG5cdFx0XHRcdFx0bGV0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFt0b2M6Y29udGVudHNdYCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHJldCA9IGF3YWl0IHByb2Nlc3NUb2NDb250ZW50cyhiYXNlUGF0aCwgZmlsZSwgYXN5bmMgZnVuY3Rpb24gKGJhc2VQYXRoOiBzdHJpbmcsIC4uLmFyZ3YpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCByZXQgPSBhd2FpdCBtYWtlSGVhZGVyKGJhc2VQYXRoLCAuLi5hcmd2KTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgbWV0YTogSU1kY29uZk1ldGEgPSBhd2FpdCAoYXN5bmMgKCkgPT5cblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbihiYXNlUGF0aCwgJ1JFQURNRS5tZCcpKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdH0pKClcblx0XHRcdFx0XHRcdFx0XHQudGhlbihjaGtJbmZvKVxuXHRcdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG1ldGEpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1YiA9IG5ldyBFcHViTWFrZXIoKVxuXHRcdFx0XHRcdFx0XHRcdFx0LndpdGhUaXRsZShtZXRhLm5vdmVsLnRpdGxlLCBtZXRhLm5vdmVsLnRpdGxlX3Nob3J0IHx8IG1ldGEubm92ZWwudGl0bGVfemgpXG5cdFx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZGF0YSA9IGF3YWl0IG1ha2VGaWxlbmFtZSh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpbnB1dFBhdGg6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0b3V0cHV0UGF0aDogJycsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYWRFbmREYXRlOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdHVzZVRpdGxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZW5hbWVMb2NhbDogbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdG5vTG9nOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdH0sIGVwdWIsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGVwdWJfZmlsZSA9IGVwdWJfZGF0YS5iYXNlbmFtZSArIGVwdWJfZGF0YS5leHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgdHh0X2ZpbGUgPSBhd2FpdCBtYWtlRmlsZW5hbWVUeHQobWV0YSwgZXB1Yl9kYXRhLmJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfcGF0aE1haW4gPSBwYXRoTWFpbjtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihcblx0XHRcdFx0XHRcdFx0XHRcdFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGhNYWluICsgJ19vdXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdCdSRUFETUUubWQnLFxuXHRcdFx0XHRcdFx0XHRcdCkpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdF9wYXRoTWFpbiA9IHBhdGhNYWluICsgJ19vdXQnO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rX2Jhc2UgPSBgaHR0cHM6Ly9naXRsYWIuY29tL2RlbW9ub3ZlbC9lcHViLXR4dC9ibG9iL21hc3Rlci8ke19wYXRoTWFpbn0vYDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCB0OiBzdHJpbmc7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbms6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnRVBVQic7XG5cdFx0XHRcdFx0XHRcdFx0bGluayA9IGVwdWJfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfYWRkID0gW107XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnVFhUJztcblx0XHRcdFx0XHRcdFx0XHRsaW5rID0gJ291dC8nICsgdHh0X2ZpbGU7XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKCctICcgKyBfYWRkLmpvaW4oYCDvvI8gYCkgKyBgIC0g5aaC5p6c6YCj57WQ6Yyv6KqkIOiri+m7nlvpgJnoo6FdKGh0dHBzOi8vZ2l0bGFiLmNvbS9kZW1vbm92ZWwvZXB1Yi10eHQvdHJlZS9tYXN0ZXIpYCk7XG5cblxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxpbmtfYmFzZSA9ICdodHRwczovL2dpdGh1Yi5jb20vYmx1ZWxvdmVycy9ub2RlLW5vdmVsL2Jsb2IvbWFzdGVyL2xpYi9sb2NhbGVzLyc7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhLm9wdGlvbnMgJiYgbWV0YS5vcHRpb25zLm5vdmVsICYmIG1ldGEub3B0aW9ucy5wYXR0ZXJuKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0ID0gbWV0YS5vcHRpb25zLnBhdHRlcm47XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBtZXRhLm9wdGlvbnMucGF0dGVybiArICcudHMnO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0ID0gJ+agvOW8j+iIh+itr+WQjeaVtOWQiOaoo+W8jyc7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBub3ZlbElEICsgJy50cyc7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdGxldCBtZCA9IGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goJy0gJyArIG1kICsgYCAtIOWmguaenOmAo+e1kOmMr+iqpCDoq4vpu55b6YCZ6KOhXShodHRwczovL2dpdGh1Yi5jb20vYmx1ZWxvdmVycy9ub2RlLW5vdmVsL3RyZWUvbWFzdGVyL2xpYi9sb2NhbGVzKWApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRjb25zdCBESVNDT1JEX0xJTksgPSAnaHR0cHM6Ly9kaXNjb3JkLmdnL01uWGtwbVgnO1xuXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgdCA9IERJU0NPUkRfTElOSztcblx0XHRcdFx0XHRcdFx0XHRsZXQgbGluayA9IERJU0NPUkRfTElOSztcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBtZCA9IGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua30pYDtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKGAtICR7bWR9IC0g5aCx6Yyv5Lqk5rWB576k77yM5aaC5p6c5bey57aT5Yqg5YWl6KuL6bueW+mAmeijoV0oaHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9jaGFubmVscy80Njc3OTQwODc3NjkwMTQyNzMvNDY3Nzk0MDg4Mjg1MTc1ODA5KSDmiJYgW0Rpc2NvcmRdKGh0dHBzOi8vZGlzY29yZGFwcC5jb20vY2hhbm5lbHMvQG1lKWApO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBxdCA9IHFyY29kZV9saW5rKERJU0NPUkRfTElOSyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHF1ID0gcXJjb2RlX2xpbmsoW1xuXHRcdFx0XHRcdFx0XHRcdFx0YGh0dHBzOi8vZ2l0ZWUuY29tL2JsdWVsb3ZlcnMvbm92ZWwvYmxvYi9tYXN0ZXJgLFxuXHRcdFx0XHRcdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0J+WwjuiIquebrumMhC5tZCcsXG5cdFx0XHRcdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGMgPSBgXFxuXFxuYDtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKGMgKyBbXG5cdFx0XHRcdFx0XHRcdFx0XHRgIVvlsI7oiKrnm67pjIRdKCR7bWRfbGlua19lc2NhcGUocXUpfSlgLFxuXHRcdFx0XHRcdFx0XHRcdFx0YCFbRGlzY29yZF0oJHttZF9saW5rX2VzY2FwZShxdCl9KWAsXG5cdFx0XHRcdFx0XHRcdFx0XS5qb2luKCcgICcpICsgYyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAobHMpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRfZmlsZV9jaGFuZ2VkID0gb2xkICE9IGxzO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFib29sIHx8IF9maWxlX2NoYW5nZWQpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGBbdG9jOmNvbnRlbnRzXSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRfZGlkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdF91cGRhdGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bXNnID0gYOebrumMhOaqlOahiOW3suWtmOWcqOS4puS4lOaykuacieiuiuWMlmA7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdG1zZyA9IGDnhKHms5XnlJ/miJDnm67pjITvvIzlj6/og73kuI3lrZjlnKjku7vkvZXnq6Dnr4DmqpTmoYhgO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0aWYgKF9kaWQpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGBbU0tJUF1gLFxuXHRcdFx0XHRcdFx0XHRwYXRoTWFpbiwgbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bXNnLFxuXHRcdFx0XHRcdFx0XHRib29sLFxuXHRcdFx0XHRcdFx0XHRfZmlsZV9jaGFuZ2VkLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0aWYgKF91cGRhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLmluZm8oYFt0b2M6Y29udGVudHNdIOWujOaIkGApO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMuZW5zdXJlRmlsZShfY2FjaGVfaW5pdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDlrozmiJAg5pys5qyh54Sh5pu05paw5Lu75L2V5qqU5qGIYCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbdG9jOmNvbnRlbnRzXSBkb25lLmApO1xuXHRcdFx0fSlcblx0XHQ7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDmnKzmrKHmspLmnInku7vkvZXlvoXmm7TmlrDliJfooaggKDIpYCk7XG5cdH1cbn0pKCkpXG5cdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0e1xuXHRcdGNvbnN0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCAnUkVBRE1FLm1kJyk7XG5cblx0XHRjb25zdCBvbGQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBscy50b1N0cmluZygpO1xuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRhd2FpdCBjcmVhdGVUb2NSb290KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgbnVsbCwge1xuXHRcdFx0Y2JGb3JFYWNoU3ViTm92ZWwodGV4dCwgaXRlbSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IHsgcGF0aE1haW4sIG5vdmVsSUQgfSA9IGl0ZW07XG5cblx0XHRcdFx0bGV0IHN0YXQgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0bGV0IHRleHRfcGx1czogc3RyaW5nID0gJyc7XG5cblx0XHRcdFx0aWYgKHN0YXQuZXB1Yl9kYXRlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBidWlsZDogJHttb21lbnQudW5peChzdGF0LmVwdWJfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyl9ICBgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHN0YXQuY2hhcHRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHRfcGx1cyArPSBgY2hhcHRlcjogJHtzdGF0LmNoYXB0ZXJ9ICBgO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBzdGF0LmNoYXB0ZXIgLSAoc3RhdC5jaGFwdGVyX29sZCB8IDApO1xuXHRcdFx0XHRcdG4gPSBuIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAobiAhPSBzdGF0LmNoYXB0ZXIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBhZGQ6ICR7bn0gIGA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRleHRfcGx1cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQgKz0gJzxici8+JyArIHRleHRfcGx1cztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uIChtZClcblx0XHRcdHtcblx0XHRcdFx0aWYgKG1kICYmIG1kICE9PSBvbGQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBmcy53cml0ZUZpbGUoZmlsZSwgbWQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRgW1RPQ10gdG9jIHJvb3RgLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW3RvYzpyb290XSDlrozmiJAg5bey5pu05pawYCk7XG5cblx0XHRcdFx0XHRfdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6cm9vdF0g5a6M5oiQIOS9huacrOasoeeEoeabtOWLleWFp+WuuWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jXSDlrozmiJAg5Lim5LiU6Kmm5ZyWIHB1c2gg6IiHIOW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgY3AgPSBhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXHRcdH1cblx0fSlcbjtcbiJdfQ==