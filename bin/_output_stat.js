"use strict";
/**
 * Created by user on 2018/12/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const toc_1 = require("@node-novel/toc");
const util_1 = require("@node-novel/toc/lib/util");
const toc_contents_1 = require("@node-novel/toc/toc_contents");
const crlf_normalize_1 = require("crlf-normalize");
const git_1 = require("../data/git");
const index_1 = require("../index");
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const cache_json_1 = require("../script/cache/cache-json");
const git_2 = require("../script/git");
const path = require("upath2");
const fs = require("fs-extra");
const log_1 = require("../lib/log");
const git_api_pr_1 = require("../script/git-api-pr");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    log_1.default.debug(novel_stat_1.createMoment(novelStatCache.timestamp).format());
    let _md = [];
    let _ok;
    Object.entries(novelStatCache.data.history)
        .reduceRight(function (a, b) {
        let [timestamp, stat] = b;
        let date = novel_stat_1.createMoment(parseInt(timestamp)).format('YYYY-MM-DD');
        let _md2 = [];
        let _do;
        if (stat.epub && stat.epub.length) {
            _md2.push(`### Epub\n`);
            //console.log(`Epub`);
            stat.epub.sort(function (a, b) {
                return util_1.tocSortCallback(a[0], b[0])
                    || util_1.tocSortCallback(a[1], b[1]);
            }).forEach(function ([pathMain, novelID, novelData]) {
                let novel = novelData || novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let n = novel.chapter - (novel.chapter_old | 0);
                let text = `- [${title}](${href}) - ${pathMain}`;
                text += `\n  <br/>( v: ${novel.volume} , c: ${novel.chapter}, add: ${n} )`;
                //console.log(pathMain, novelID);
                _md2.push(text);
            });
            _md2.push(``);
            _do = true;
        }
        if (stat.segment && stat.segment.length) {
            _md2.push(`### Segment\n`);
            //console.log(`Segment`);
            stat.segment.sort(function (a, b) {
                return util_1.tocSortCallback(a[0], b[0])
                    || util_1.tocSortCallback(a[1], b[1]);
            }).forEach(function ([pathMain, novelID, novelData]) {
                let novel = novelData || novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let text = `- [${title}](${href}) - ${pathMain}`;
                text += `\n  <br/>( s: ${novel.segment} )`;
                //console.log(pathMain, novelID);
                _md2.push(text);
            });
            _md2.push(``);
            _do = true;
        }
        if (_do) {
            _md.push(`## ${date}\n`);
            _md.push(..._md2);
            _ok = true;
        }
        return a;
    }, []);
    if (!_ok) {
        log_1.default.error(`無法生成統計資料`);
    }
    else {
        _md.push('\n\n');
        let out = [
            `# HISTORY\n`,
        ].concat(_md).join('\n');
        let file = path.join(project_config_1.ProjectConfig.novel_root, 'HISTORY.md');
        let _do;
        if (fs.pathExistsSync(file)) {
            let ret = crlf_normalize_1.default(fs.readFileSync(file).toString());
            if (ret !== out) {
                _do = true;
            }
        }
        else {
            _do = true;
        }
        let _create_pr;
        let api_file = novelStatCache.file_git;
        if (!_do) {
            log_1.default.gray(`檔案無變化`);
            try {
                let f1 = await fs.readFile(api_file);
                let f2 = await fs.readFile(novelStatCache.file);
                if (!f1.equals(f2)) {
                    log_1.default.info(`複製 ${novelStatCache.file} => ${api_file}`);
                    fs.copySync(novelStatCache.file, api_file, {
                        overwrite: true,
                        preserveTimestamps: true,
                    });
                    await index_1.crossSpawnAsync('git', [
                        'add',
                        '--verbose',
                        api_file,
                    ], {
                        stdio: 'inherit',
                        cwd: project_config_1.ProjectConfig.novel_root,
                    });
                    _create_pr = true;
                }
            }
            catch (e) {
            }
        }
        else {
            /**
             * 防止安裝到舊版
             */
            if (novelStatCache.data.meta) {
                // @ts-ignore
                novelStatCache.data.meta.sourceUrl = project_config_1.ProjectConfig.sourceUrl || novelStatCache.data.meta.sourceUrl;
                // @ts-ignore
                novelStatCache.data.meta.outputUrl = project_config_1.ProjectConfig.outputUrl || novelStatCache.data.meta.outputUrl;
            }
            novelStatCache.save(2);
            fs.outputFileSync(file, out);
            await index_1.crossSpawnAsync('git', [
                'add',
                '--verbose',
                file,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.ProjectConfig.novel_root,
            });
            fs.copySync(novelStatCache.file, api_file, {
                overwrite: true,
                preserveTimestamps: true,
            });
            await index_1.crossSpawnAsync('git', [
                'add',
                '--verbose',
                api_file,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.ProjectConfig.novel_root,
            });
            _create_pr = true;
            log_1.default.success(`成功建立統計資料`);
        }
        if (_create_pr) {
            await index_1.crossSpawnAsync('git', [
                'commit',
                '-a',
                '-m',
                `[stat] HISTORY`,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.ProjectConfig.novel_root,
            });
            await git_2.pushGit(project_config_1.ProjectConfig.novel_root, git_2.getPushUrlGitee(git_1.GIT_SETTING_DIST_NOVEL.url));
            await git_api_pr_1.createPullRequests();
            cache_json_1.updateCacheConfigHashHEAD();
        }
    }
    let { history, novels } = novelStatCache.data;
    0 && log_1.default.dir({ history, novels }, {
        depth: null,
        colors: true,
    });
})();
//# sourceMappingURL=_output_stat.js.map