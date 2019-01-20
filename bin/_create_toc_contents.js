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
                let txts = await toc_contents_1.getList(basePath);
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
                if (!txts.length) {
                    log_1.default.warn(`[toc:contents]`, pathMain, novelID, '此目錄為書籤');
                    if (meta) {
                        novelStatCache.mdconf_set(pathMain, novelID, meta);
                    }
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
                        t = 'EPUB';
                        link = epub_file;
                        let _add = [];
                        _add.push(`[<span style="color:fuchsia;font-weight:bold;">${util_1.md_link_escape(t)}</span>](${link_base + index_1.md_href(link)})`);
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
            else {
                /**
                 * 補充沒有被記錄的資訊
                 */
                let txts = novelGlobby.globbySync([
                    '**/*.txt',
                ], {
                    cwd: path.join(project_config_1.default.novel_root, pathMain, novelID),
                    throwEmpty: false,
                });
                if (txts.length) {
                    stat.chapter_old = stat.chapter | 0;
                    stat.chapter = txts.length;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUErRztBQUMvRyxvQ0FBcUM7QUFDckMsbURBQW9EO0FBQ3BELHdEQUF3RDtBQUN4RCxxQ0FBdUU7QUFDdkUsd0RBQTBFO0FBQzFFLHdDQUEwRTtBQUMxRSxzQ0FBMEM7QUFDMUMsc0RBQThDO0FBQzlDLHVDQUFxRTtBQUNyRSxpREFBd0Q7QUFDeEQsb0NBQTJEO0FBQzNELDZCQUE4QjtBQUM5QiwrQkFBK0I7QUFDL0Isc0NBQXNDO0FBQ3RDLHFEQUFxRTtBQUNyRSw2Q0FBMEQ7QUFDMUQscURBQTRFO0FBRTVFLG9DQUFpQztBQUdqQyxJQUFJLE9BQWdCLENBQUM7QUFFckIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztBQUUzQyxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVqQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUFDN0UsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRXRFLElBQUksRUFBMkMsQ0FBQztJQUVoRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXRDLGFBQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWhFLElBQUks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LENBQUM7UUFFM0MsSUFBSSxFQUFFLEdBQUcsTUFBTSxhQUFPLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQWUsQ0FBQyw0QkFBc0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwRyxNQUFNLDZCQUFrQixFQUFFLENBQUM7S0FDM0I7QUFDRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOC8xNC8wMTQuXG4gKi9cblxuaW1wb3J0IHsgZ2V0X2lkcywgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2luZGV4JztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IGNyZWF0ZVRvY1Jvb3QsIElEYXRhQXV0aG9yTm92ZWxJdGVtIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvYy1yb290JztcbmltcG9ydCBwcm9jZXNzVG9jQ29udGVudHMsIHsgbWFrZUhlYWRlciwgbWFrZUxpbmssIGdldExpc3QgYXMgZ2V0VHh0TGlzdCB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IG5vdmVsR2xvYmJ5ID0gcmVxdWlyZSgnbm9kZS1ub3ZlbC1nbG9iYnkvZycpO1xuaW1wb3J0IHsgbWFrZUZpbGVuYW1lIH0gZnJvbSAnbm92ZWwtZXB1Yi9saWIvdHh0MmVwdWIzJztcbmltcG9ydCB7IEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwsIEdJVF9TRVRUSU5HX0VQVUIgfSBmcm9tICcuLi9kYXRhL2dpdCc7XG5pbXBvcnQgeyBjcmVhdGVNb21lbnQsIGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IHFyY29kZV9saW5rIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgZ2V0UHVzaFVybCwgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgeyBjcmVhdGVQdWxsUmVxdWVzdHMgfSBmcm9tICcuLi9zY3JpcHQvZ2l0ZWUtcHInO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMsIGNyb3NzU3Bhd25Bc3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IEVwdWJNYWtlciwgeyBoYXNoU3VtLCBzbHVnaWZ5IH0gZnJvbSAnZXB1Yi1tYWtlcjInO1xuaW1wb3J0IHR4dE1lcmdlLCB7IG1ha2VGaWxlbmFtZSBhcyBtYWtlRmlsZW5hbWVUeHQgfSBmcm9tICdub3ZlbC10eHQtbWVyZ2UnO1xuaW1wb3J0IG5vdmVsRXB1YiBmcm9tICdub3ZlbC1lcHViJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG5sZXQgX3VwZGF0ZTogYm9vbGVhbjtcblxuY29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgUHJvbWlzZS5yZXNvbHZlKChhc3luYyAoKSA9Plxue1xuXHRsZXQgX2NhY2hlX2luaXQgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLnRvY19jb250ZW50cy5jYWNoZScpO1xuXHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZGlmZi1ub3ZlbC5qc29uJyk7XG5cblx0bGV0IGxzOiB7IHBhdGhNYWluOiBzdHJpbmcsIG5vdmVsSUQ6IHN0cmluZyB9W107XG5cblx0bGV0IGJvb2wgPSBmcy5leGlzdHNTeW5jKF9jYWNoZV9pbml0KTtcblxuXHRjb25zb2xlLmRlYnVnKGBbdG9jOmNvbnRlbnRzXSDmmK/lkKblt7Lmm77ntpPliJ3lp4vljJblsI7oiKrnm67pjIRgLCBib29sLCBfY2FjaGVfaW5pdCk7XG5cblx0aWYgKCFib29sKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKGBbdG9jOmNvbnRlbnRzXSDliJ3lp4vljJbmiYDmnIkg5bCP6KqqIOeahCDlsI7oiKrnm67pjIRgKTtcblx0XHRscyA9IGF3YWl0IGdldF9pZHMoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHRcdFx0LnJlZHVjZShhc3luYyBmdW5jdGlvbiAobWVtbywgcGF0aE1haW46IHN0cmluZylcblx0XHRcdHtcblx0XHRcdFx0YXdhaXQgUHJvbWlzZVxuXHRcdFx0XHRcdC5tYXBTZXJpZXMoRmFzdEdsb2I8c3RyaW5nPihbXG5cdFx0XHRcdFx0XHQnKi9SRUFETUUubWQnLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgcGF0aE1haW4pLFxuXHRcdFx0XHRcdH0pLCBmdW5jdGlvbiAocClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgbm92ZWxJRCA9IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHApKTtcblxuXHRcdFx0XHRcdFx0bWVtby5wdXNoKHsgcGF0aE1haW4sIG5vdmVsSUQgfSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdHJldHVybiBtZW1vO1xuXHRcdFx0fSwgW10pXG5cdFx0O1xuXHR9XG5cdGVsc2UgaWYgKCFmcy5leGlzdHNTeW5jKGpzb25maWxlKSlcblx0e1xuXHRcdGNvbnNvbGUuZ3JleShgW3RvYzpjb250ZW50c10g5pys5qyh5rKS5pyJ5Lu75L2V5b6F5pu05paw5YiX6KGoICgxKWApO1xuXHRcdHJldHVybjtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRscyA9IGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlKTtcblx0fVxuXG5cdGlmIChscyAmJiBscy5sZW5ndGgpXG5cdHtcblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc3QgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gZGF0YTtcblxuXHRcdFx0XHRsZXQgYmFzZVBhdGggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0bGV0IG1zZzogc3RyaW5nO1xuXHRcdFx0XHRsZXQgX2RpZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXQgX2ZpbGVfY2hhbmdlZDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsICdSRUFETUUubWQnKSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdHh0cyA9IGF3YWl0IGdldFR4dExpc3QoYmFzZVBhdGgpO1xuXG5cdFx0XHRcdFx0bGV0IG1ldGE6IElNZGNvbmZNZXRhID0gYXdhaXQgKGFzeW5jICgpID0+XG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKGJhc2VQYXRoLCAnUkVBRE1FLm1kJykpO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KSgpXG5cdFx0XHRcdFx0XHQudGhlbihjaGtJbmZvKVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRpZiAoIXR4dHMubGVuZ3RoKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgW3RvYzpjb250ZW50c11gLCBwYXRoTWFpbiwgbm92ZWxJRCwgJ+atpOebrumMhOeCuuabuOexpCcpO1xuXG5cdFx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUubWRjb25mX3NldChwYXRoTWFpbiwgbm92ZWxJRCwgbWV0YSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihiYXNlUGF0aCwgJ+WwjuiIquebrumMhC5tZCcpO1xuXG5cdFx0XHRcdFx0bGV0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFt0b2M6Y29udGVudHNdYCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHJldCA9IGF3YWl0IHByb2Nlc3NUb2NDb250ZW50cyhiYXNlUGF0aCwgZmlsZSwgYXN5bmMgZnVuY3Rpb24gKGJhc2VQYXRoOiBzdHJpbmcsIC4uLmFyZ3YpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCByZXQgPSBhd2FpdCBtYWtlSGVhZGVyKGJhc2VQYXRoLCAuLi5hcmd2KTtcblxuXHRcdFx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViID0gbmV3IEVwdWJNYWtlcigpXG5cdFx0XHRcdFx0XHRcdFx0XHQud2l0aFRpdGxlKG1ldGEubm92ZWwudGl0bGUsIG1ldGEubm92ZWwudGl0bGVfc2hvcnQgfHwgbWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9kYXRhID0gYXdhaXQgbWFrZUZpbGVuYW1lKHtcblx0XHRcdFx0XHRcdFx0XHRcdGlucHV0UGF0aDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRvdXRwdXRQYXRoOiAnJyxcblx0XHRcdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0dXNlVGl0bGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlbmFtZUxvY2FsOiBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0fSwgZXB1YiwgbWV0YSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9maWxlID0gZXB1Yl9kYXRhLmJhc2VuYW1lICsgZXB1Yl9kYXRhLmV4dDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCB0eHRfZmlsZSA9IGF3YWl0IG1ha2VGaWxlbmFtZVR4dChtZXRhLCBlcHViX2RhdGEuYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9wYXRoTWFpbiA9IHBhdGhNYWluO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKFxuXHRcdFx0XHRcdFx0XHRcdFx0UHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdFx0XHRcdFx0cGF0aE1haW4gKyAnX291dCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0J1JFQURNRS5tZCcsXG5cdFx0XHRcdFx0XHRcdFx0KSkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0X3BhdGhNYWluID0gcGF0aE1haW4gKyAnX291dCc7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbmtfYmFzZSA9IGAke1Byb2plY3RDb25maWcub3V0cHV0VXJsfS8ke19wYXRoTWFpbn0vYDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCB0OiBzdHJpbmc7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbms6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnRVBVQic7XG5cdFx0XHRcdFx0XHRcdFx0bGluayA9IGVwdWJfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfYWRkID0gW107XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFs8c3BhbiBzdHlsZT1cImNvbG9yOmZ1Y2hzaWE7Zm9udC13ZWlnaHQ6Ym9sZDtcIj4ke21kX2xpbmtfZXNjYXBlKHQpfTwvc3Bhbj5dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYCk7XG5cblx0XHRcdFx0XHRcdFx0XHR0ID0gJ1RYVCc7XG5cdFx0XHRcdFx0XHRcdFx0bGluayA9ICdvdXQvJyArIHR4dF9maWxlO1xuXG5cdFx0XHRcdFx0XHRcdFx0X2FkZC5wdXNoKGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYCk7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaCgnLSAnICsgX2FkZC5qb2luKGAg77yPIGApICsgYCAtIOWmguaenOmAo+e1kOmMr+iqpCDoq4vpu55b6YCZ6KOhXSgke2xpbmtfYmFzZX0pYCk7XG5cblxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxpbmtfYmFzZSA9ICdodHRwczovL2dpdGh1Yi5jb20vYmx1ZWxvdmVycy9ub2RlLW5vdmVsL2Jsb2IvbWFzdGVyL2xpYi9sb2NhbGVzLyc7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhLm9wdGlvbnMgJiYgbWV0YS5vcHRpb25zLm5vdmVsICYmIG1ldGEub3B0aW9ucy5wYXR0ZXJuKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0ID0gbWV0YS5vcHRpb25zLnBhdHRlcm47XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBtZXRhLm9wdGlvbnMucGF0dGVybiArICcudHMnO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0ID0gJ+agvOW8j+iIh+itr+WQjeaVtOWQiOaoo+W8jyc7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxpbmsgPSBub3ZlbElEICsgJy50cyc7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdGxldCBtZCA9IGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goJy0gJyArIG1kICsgYCAtIOWmguaenOmAo+e1kOmMr+iqpCDoq4vpu55b6YCZ6KOhXSgke2xpbmtfYmFzZX0pYCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IERJU0NPUkRfTElOSyA9ICdodHRwczovL2Rpc2NvcmQuZ2cvTW5Ya3BtWCc7XG5cblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCB0ID0gRElTQ09SRF9MSU5LO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rID0gRElTQ09SRF9MSU5LO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG1kID0gYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rfSlgO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goYC0gJHttZH0gLSDloLHpjK/kuqTmtYHnvqTvvIzlpoLmnpzlt7LntpPliqDlhaXoq4vpu55b6YCZ6KOhXShodHRwczovL2Rpc2NvcmRhcHAuY29tL2NoYW5uZWxzLzQ2Nzc5NDA4Nzc2OTAxNDI3My80Njc3OTQwODgyODUxNzU4MDkpIOaIliBbRGlzY29yZF0oaHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9jaGFubmVscy9AbWUpYCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHF0ID0gcXJjb2RlX2xpbmsoRElTQ09SRF9MSU5LKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcXUgPSBxcmNvZGVfbGluayhbXG5cdFx0XHRcdFx0XHRcdFx0XHRQcm9qZWN0Q29uZmlnLnNvdXJjZVVybCxcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHRcdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0XHRcdCflsI7oiKrnm67pjIQubWQnLFxuXHRcdFx0XHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBjID0gYFxcblxcbmA7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaChjICsgW1xuXHRcdFx0XHRcdFx0XHRcdFx0YCFb5bCO6Iiq55uu6YyEXSgke21kX2xpbmtfZXNjYXBlKHF1KX0pYCxcblx0XHRcdFx0XHRcdFx0XHRcdGAhW0Rpc2NvcmRdKCR7bWRfbGlua19lc2NhcGUocXQpfSlgLFxuXHRcdFx0XHRcdFx0XHRcdF0uam9pbignICAnKSArIGMpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKGxzKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0X2ZpbGVfY2hhbmdlZCA9IG9sZCAhPSBscztcblxuXHRcdFx0XHRcdFx0XHRcdGlmICghYm9vbCB8fCBfZmlsZV9jaGFuZ2VkKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YFt0b2M6Y29udGVudHNdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRfZGlkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdF91cGRhdGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bXNnID0gYOebrumMhOaqlOahiOW3suWtmOWcqOS4puS4lOaykuacieiuiuWMlmA7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdG1zZyA9IGDnhKHms5XnlJ/miJDnm67pjITvvIzlj6/og73kuI3lrZjlnKjku7vkvZXnq6Dnr4DmqpTmoYhgO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0aWYgKF9kaWQpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGBbdG9jOmNvbnRlbnRzXWAsIHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGBbU0tJUF1gLFxuXHRcdFx0XHRcdFx0XHRwYXRoTWFpbiwgbm92ZWxJRCxcblx0XHRcdFx0XHRcdFx0bXNnLFxuXHRcdFx0XHRcdFx0XHRib29sLFxuXHRcdFx0XHRcdFx0XHRfZmlsZV9jaGFuZ2VkLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0aWYgKF91cGRhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdGBbdG9jOmNvbnRlbnRzXSDlsI7oiKrnm67pjIQubWRgLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhgW3RvYzpjb250ZW50c10g5a6M5oiQYCk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5lbnN1cmVGaWxlKF9jYWNoZV9pbml0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOWujOaIkCDmnKzmrKHnhKHmm7TmlrDku7vkvZXmqpTmoYhgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5sb2coYFt0b2M6Y29udGVudHNdIGRvbmUuYCk7XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOacrOasoeaykuacieS7u+S9leW+heabtOaWsOWIl+ihqCAoMilgKTtcblx0fVxufSkoKSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdSRUFETUUubWQnKTtcblxuXHRcdGNvbnN0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdGF3YWl0IGNyZWF0ZVRvY1Jvb3QoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBudWxsLCB7XG5cdFx0XHRjYkZvckVhY2hTdWJOb3ZlbCh0ZXh0LCBpdGVtKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gaXRlbTtcblxuXHRcdFx0XHRsZXQgc3RhdCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgdGV4dF9wbHVzOiBzdHJpbmcgPSAnJztcblxuXHRcdFx0XHRpZiAoc3RhdC5lcHViX2RhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGJ1aWxkOiAke2NyZWF0ZU1vbWVudChzdGF0LmVwdWJfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyl9ICBgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGl0ZW0ubWV0YSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5vdmVsU3RhdENhY2hlLm1kY29uZl9zZXQocGF0aE1haW4sIG5vdmVsSUQsIGl0ZW0ubWV0YSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc3RhdC5jaGFwdGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBjaGFwdGVyOiAke3N0YXQuY2hhcHRlcn0gIGA7XG5cblx0XHRcdFx0XHRsZXQgbiA9IHN0YXQuY2hhcHRlciAtIChzdGF0LmNoYXB0ZXJfb2xkIHwgMCk7XG5cdFx0XHRcdFx0biA9IG4gfHwgMDtcblxuXHRcdFx0XHRcdGlmIChuICE9IHN0YXQuY2hhcHRlcilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGFkZDogJHtufSAgYDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICog6KOc5YWF5rKS5pyJ6KKr6KiY6YyE55qE6LOH6KiKXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0bGV0IHR4dHMgPSBub3ZlbEdsb2JieS5nbG9iYnlTeW5jKFtcblx0XHRcdFx0XHRcdCcqKi8qLnR4dCcsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRCksXG5cdFx0XHRcdFx0XHR0aHJvd0VtcHR5OiBmYWxzZSxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGlmICh0eHRzLmxlbmd0aClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdGF0LmNoYXB0ZXJfb2xkID0gc3RhdC5jaGFwdGVyIHwgMDtcblx0XHRcdFx0XHRcdHN0YXQuY2hhcHRlciA9IHR4dHMubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0ZXh0X3BsdXMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0ICs9ICdcXG4gIDxici8+JyArIHRleHRfcGx1cztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uIChtZClcblx0XHRcdHtcblx0XHRcdFx0aWYgKG1kICYmIG1kICE9PSBvbGQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBmcy53cml0ZUZpbGUoZmlsZSwgbWQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRgW1RPQ10gdG9jIHJvb3RgLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW3RvYzpyb290XSDlrozmiJAg5bey5pu05pawYCk7XG5cblx0XHRcdFx0XHRfdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6cm9vdF0g5a6M5oiQIOS9huacrOasoeeEoeabtOWLleWFp+WuuWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jXSDlrozmiJAg5Lim5LiU6Kmm5ZyWIHB1c2gg6IiHIOW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgY3AgPSBhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXHRcdH1cblx0fSlcbjtcbiJdfQ==