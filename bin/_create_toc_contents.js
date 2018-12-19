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
                text_plus += `build: ${moment(stat.epub_date).format('YYYY-MM-DD')}  `;
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
})
    .tap(async function () {
    if (_update) {
        log_1.default.info(`[toc] 完成 並且試圖 push 與 建立 PR`);
        let cp = await git_2.pushGit(project_config_1.default.novel_root, git_2.getPushUrlGitee(git_1.GIT_SETTING_DIST_NOVEL.url), true);
        await gitee_pr_1.createPullRequests();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2NfY29udGVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvY19jb250ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseUNBQXNEO0FBQ3RELGlEQUFnRDtBQUNoRCxtREFBMEQ7QUFDMUQsdURBQStFO0FBQy9FLCtEQUF1RjtBQUN2RixvQ0FBb0M7QUFDcEMsd0RBQXdEO0FBQ3hELHFDQUF1RTtBQUN2RSx3REFBNEQ7QUFDNUQsd0NBQTBFO0FBQzFFLHNDQUEwQztBQUMxQyxzREFBOEM7QUFDOUMsdUNBQXFFO0FBQ3JFLGlEQUF3RDtBQUN4RCxvQ0FBMkQ7QUFDM0QsNkJBQThCO0FBQzlCLCtCQUErQjtBQUMvQixzQ0FBc0M7QUFDdEMscURBQXFFO0FBQ3JFLDZDQUEwRDtBQUMxRCxxREFBNEU7QUFFNUUsb0NBQWlDO0FBQ2pDLGlDQUFrQztBQUVsQyxJQUFJLE9BQWdCLENBQUM7QUFFckIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztBQUUzQyxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVqQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUFDN0UsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRXRFLElBQUksRUFBMkMsQ0FBQztJQUVoRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXRDLGFBQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWhFLElBQUksQ0FBQyxJQUFJLEVBQ1Q7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDL0MsRUFBRSxHQUFHLE1BQU0sYUFBTyxDQUFDLHdCQUFhLENBQUMsVUFBVSxDQUFDO2FBQzFDLE1BQU0sQ0FBQyxLQUFLLFdBQVcsSUFBSSxFQUFFLFFBQWdCO1lBRTdDLE1BQU0sT0FBTztpQkFDWCxTQUFTLENBQUMsUUFBUSxDQUFTO2dCQUMzQixhQUFhO2FBQ2IsRUFBRTtnQkFDRixHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUM7YUFDbEQsQ0FBQyxFQUFFLFVBQVUsQ0FBQztnQkFFZCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUNGO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQ047S0FDRDtTQUNJLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUNqQztRQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUMvQyxPQUFPO0tBQ1A7U0FFRDtRQUNDLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDakM7SUFFRCxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUNuQjtRQUNDLE1BQU0sT0FBTzthQUNYLFNBQVMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxXQUFXLElBQUk7WUFFbEMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFbkMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFdEUsSUFBSSxHQUFXLENBQUM7WUFDaEIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLElBQUksYUFBc0IsQ0FBQztZQUUzQixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsRUFDbkQ7Z0JBQ0MsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRTFDLElBQUksR0FBRyxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7cUJBQy9CLEtBQUssQ0FBQztvQkFFTixPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDLENBQUM7cUJBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFFakIsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxDQUNGO2dCQUVELG1EQUFtRDtnQkFFbkQsSUFBSSxHQUFHLEdBQUcsTUFBTSxzQkFBa0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssV0FBVyxRQUFnQixFQUFFLEdBQUcsSUFBSTtvQkFFMUYsSUFBSSxHQUFHLEdBQUcsTUFBTSx5QkFBVSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO29CQUU5QyxJQUFJLElBQUksR0FBZ0IsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO3dCQUV4QyxJQUFJLElBQUksR0FBRyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFFL0QsT0FBTyw4QkFBWSxDQUFDLElBQUksRUFBRTs0QkFDekIsS0FBSyxFQUFFLEtBQUs7eUJBQ1osQ0FBQyxDQUFDO29CQUNKLENBQUMsQ0FBQyxFQUFFO3lCQUNILElBQUksQ0FBQyx5QkFBTyxDQUFDO3lCQUNiLEtBQUssQ0FBQyxVQUFVLENBQUM7d0JBRWpCLGFBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBRWpCLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUMsQ0FBQyxDQUNGO29CQUVELElBQUksSUFBSSxFQUNSO3dCQUNDLElBQUksSUFBSSxHQUFHLElBQUkscUJBQVMsRUFBRTs2QkFDeEIsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQzNFO3dCQUVELElBQUksU0FBUyxHQUFHLE1BQU0sd0JBQVksQ0FBQzs0QkFDbEMsU0FBUyxFQUFFLFFBQVE7NEJBQ25CLFVBQVUsRUFBRSxFQUFFOzRCQUNkLFVBQVUsRUFBRSxLQUFLOzRCQUNqQixRQUFRLEVBQUUsSUFBSTs0QkFDZCxhQUFhLEVBQUUsT0FBTzs0QkFDdEIsS0FBSyxFQUFFLElBQUk7eUJBQ1gsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBRWYsSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDO3dCQUVuRCxJQUFJLFFBQVEsR0FBRyxNQUFNLDhCQUFlLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFFL0QsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDO3dCQUV6QixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDMUIsd0JBQWEsQ0FBQyxVQUFVLEVBQ3hCLFFBQVEsR0FBRyxNQUFNLEVBQ2pCLE9BQU8sRUFDUCxXQUFXLENBQ1gsQ0FBQyxFQUNGOzRCQUNDLFNBQVMsR0FBRyxRQUFRLEdBQUcsTUFBTSxDQUFDO3lCQUM5Qjt3QkFFRCxJQUFJLFNBQVMsR0FBRyxxREFBcUQsU0FBUyxHQUFHLENBQUM7d0JBRWxGLElBQUksQ0FBUyxDQUFDO3dCQUNkLElBQUksSUFBWSxDQUFDO3dCQUVqQixDQUFDLEdBQUcsTUFBTSxDQUFDO3dCQUNYLElBQUksR0FBRyxTQUFTLENBQUM7d0JBRWpCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFFZCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEdBQUcsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFFbEUsQ0FBQyxHQUFHLEtBQUssQ0FBQzt3QkFDVixJQUFJLEdBQUcsTUFBTSxHQUFHLFFBQVEsQ0FBQzt3QkFFekIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxHQUFHLGVBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBRWxFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcscUVBQXFFLENBQUMsQ0FBQzt3QkFHMUc7NEJBQ0MsU0FBUyxHQUFHLG1FQUFtRSxDQUFDOzRCQUVoRixJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQzlEO2dDQUNDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQ0FDekIsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQ0FFcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxHQUFHLGVBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7NkJBQ2xFO2lDQUVEO2dDQUNDLENBQUMsR0FBRyxXQUFXLENBQUM7Z0NBQ2hCLElBQUksR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDOzZCQUN2Qjs0QkFFRCxJQUFJLEVBQUUsR0FBRyxJQUFJLHFCQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxHQUFHLGVBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDOzRCQUVoRSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsb0ZBQW9GLENBQUMsQ0FBQzt5QkFDM0c7cUJBR0Q7b0JBRUQsTUFBTSxZQUFZLEdBQUcsNEJBQTRCLENBQUM7b0JBRWxEO3dCQUNDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQzt3QkFDckIsSUFBSSxJQUFJLEdBQUcsWUFBWSxDQUFDO3dCQUV4QixJQUFJLEVBQUUsR0FBRyxJQUFJLHFCQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUM7d0JBRTNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLCtJQUErSSxDQUFDLENBQUM7cUJBQ2pLO29CQUVEO3dCQUNDLElBQUksRUFBRSxHQUFHLGtCQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ25DLElBQUksRUFBRSxHQUFHLGtCQUFXLENBQUM7NEJBQ3BCLGdEQUFnRDs0QkFDaEQsUUFBUTs0QkFDUixPQUFPOzRCQUNQLFNBQVM7eUJBQ1QsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFFYixJQUFJLENBQUMsR0FBRyxNQUFNLENBQUM7d0JBRWYsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUc7NEJBQ1osV0FBVyxxQkFBYyxDQUFDLEVBQUUsQ0FBQyxHQUFHOzRCQUNoQyxjQUFjLHFCQUFjLENBQUMsRUFBRSxDQUFDLEdBQUc7eUJBQ25DLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3FCQUNsQjtvQkFFRCxPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDLENBQUM7cUJBQ0QsR0FBRyxDQUFDLEtBQUssV0FBVyxFQUFFO29CQUV0QixJQUFJLEVBQUUsRUFDTjt3QkFDQyxhQUFhLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQzt3QkFFMUIsSUFBSSxDQUFDLElBQUksSUFBSSxhQUFhLEVBQzFCOzRCQUNDLE1BQU0sc0JBQWMsQ0FBQyxLQUFLLEVBQUU7Z0NBQzNCLEtBQUs7Z0NBQ0wsSUFBSTs2QkFDSixFQUFFO2dDQUNGLEtBQUssRUFBRSxTQUFTO2dDQUNoQixHQUFHLEVBQUUsUUFBUTs2QkFDYixDQUFDLENBQUM7NEJBRUgsTUFBTSxzQkFBYyxDQUFDLEtBQUssRUFBRTtnQ0FDM0IsUUFBUTtnQ0FDUixJQUFJO2dDQUNKLElBQUk7Z0NBQ0osa0JBQWtCLFFBQVEsSUFBSSxPQUFPLEVBQUU7NkJBQ3ZDLEVBQUU7Z0NBQ0YsS0FBSyxFQUFFLFNBQVM7Z0NBQ2hCLEdBQUcsRUFBRSxRQUFROzZCQUNiLENBQUMsQ0FBQzs0QkFFSCxJQUFJLEdBQUcsSUFBSSxDQUFDOzRCQUNaLE9BQU8sR0FBRyxJQUFJLENBQUM7eUJBQ2Y7NkJBRUQ7NEJBQ0MsR0FBRyxHQUFHLGVBQWUsQ0FBQzt5QkFDdEI7cUJBQ0Q7eUJBRUQ7d0JBQ0MsR0FBRyxHQUFHLG9CQUFvQixDQUFDO3FCQUMzQjtnQkFDRixDQUFDLENBQUMsQ0FDRDtnQkFFRixJQUFJLElBQUksRUFDUjtvQkFDQyxhQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDckQ7cUJBRUQ7b0JBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQzt3QkFDWCxLQUFLLEVBQUUsUUFBUTt3QkFDZixRQUFRLEVBQUUsT0FBTzt3QkFDakIsR0FBRzt3QkFDSCxJQUFJO3dCQUNKLGFBQWE7cUJBQ2IsQ0FBQyxDQUFDO2lCQUNIO2dCQUVELE9BQU8sR0FBRyxDQUFDO2FBQ1g7UUFDRixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsS0FBSztZQUVULElBQUksT0FBTyxFQUNYO2dCQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFFbEMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ2pDO2lCQUVEO2dCQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQzthQUM1QztRQUNGLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQztZQUVKLGFBQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FDRjtLQUNEO1NBRUQ7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7S0FDL0M7QUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ0gsR0FBRyxDQUFDLEtBQUs7SUFFVCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTlELE1BQU0sR0FBRyxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7U0FDakMsS0FBSyxDQUFDO1FBRU4sT0FBTyxFQUFFLENBQUM7SUFDWCxDQUFDLENBQUM7U0FDRCxJQUFJLENBQUMsVUFBVSxFQUFFO1FBRWpCLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUNGO0lBRUQsTUFBTSx3QkFBYSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRTtRQUNuRCxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUUzQixJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUVqQyxJQUFJLElBQUksR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVuRCxJQUFJLFNBQVMsR0FBVyxFQUFFLENBQUM7WUFFM0IsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUNsQjtnQkFDQyxTQUFTLElBQUksVUFBVSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO2FBQ3ZFO1lBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUNoQjtnQkFDQyxTQUFTLElBQUksWUFBWSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUM7Z0JBRTFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFWCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUNyQjtvQkFDQyxTQUFTLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQztpQkFDM0I7YUFDRDtZQUVELElBQUksU0FBUyxFQUNiO2dCQUNDLElBQUksSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDO2FBQ2hDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0QsQ0FBQztTQUNBLEdBQUcsQ0FBQyxLQUFLLFdBQVcsRUFBRTtRQUV0QixJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUNwQjtZQUNDLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFN0IsTUFBTSx1QkFBZSxDQUFDLEtBQUssRUFBRTtnQkFDNUIsS0FBSztnQkFDTCxXQUFXO2dCQUNYLElBQUk7YUFDSixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHLEVBQUUsd0JBQWEsQ0FBQyxVQUFVO2FBQzdCLENBQUMsQ0FBQztZQUVILE1BQU0sdUJBQWUsQ0FBQyxLQUFLLEVBQUU7Z0JBQzVCLFFBQVE7Z0JBQ1IsSUFBSTtnQkFDSixJQUFJO2dCQUNKLGdCQUFnQjthQUNoQixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHLEVBQUUsd0JBQWEsQ0FBQyxVQUFVO2FBQzdCLENBQUMsQ0FBQztZQUVILGFBQU8sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUVyQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7YUFFRDtZQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUN2QztJQUNGLENBQUMsQ0FBQyxDQUNGO0FBQ0YsQ0FBQyxDQUFDO0tBQ0QsR0FBRyxDQUFDLEtBQUs7SUFFVCxJQUFJLE9BQU8sRUFDWDtRQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUUzQyxJQUFJLEVBQUUsR0FBRyxNQUFNLGFBQU8sQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxxQkFBZSxDQUFDLDRCQUFzQixDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXBHLE1BQU0sNkJBQWtCLEVBQUUsQ0FBQztLQUMzQjtBQUNGLENBQUMsQ0FBQyxDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC84LzE0LzAxNC5cbiAqL1xuXG5pbXBvcnQgeyBnZXRfaWRzLCBwcm9jZXNzVG9jIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IG1kX2hyZWYgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvaW5kZXgnO1xuaW1wb3J0IHsgbWRfbGlua19lc2NhcGUgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvbGliL3V0aWwnO1xuaW1wb3J0IHsgY3JlYXRlVG9jUm9vdCwgSURhdGFBdXRob3JOb3ZlbEl0ZW0gfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MvdG9jLXJvb3QnO1xuaW1wb3J0IHByb2Nlc3NUb2NDb250ZW50cywgeyBtYWtlSGVhZGVyLCBtYWtlTGlua30gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvY19jb250ZW50cyc7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IG1ha2VGaWxlbmFtZSB9IGZyb20gJ25vdmVsLWVwdWIvbGliL3R4dDJlcHViMyc7XG5pbXBvcnQgeyBHSVRfU0VUVElOR19ESVNUX05PVkVMLCBHSVRfU0VUVElOR19FUFVCIH0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxTdGF0Q2FjaGUgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgcXJjb2RlX2xpbmsgfSBmcm9tICcuLi9saWIvdXRpbCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBnZXRQdXNoVXJsLCBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCB7IGNyZWF0ZVB1bGxSZXF1ZXN0cyB9IGZyb20gJy4uL3NjcmlwdC9naXRlZS1wcic7XG5pbXBvcnQgeyBjcm9zc1NwYXduU3luYywgY3Jvc3NTcGF3bkFzeW5jIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBGYXN0R2xvYiBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0IHsgbWRjb25mX3BhcnNlLCBJTWRjb25mTWV0YSwgY2hrSW5mbyB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQgRXB1Yk1ha2VyLCB7IGhhc2hTdW0sIHNsdWdpZnkgfSBmcm9tICdlcHViLW1ha2VyMic7XG5pbXBvcnQgdHh0TWVyZ2UsIHsgbWFrZUZpbGVuYW1lIGFzIG1ha2VGaWxlbmFtZVR4dCB9IGZyb20gJ25vdmVsLXR4dC1tZXJnZSc7XG5pbXBvcnQgbm92ZWxFcHViIGZyb20gJ25vdmVsLWVwdWInO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5cbmxldCBfdXBkYXRlOiBib29sZWFuO1xuXG5jb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cbmNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lUXG5dKSAmJiBQcm9taXNlLnJlc29sdmUoKGFzeW5jICgpID0+XG57XG5cdGxldCBfY2FjaGVfaW5pdCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcudG9jX2NvbnRlbnRzLmNhY2hlJyk7XG5cdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdkaWZmLW5vdmVsLmpzb24nKTtcblxuXHRsZXQgbHM6IHsgcGF0aE1haW46IHN0cmluZywgbm92ZWxJRDogc3RyaW5nIH1bXTtcblxuXHRsZXQgYm9vbCA9IGZzLmV4aXN0c1N5bmMoX2NhY2hlX2luaXQpO1xuXG5cdGNvbnNvbGUuZGVidWcoYFt0b2M6Y29udGVudHNdIOaYr+WQpuW3suabvue2k+WIneWni+WMluWwjuiIquebrumMhGAsIGJvb2wsIF9jYWNoZV9pbml0KTtcblxuXHRpZiAoIWJvb2wpXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOWIneWni+WMluaJgOaciSDlsI/oqqog55qEIOWwjuiIquebrumMhGApO1xuXHRcdGxzID0gYXdhaXQgZ2V0X2lkcyhQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpXG5cdFx0XHQucmVkdWNlKGFzeW5jIGZ1bmN0aW9uIChtZW1vLCBwYXRoTWFpbjogc3RyaW5nKVxuXHRcdFx0e1xuXHRcdFx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHRcdFx0Lm1hcFNlcmllcyhGYXN0R2xvYjxzdHJpbmc+KFtcblx0XHRcdFx0XHRcdCcqL1JFQURNRS5tZCcsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiksXG5cdFx0XHRcdFx0fSksIGZ1bmN0aW9uIChwKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBub3ZlbElEID0gcGF0aC5iYXNlbmFtZShwYXRoLmRpcm5hbWUocCkpO1xuXG5cdFx0XHRcdFx0XHRtZW1vLnB1c2goeyBwYXRoTWFpbiwgbm92ZWxJRCB9KTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0cmV0dXJuIG1lbW87XG5cdFx0XHR9LCBbXSlcblx0XHQ7XG5cdH1cblx0ZWxzZSBpZiAoIWZzLmV4aXN0c1N5bmMoanNvbmZpbGUpKVxuXHR7XG5cdFx0Y29uc29sZS5ncmV5KGBbdG9jOmNvbnRlbnRzXSDmnKzmrKHmspLmnInku7vkvZXlvoXmm7TmlrDliJfooaggKDEpYCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxzID0gYXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGUpO1xuXHR9XG5cblx0aWYgKGxzICYmIGxzLmxlbmd0aClcblx0e1xuXHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zdCB7IHBhdGhNYWluLCBub3ZlbElEIH0gPSBkYXRhO1xuXG5cdFx0XHRcdGxldCBiYXNlUGF0aCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgbXNnOiBzdHJpbmc7XG5cdFx0XHRcdGxldCBfZGlkID0gZmFsc2U7XG5cdFx0XHRcdGxldCBfZmlsZV9jaGFuZ2VkOiBib29sZWFuO1xuXG5cdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihiYXNlUGF0aCwgJ1JFQURNRS5tZCcpKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKGJhc2VQYXRoLCAn5bCO6Iiq55uu6YyELm1kJyk7XG5cblx0XHRcdFx0XHRsZXQgb2xkID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbHMudG9TdHJpbmcoKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW3RvYzpjb250ZW50c11gLCBwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgcmV0ID0gYXdhaXQgcHJvY2Vzc1RvY0NvbnRlbnRzKGJhc2VQYXRoLCBmaWxlLCBhc3luYyBmdW5jdGlvbiAoYmFzZVBhdGg6IHN0cmluZywgLi4uYXJndilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHJldCA9IGF3YWl0IG1ha2VIZWFkZXIoYmFzZVBhdGgsIC4uLmFyZ3YpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBtZXRhOiBJTWRjb25mTWV0YSA9IGF3YWl0IChhc3luYyAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKGJhc2VQYXRoLCAnUkVBRE1FLm1kJykpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbWRjb25mX3BhcnNlKGRhdGEsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSkoKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKGNoa0luZm8pXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRpZiAobWV0YSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBlcHViID0gbmV3IEVwdWJNYWtlcigpXG5cdFx0XHRcdFx0XHRcdFx0XHQud2l0aFRpdGxlKG1ldGEubm92ZWwudGl0bGUsIG1ldGEubm92ZWwudGl0bGVfc2hvcnQgfHwgbWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9kYXRhID0gYXdhaXQgbWFrZUZpbGVuYW1lKHtcblx0XHRcdFx0XHRcdFx0XHRcdGlucHV0UGF0aDogYmFzZVBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRvdXRwdXRQYXRoOiAnJyxcblx0XHRcdFx0XHRcdFx0XHRcdHBhZEVuZERhdGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0dXNlVGl0bGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlbmFtZUxvY2FsOiBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0bm9Mb2c6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0fSwgZXB1YiwgbWV0YSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZXB1Yl9maWxlID0gZXB1Yl9kYXRhLmJhc2VuYW1lICsgZXB1Yl9kYXRhLmV4dDtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCB0eHRfZmlsZSA9IGF3YWl0IG1ha2VGaWxlbmFtZVR4dChtZXRhLCBlcHViX2RhdGEuYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9wYXRoTWFpbiA9IHBhdGhNYWluO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKFxuXHRcdFx0XHRcdFx0XHRcdFx0UHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdFx0XHRcdFx0cGF0aE1haW4gKyAnX291dCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRcdFx0J1JFQURNRS5tZCcsXG5cdFx0XHRcdFx0XHRcdFx0KSkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0X3BhdGhNYWluID0gcGF0aE1haW4gKyAnX291dCc7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGxpbmtfYmFzZSA9IGBodHRwczovL2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0L2Jsb2IvbWFzdGVyLyR7X3BhdGhNYWlufS9gO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IHQ6IHN0cmluZztcblx0XHRcdFx0XHRcdFx0XHRsZXQgbGluazogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRcdFx0dCA9ICdFUFVCJztcblx0XHRcdFx0XHRcdFx0XHRsaW5rID0gZXB1Yl9maWxlO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9hZGQgPSBbXTtcblxuXHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXG5cdFx0XHRcdFx0XHRcdFx0dCA9ICdUWFQnO1xuXHRcdFx0XHRcdFx0XHRcdGxpbmsgPSAnb3V0LycgKyB0eHRfZmlsZTtcblxuXHRcdFx0XHRcdFx0XHRcdF9hZGQucHVzaChgWyR7bWRfbGlua19lc2NhcGUodCl9XSgke2xpbmtfYmFzZSArIG1kX2hyZWYobGluayl9KWApO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goJy0gJyArIF9hZGQuam9pbihgIO+8jyBgKSArIGAgLSDlpoLmnpzpgKPntZDpjK/oqqQg6KuL6bueW+mAmeijoV0oaHR0cHM6Ly9naXRsYWIuY29tL2RlbW9ub3ZlbC9lcHViLXR4dC90cmVlL21hc3RlcilgKTtcblxuXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGlua19iYXNlID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9ibHVlbG92ZXJzL25vZGUtbm92ZWwvYmxvYi9tYXN0ZXIvbGliL2xvY2FsZXMvJztcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEub3B0aW9ucyAmJiBtZXRhLm9wdGlvbnMubm92ZWwgJiYgbWV0YS5vcHRpb25zLnBhdHRlcm4pXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSBtZXRhLm9wdGlvbnMucGF0dGVybjtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGluayA9IG1ldGEub3B0aW9ucy5wYXR0ZXJuICsgJy50cyc7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0X2FkZC5wdXNoKGBbJHttZF9saW5rX2VzY2FwZSh0KX1dKCR7bGlua19iYXNlICsgbWRfaHJlZihsaW5rKX0pYCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHQgPSAn5qC85byP6IiH6K2v5ZCN5pW05ZCI5qij5byPJztcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGluayA9IG5vdmVsSUQgKyAnLnRzJztcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IG1kID0gYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rX2Jhc2UgKyBtZF9ocmVmKGxpbmspfSlgO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXQucHVzaCgnLSAnICsgbWQgKyBgIC0g5aaC5p6c6YCj57WQ6Yyv6KqkIOiri+m7nlvpgJnoo6FdKGh0dHBzOi8vZ2l0aHViLmNvbS9ibHVlbG92ZXJzL25vZGUtbm92ZWwvdHJlZS9tYXN0ZXIvbGliL2xvY2FsZXMpYCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IERJU0NPUkRfTElOSyA9ICdodHRwczovL2Rpc2NvcmQuZ2cvTW5Ya3BtWCc7XG5cblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCB0ID0gRElTQ09SRF9MSU5LO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBsaW5rID0gRElTQ09SRF9MSU5LO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG1kID0gYFske21kX2xpbmtfZXNjYXBlKHQpfV0oJHtsaW5rfSlgO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goYC0gJHttZH0gLSDloLHpjK/kuqTmtYHnvqTvvIzlpoLmnpzlt7LntpPliqDlhaXoq4vpu55b6YCZ6KOhXShodHRwczovL2Rpc2NvcmRhcHAuY29tL2NoYW5uZWxzLzQ2Nzc5NDA4Nzc2OTAxNDI3My80Njc3OTQwODgyODUxNzU4MDkpIOaIliBbRGlzY29yZF0oaHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9jaGFubmVscy9AbWUpYCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHF0ID0gcXJjb2RlX2xpbmsoRElTQ09SRF9MSU5LKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgcXUgPSBxcmNvZGVfbGluayhbXG5cdFx0XHRcdFx0XHRcdFx0XHRgaHR0cHM6Ly9naXRlZS5jb20vYmx1ZWxvdmVycy9ub3ZlbC9ibG9iL21hc3RlcmAsXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0XHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHQn5bCO6Iiq55uu6YyELm1kJyxcblx0XHRcdFx0XHRcdFx0XHRdLmpvaW4oJy8nKSk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgYyA9IGBcXG5cXG5gO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2goYyArIFtcblx0XHRcdFx0XHRcdFx0XHRcdGAhW+WwjuiIquebrumMhF0oJHttZF9saW5rX2VzY2FwZShxdSl9KWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRgIVtEaXNjb3JkXSgke21kX2xpbmtfZXNjYXBlKHF0KX0pYCxcblx0XHRcdFx0XHRcdFx0XHRdLmpvaW4oJyAgJykgKyBjKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmIChscylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQgPSBvbGQgIT0gbHM7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIWJvb2wgfHwgX2ZpbGVfY2hhbmdlZClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBiYXNlUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YFt0b2M6Y29udGVudHNdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGJhc2VQYXRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdF9kaWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0X3VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRtc2cgPSBg55uu6YyE5qqU5qGI5bey5a2Y5Zyo5Lim5LiU5rKS5pyJ6K6K5YyWYDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bXNnID0gYOeEoeazleeUn+aIkOebrumMhO+8jOWPr+iDveS4jeWtmOWcqOS7u+S9leeroOevgOaqlOahiGA7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRpZiAoX2RpZClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFt0b2M6Y29udGVudHNdYCwgcGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogYFtTS0lQXWAsXG5cdFx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdFx0XHRtc2csXG5cdFx0XHRcdFx0XHRcdGJvb2wsXG5cdFx0XHRcdFx0XHRcdF9maWxlX2NoYW5nZWQsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoX3VwZGF0ZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhgW3RvYzpjb250ZW50c10g5a6M5oiQYCk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5lbnN1cmVGaWxlKF9jYWNoZV9pbml0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOWujOaIkCDmnKzmrKHnhKHmm7TmlrDku7vkvZXmqpTmoYhgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5sb2coYFt0b2M6Y29udGVudHNdIGRvbmUuYCk7XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRjb25zb2xlLndhcm4oYFt0b2M6Y29udGVudHNdIOacrOasoeaykuacieS7u+S9leW+heabtOaWsOWIl+ihqCAoMilgKTtcblx0fVxufSkoKSlcblx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdSRUFETUUubWQnKTtcblxuXHRcdGNvbnN0IG9sZCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGxzLnRvU3RyaW5nKCk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdGF3YWl0IGNyZWF0ZVRvY1Jvb3QoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBudWxsLCB7XG5cdFx0XHRjYkZvckVhY2hTdWJOb3ZlbCh0ZXh0LCBpdGVtKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgeyBwYXRoTWFpbiwgbm92ZWxJRCB9ID0gaXRlbTtcblxuXHRcdFx0XHRsZXQgc3RhdCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRsZXQgdGV4dF9wbHVzOiBzdHJpbmcgPSAnJztcblxuXHRcdFx0XHRpZiAoc3RhdC5lcHViX2RhdGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0X3BsdXMgKz0gYGJ1aWxkOiAke21vbWVudChzdGF0LmVwdWJfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyl9ICBgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHN0YXQuY2hhcHRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHRfcGx1cyArPSBgY2hhcHRlcjogJHtzdGF0LmNoYXB0ZXJ9ICBgO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBzdGF0LmNoYXB0ZXIgLSAoc3RhdC5jaGFwdGVyX29sZCB8IDApO1xuXHRcdFx0XHRcdG4gPSBuIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAobiAhPSBzdGF0LmNoYXB0ZXIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGV4dF9wbHVzICs9IGBhZGQ6ICR7bn0gIGA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRleHRfcGx1cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQgKz0gJ1xcbiAgPGJyLz4nICsgdGV4dF9wbHVzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHRleHQ7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKG1kKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAobWQgJiYgbWQgIT09IG9sZClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IGZzLndyaXRlRmlsZShmaWxlLCBtZCk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdGBbVE9DXSB0b2Mgcm9vdGAsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGBbdG9jOnJvb3RdIOWujOaIkCDlt7Lmm7TmlrBgKTtcblxuXHRcdFx0XHRcdF91cGRhdGUgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW3RvYzpyb290XSDlrozmiJAg5L2G5pys5qyh54Sh5pu05YuV5YWn5a65YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXHR9KVxuXHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdHtcblx0XHRpZiAoX3VwZGF0ZSlcblx0XHR7XG5cdFx0XHRjb25zb2xlLmluZm8oYFt0b2NdIOWujOaIkCDkuKbkuJToqablnJYgcHVzaCDoiIcg5bu656uLIFBSYCk7XG5cblx0XHRcdGxldCBjcCA9IGF3YWl0IHB1c2hHaXQoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBnZXRQdXNoVXJsR2l0ZWUoR0lUX1NFVFRJTkdfRElTVF9OT1ZFTC51cmwpLCB0cnVlKTtcblxuXHRcdFx0YXdhaXQgY3JlYXRlUHVsbFJlcXVlc3RzKCk7XG5cdFx0fVxuXHR9KVxuO1xuIl19