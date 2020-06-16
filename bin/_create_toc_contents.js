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
const FastGlob = require("@bluelovers/fast-glob");
const epub_maker2_1 = require("epub-maker2");
const novel_txt_merge_1 = require("novel-txt-merge");
const log_1 = require("../lib/log");
const meta_1 = require("../lib/util/meta");
const url = require("url");
const util_3 = require("@node-novel/cache-loader/lib/util");
const md_loader_1 = require("@node-novel/md-loader");
let _update;
const novelStatCache = novel_stat_1.getNovelStatCache();
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT,
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
            let { is_out, pathMain_base, pathMain_out } = util_3.parsePathMainBase(pathMain);
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
                        let _pathMain = pathMain_base;
                        if (fs.existsSync(path.join(project_config_1.default.novel_root, pathMain_out, novelID, 'README.md'))) {
                            _pathMain = pathMain_out;
                        }
                        let t;
                        let link;
                        let _add = [];
                        {
                            let LocalesID = novelID;
                            let link_base = 'https://github.com/bluelovers/node-novel/blob/master/lib/locales/';
                            if (meta.options && meta.options.novel && meta.options.pattern) {
                                t = meta.options.pattern;
                                link = meta.options.pattern + '.ts';
                                _add.push(`[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`);
                            }
                            else {
                                let file = path.join(_pathMain, novelID, '整合樣式.md');
                                if (!fs.existsSync(file)) {
                                    file = path.join(pathMain_base, novelID, '整合樣式.md');
                                }
                                if (fs.existsSync(file)) {
                                    let ret = md_loader_1.parse(file);
                                    if (ret.data && ret.data.LocalesID) {
                                        LocalesID = ret.data.LocalesID;
                                    }
                                }
                                t = '格式與譯名整合樣式';
                                link = LocalesID + '.ts';
                            }
                            let md = `[${util_1.md_link_escape(t)}](${link_base + index_1.md_href(link)})`;
                            ret.push('- ' + md + ` - 如果連結錯誤 請點[這裡](${link_base})`);
                        }
                        let link_base = `${project_config_1.default.outputUrl}/${pathMain_base}/`;
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
        },
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
//# sourceMappingURL=_create_toc_contents.js.map