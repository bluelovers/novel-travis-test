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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUF1RjtBQUN2RixvQ0FBb0M7QUFDcEMsd0RBQXdEO0FBQ3hELHFDQUF1RTtBQUN2RSx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNDQUEwQztBQUMxQyxzREFBOEM7QUFDOUMsdUNBQXFFO0FBQ3JFLGlEQUF3RDtBQUN4RCxvQ0FBMkQ7QUFDM0QsNkJBQThCO0FBQzlCLCtCQUErQjtBQUMvQixzQ0FBc0M7QUFDdEMscURBQXFFO0FBQ3JFLDZDQUEwRDtBQUMxRCxxREFBNEU7QUFFNUUsb0NBQWlDO0FBR2pDLElBQUksT0FBZ0IsQ0FBQztBQUVyQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0FBRTNDLGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0lBRWpDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUM3RSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFFdEUsSUFBSSxFQUEyQyxDQUFDO0lBRWhELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFdEMsYUFBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFaEUsSUFBSSxDQUFDLElBQUksRUFD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QztZQUVILGFBQU8sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUVyQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7YUFFRDtZQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUN2QztJQUNGLENBQUMsQ0FBQyxDQUNGO0lBRUQsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztLQUNELEdBQUcsQ0FBQyxLQUFLO0lBRVQsSUFBSSxPQUFPLEVBQ1g7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFFM0MsSUFBSSxFQUFFLEdBQUcsTUFBTSxhQUFPLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQWUsQ0FBQyw0QkFBc0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwRyxNQUFNLDZCQUFrQixFQUFFLENBQUM7S0FDM0I7QUFDRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOC8xNC8wMTQuXG4gKi9cblxuaW1wb3J0IHsgZ2V0X2lkcywgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2luZGV4JztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IGNyZWF0ZVRvY1Jvb3QsIElEYXRhQXV0aG9yTm92ZWxJdGVtIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvYy1yb290JztcbmltcG9ydCBwcm9jZXNzVG9jQ29udGVudHMsIHsgbWFrZUhlYWRlciwgbWFrZUxpbmt9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBtYWtlRmlsZW5hbWUgfSBmcm9tICdub3ZlbC1lcHViL2xpYi90eHQyZXB1YjMnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCwgR0lUX1NFVFRJTkdfRVBVQiB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyZWF0ZU1vbWVudCwgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgcXJjb2RlX2xpbmsgfSBmcm9tICcuLi9saWIvdXRpbCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCB7IGNyZWF0ZVB1bGxSZXF1ZXN0cyB9IGZyb20gJy4uL3NjcmlwdC9naXRlZS1wcic7XG5pbXBvcnQgeyBjcm9zc1NwYXduU3luYywgY3Jvc3NTcGF3bkFzeW5jIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBGYXN0R2xvYiBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0IHsgbWRjb25mX3BhcnNlLCBJTWRjb25mTWV0YSwgY2hrSW5mbyB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQgRXB1Yk1ha2VyLCB7IGhhc2hTdW0sIHNsdWdpZnkgfSBmcm9tICdlcHViLW1ha2VyMic7XG5pbXBvcnQgdHh0TWVyZ2UsIHsgbWFrZUZpbGVuYW1lIGFzIG1ha2VGaWxlbmFtZVR4dCB9IGZyb20gJ25vdmVsLXR4dC1tZXJnZSc7XG5pbXBvcnQgbm92ZWxFcHViIGZyb20gJ25vdmVsLWVwdWInO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5cbmxldCBfdXBkYXRlOiBib29sZWFuO1xuXG5jb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cbmNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lUXG5dKSAmJiBQcm9taXNlLnJlc29sdmUoKGFzeW5jICgpID0+XG57XG5cdGxldCBfY2FjaGVfaW5pdCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcudG9jX2NvbnRlbnRzLmNhY2hlJyk7XG5cdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdkaWZmLW5vdmVsLmpzb24nKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXTtcblxuXHRsZXQgYm9vbCA9IGZzLmV4aXN0c1N5bmMoX2NhY2hlX2luaXQpO1xuXG5cdGNvbnNvbGUuZGVidWcoYFt0b2M6Y29udGVudHNdIOaYr+WQpuW3suabvue2k+WIneWni+WMluWwjuiIquebrumMhGAsIGJvb2wsIF9jYWNoZV9pbml0KTtcblxuXHRpZiAoIWJvb2wpXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOWIneWni+WMluaJgOaciSDlsI/oqqog55qEIOWwjuiIquebrumMhGApO1xuXHRcdGxzID0gYXdhaXQgZ2V0X2lkcyhQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpXG5cdFx0XHQucmVkdWNlKGFzeW5jIGZ1bmN0aW9uIChtZW1vLCBwYXRoTWFpbjogc3RyaW5nKVxuXHRcdFx0e1xuXHRcdFx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHRcdFx0Lm1hcFNlcmllcyhGYXN0R2xvYjxzdHJpbmc+KFtcblx0XHRcdFx0XHRcdCcqL1JFQURNRS5tZCcsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiksXG5cdFx0XHRcdFx0fSksIGZ1bmN0aW9uIChwKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBub3ZlbElEID0gcGF0aC5iYXNlbmFtZShwYXRoLmRpcm5hbWUocCkpO1xuXG5cdFx0XHRcdFx0XHRtZW1vLnB1c2goeyBwYXRoTWFpbiwgbm92ZWxJRCB9KTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0cmV0dXJuIG1lbW87XG5cdFx0XHR9LCBbXSlcblx0XHQ7XG5cdH1cblx0ZWxzZSBpZiAoIWZzLmV4aXN0c1N5bmMoanNvbmZpbGUpKVxuXHR7XG5cdFx0Y29uc29sZS5ncmV5KGBbdG9jOmNvbnRlbnRzXSDmnKzmrKHmspLmnInku7vkvZXlvoXmm7TmlrDliJfooaggKDEpYCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxzID0gYXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGUpO1xuXHR9XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zdCB7IHBhdGhNYWluLCBub3ZlbElEIH0gPSBkYXRhO1xuXG5cdFx0XHRcdGxldCBiYXNlUGF0aCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgbXNnOiBzdHJpbmc7XG5cdFx0XHRcdGxldCBfZGlkID0gZmFsc2U7XG5cdFx0XHRcdGxldCBfZmlsZV9jaGFuZ2VkOiBib29sZWFuO1xuXG5cdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihiYXNlUGF0aCwgJ1JFQURNRS5tZCcpKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKGJhc2VQYXRoLCAn5bCO6Iiq55uu6YyELm1kJyk7XG5cblx0XHRcdFx0XHRsZXQgb2xkID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbHMudG9TdHJpbmcoKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW3RvYzpjb250ZW50c11gLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgcmV0ID0gYXdhaXQgcHJvY2Vzc1RvY0NvbnRlbnRzKGJhc2VQYXRoLCBmaWxlLCBhc3luYyBmdW5jdGlvbiAoYmFzZVBhdGg6IHN0cmluZywgLi4uYXJndilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHJldCA9IGF3YWl0IG1ha2VIZWFkZXIoYmFzZVBhdGgsIC4uLmFyZ3YpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBtZXRhOiBJTWRjb25mTWV0YSA9IGF3YWl0IChhc3luYyAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKGJhc2VQYXRoLCAnUkVBRE1FLm1kJykpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbWRjb25mX3BhcnNlKGRhdGEsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSkoKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKGNoa0luZm8pXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViID0gbmV3IEVwdWJNYWtlcigpXG5cdFx0XHRcdFx0XHRcdFx0XHQud2l0aFRpdGxlKG1ldGEubm92ZWwudGl0bGUsIG1ldGEubm92ZWwudGl0bGVfc2hvcnQgfHwgbWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9kYXRhID0gYXdhaXQgbWFrZUZpbGVuYW1lKHtcblx0XHRcdFx0XHRcdFx0XHRcdGlucHV0UGF0aDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRvdXRwdXRQYXRoOiAnJyxcblx0XHRcdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0dXNlVGl0bGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlbmFtZUxvY2FsOiBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0fSwgZXB1YiwgbWV0YSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9maWxlID0gZXB1Yl9kYXRhLmJhc2VuYW1lICsgZXB1Yl9kYXRhLmV4dDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCB0eHRfZmlsZSA9IGF3YWl0IG1ha2VGaWxlbmFtZVR4dChtZXRhLCBlcHViX2RhdGEuYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9wYXRoTWFpbiA9IHBhdGhNYWluO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKFxuXHRcdFx0XHRcdFx0XHRcdFx0UHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdFx0XHRcdFx0cGF0aE1haW4gKyAnX291dCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0J1JFQURNRS5tZCcsXG5cdFx0XHRcdFx0XHRcdFx0KSkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0X3BhdGhNYWluID0gcGF0aE1haW4gKyAnX291dCc7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbmtfYmFzZSA9IGAke1Byb2plY3RDb25maWcub3V0cHV0VXJsfS8ke19wYXRoTWFpbn0vYDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCB0OiBzdHJpbmc7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbms6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnRVBVQic7XG5cdFx0XHRcdFx0XHRcdFx0bGluayA9IGVwdWJfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfYWRkID0gW107XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblxuXHRcdFx0XHRcdFx0XHRcdHQgPSAnVFhUJztcblx0XHRcdFx0XHRcdFx0XHRsaW5rID0gJ291dC8nICsgdHh0X2ZpbGU7XG5cblx0XHRcdFx0XHRcdFx0XHRfYWRkLnB1c2goYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgKTtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKCctICcgKyBfYWRkLmpvaW4oYCDvvI8gYCkgKyBgIC0g5aaC5p6c6YCj57WQ6Yyv6KqkIOiri+m7nlvpgJnoo6FdKCR7bGlua19iYXNlfSlgKTtcblxuXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGlua19iYXNlID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9ibHVlbG92ZXJzL25vZGUtbm92ZWwvYmxvYi9tYXN0ZXIvbGliL2xvY2FsZXMvJztcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEub3B0aW9ucyAmJiBtZXRhLm9wdGlvbnMubm92ZWwgJiYgbWV0YS5vcHRpb25zLnBhdHRlcm4pXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSBtZXRhLm9wdGlvbnMucGF0dGVybjtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGluayA9IG1ldGEub3B0aW9ucy5wYXR0ZXJuICsgJy50cyc7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0X2FkZC5wdXNoKGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSAn5qC85byP6IiH6K2v5ZCN5pW05ZCI5qij5byPJztcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGluayA9IG5vdmVsSUQgKyAnLnRzJztcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IG1kID0gYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaCgnLSAnICsgbWQgKyBgIC0g5aaC5p6c6YCj57WQ6Yyv6KqkIOiri+m7nlvpgJnoo6FdKCR7bGlua19iYXNlfSlgKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Y29uc3QgRElTQ09SRF9MSU5LID0gJ2h0dHBzOi8vZGlzY29yZC5nZy9NblhrcG1YJztcblxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHQgPSBESVNDT1JEX0xJTks7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbmsgPSBESVNDT1JEX0xJTks7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgbWQgPSBgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmt9KWA7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaChgLSAke21kfSAtIOWgsemMr+S6pOa1gee+pO+8jOWmguaenOW3sue2k+WKoOWFpeiri+m7nlvpgJnoo6FdKGh0dHBzOi8vZGlzY29yZGFwcC5jb20vY2hhbm5lbHMvNDY3Nzk0MDg3NzY5MDE0MjczLzQ2Nzc5NDA4ODI4NTE3NTgwOSkg5oiWIFtEaXNjb3JkXShodHRwczovL2Rpc2NvcmRhcHAuY29tL2NoYW5uZWxzL0BtZSlgKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcXQgPSBxcmNvZGVfbGluayhESVNDT1JEX0xJTkspO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBxdSA9IHFyY29kZV9saW5rKFtcblx0XHRcdFx0XHRcdFx0XHRcdFByb2plY3RDb25maWcuc291cmNlVXJsLFxuXHRcdFx0XHRcdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0J+WwjuiIquebrumMhC5tZCcsXG5cdFx0XHRcdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGMgPSBgXFxuXFxuYDtcblxuXHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKGMgKyBbXG5cdFx0XHRcdFx0XHRcdFx0XHRgIVvlsI7oiKrnm67pjIRdKCR7bWRfbGlua19lc2NhcGUocXUpfSlgLFxuXHRcdFx0XHRcdFx0XHRcdFx0YCFbRGlzY29yZF0oJHttZF9saW5rX2VzY2FwZShxdCl9KWAsXG5cdFx0XHRcdFx0XHRcdFx0XS5qb2luKCcgICcpICsgYyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAobHMpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRfZmlsZV9jaGFuZ2VkID0gb2xkICE9IGxzO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFib29sIHx8IF9maWxlX2NoYW5nZWQpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Lypcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRgW3RvYzpjb250ZW50c10gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdCovXG5cblx0XHRcdFx0XHRcdFx0XHRcdF9kaWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0X3VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRtc2cgPSBg55uu6YyE5qqU5qGI5bey5a2Y5Zyo5Lim5LiU5rKS5pyJ6K6K5YyWYDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bXNnID0gYOeEoeazleeUn+aIkOebrumMhO+8jOWPr+iDveS4jeWtmOWcqOS7u+S9leeroOevgOaqlOahiGA7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRpZiAoX2RpZClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6Y29udGVudHNdYCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogYFtTS0lQXWAsXG5cdFx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRtc2csXG5cdFx0XHRcdFx0XHRcdGJvb2wsXG5cdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoX3VwZGF0ZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0YFt0b2M6Y29udGVudHNdIOWwjuiIquebrumMhC5tZGAsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jOmNvbnRlbnRzXSDlrozmiJBgKTtcblxuXHRcdFx0XHRcdGF3YWl0IGZzLmVuc3VyZUZpbGUoX2NhY2hlX2luaXQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW3RvYzpjb250ZW50c10g5a6M5oiQIOacrOasoeeEoeabtOaWsOS7u+S9leaqlOahiGApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgW3RvYzpjb250ZW50c10gZG9uZS5gKTtcblx0XHRcdH0pXG5cdFx0O1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGNvbnNvbGUud2FybihgW3RvYzpjb250ZW50c10g5pys5qyh5rKS5pyJ5Lu75L2V5b6F5pu05paw5YiX6KGoICgyKWApO1xuXHR9XG59KSgpKVxuXHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdHtcblx0XHRjb25zdCBmaWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgJ1JFQURNRS5tZCcpO1xuXG5cdFx0Y29uc3Qgb2xkID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gbHMudG9TdHJpbmcoKTtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0YXdhaXQgY3JlYXRlVG9jUm9vdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIG51bGwsIHtcblx0XHRcdGNiRm9yRWFjaFN1Yk5vdmVsKHRleHQsIGl0ZW0pXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB7IHBhdGhNYWluLCBub3ZlbElEIH0gPSBpdGVtO1xuXG5cdFx0XHRcdGxldCBzdGF0ID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdGxldCB0ZXh0X3BsdXM6IHN0cmluZyA9ICcnO1xuXG5cdFx0XHRcdGlmIChzdGF0LmVwdWJfZGF0ZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHRfcGx1cyArPSBgYnVpbGQ6ICR7Y3JlYXRlTW9tZW50KHN0YXQuZXB1Yl9kYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKX0gIGA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXRlbS5tZXRhKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUubWRjb25mX3NldChwYXRoTWFpbiwgbm92ZWxJRCwgaXRlbS5tZXRhKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzdGF0LmNoYXB0ZXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGNoYXB0ZXI6ICR7c3RhdC5jaGFwdGVyfSAgYDtcblxuXHRcdFx0XHRcdGxldCBuID0gc3RhdC5jaGFwdGVyIC0gKHN0YXQuY2hhcHRlcl9vbGQgfCAwKTtcblx0XHRcdFx0XHRuID0gbiB8fCAwO1xuXG5cdFx0XHRcdFx0aWYgKG4gIT0gc3RhdC5jaGFwdGVyKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRleHRfcGx1cyArPSBgYWRkOiAke259ICBgO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0ZXh0X3BsdXMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0ICs9ICdcXG4gIDxici8+JyArIHRleHRfcGx1cztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uIChtZClcblx0XHRcdHtcblx0XHRcdFx0aWYgKG1kICYmIG1kICE9PSBvbGQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBmcy53cml0ZUZpbGUoZmlsZSwgbWQpO1xuXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRgW1RPQ10gdG9jIHJvb3RgLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW3RvYzpyb290XSDlrozmiJAg5bey5pu05pawYCk7XG5cblx0XHRcdFx0XHRfdXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6cm9vdF0g5a6M5oiQIOS9huacrOasoeeEoeabtOWLleWFp+WuuWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoKTtcblx0fSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0aWYgKF91cGRhdGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGBbdG9jXSDlrozmiJAg5Lim5LiU6Kmm5ZyWIHB1c2gg6IiHIOW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgY3AgPSBhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXHRcdH1cblx0fSlcbjtcbiJdfQ==