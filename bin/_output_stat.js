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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCwyREFBdUU7QUFDdkUsdUNBQXlEO0FBRXpELCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBQ2pDLHFEQUEwRDtBQUUxRCxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFakIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztJQUUzQyxhQUFPLENBQUMsS0FBSyxDQUFDLHlCQUFZLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFFL0QsSUFBSSxHQUFHLEdBQWEsRUFBRSxDQUFDO0lBRXZCLElBQUksR0FBWSxDQUFDO0lBRWpCLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDekMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFFMUIsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUIsSUFBSSxJQUFJLEdBQUcseUJBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFbEUsSUFBSSxJQUFJLEdBQWEsRUFBRSxDQUFDO1FBRXhCLElBQUksR0FBWSxDQUFDO1FBRWpCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0s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SUFBSSxDQUFDO0lBRTlDLENBQUMsSUFBSSxhQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7S0FDWixDQUFDLENBQUM7QUFFSixDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMi8xOC8wMTguXG4gKi9cblxuaW1wb3J0IGRlZmF1bHRTb3J0Q2FsbGJhY2sgZnJvbSAnQG5vZGUtbm92ZWwvc29ydCc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IHRvY1NvcnRDYWxsYmFjayB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy9saWIvdXRpbCc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IGNybGYgZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSwgY3JlYXRlTW9tZW50IH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IFByb2plY3RDb25maWcgfSBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyB1cGRhdGVDYWNoZUNvbmZpZ0hhc2hIRUFEIH0gZnJvbSAnLi4vc2NyaXB0L2NhY2hlL2NhY2hlLWpzb24nO1xuaW1wb3J0IHsgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdC1hcGktcHInO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+IHtcblxuXHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cblx0Y29uc29sZS5kZWJ1ZyhjcmVhdGVNb21lbnQobm92ZWxTdGF0Q2FjaGUudGltZXN0YW1wKS5mb3JtYXQoKSk7XG5cblx0bGV0IF9tZDogc3RyaW5nW10gPSBbXTtcblxuXHRsZXQgX29rOiBib29sZWFuO1xuXG5cdE9iamVjdC5lbnRyaWVzKG5vdmVsU3RhdENhY2hlLmRhdGEuaGlzdG9yeSlcblx0XHQucmVkdWNlUmlnaHQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0bGV0IFt0aW1lc3RhbXAsIHN0YXRdID0gYjtcblxuXHRcdFx0bGV0IGRhdGUgPSBjcmVhdGVNb21lbnQocGFyc2VJbnQodGltZXN0YW1wKSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG5cblx0XHRcdGxldCBfbWQyOiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0XHRsZXQgX2RvOiBib29sZWFuO1xuXG5cdFx0XHRpZiAoc3RhdC5lcHViICYmIHN0YXQuZXB1Yi5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIEVwdWJcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgRXB1YmApO1xuXG5cdFx0XHRcdHN0YXQuZXB1Yi5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxEYXRhXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsRGF0YSB8fCBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBub3ZlbC5jaGFwdGVyIC0gKG5vdmVsLmNoYXB0ZXJfb2xkIHwgMCk7XG5cblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAtIFske3RpdGxlfV0oJHtocmVmfSkgLSAke3BhdGhNYWlufWA7XG5cblx0XHRcdFx0XHR0ZXh0ICs9IGBcXG4gIDxici8+KCB2OiAke25vdmVsLnZvbHVtZX0gLCBjOiAke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6ICR7bn0gKWA7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdF9tZDIucHVzaCh0ZXh0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X21kMi5wdXNoKGBgKTtcblxuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3RhdC5zZWdtZW50ICYmIHN0YXQuc2VnbWVudC5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIFNlZ21lbnRcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgU2VnbWVudGApO1xuXG5cdFx0XHRcdHN0YXQuc2VnbWVudC5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxEYXRhXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsRGF0YSB8fCBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLSBbJHt0aXRsZX1dKCR7aHJlZn0pIC0gJHtwYXRoTWFpbn1gO1xuXG5cdFx0XHRcdFx0dGV4dCArPSBgXFxuICA8YnIvPiggczogJHtub3ZlbC5zZWdtZW50fSApYDtcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0X21kMi5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQyLnB1c2goYGApO1xuXG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfZG8pXG5cdFx0XHR7XG5cdFx0XHRcdF9tZC5wdXNoKGAjIyAke2RhdGV9XFxuYCk7XG5cdFx0XHRcdF9tZC5wdXNoKC4uLl9tZDIpO1xuXG5cdFx0XHRcdF9vayA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhO1xuXHRcdH0sIFtdKVxuXHQ7XG5cblx0aWYgKCFfb2spXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDnhKHms5XnlJ/miJDntbHoqIjos4fmlplgKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRfbWQucHVzaCgnXFxuXFxuJyk7XG5cblx0XHRsZXQgb3V0ID0gW1xuXHRcdFx0YCMgSElTVE9SWVxcbmAsXG5cdFx0XS5jb25jYXQoX21kKS5qb2luKCdcXG4nKTtcblxuXHRcdGxldCBmaWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgJ0hJU1RPUlkubWQnKTtcblxuXHRcdGxldCBfZG86IGJvb2xlYW47XG5cblx0XHRpZiAoZnMucGF0aEV4aXN0c1N5bmMoZmlsZSkpXG5cdFx0e1xuXHRcdFx0bGV0IHJldCA9IGNybGYoZnMucmVhZEZpbGVTeW5jKGZpbGUpLnRvU3RyaW5nKCkpO1xuXG5cdFx0XHRpZiAocmV0ICE9PSBvdXQpXG5cdFx0XHR7XG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRfZG8gPSB0cnVlO1xuXHRcdH1cblxuXHRcdGxldCBfY3JlYXRlX3ByOiBib29sZWFuO1xuXG5cdFx0bGV0IGFwaV9maWxlID0gbm92ZWxTdGF0Q2FjaGUuZmlsZV9naXQ7XG5cblx0XHRpZiAoIV9kbylcblx0XHR7XG5cdFx0XHRjb25zb2xlLmdyYXkoYOaqlOahiOeEoeiuiuWMlmApO1xuXG5cdFx0XHR0cnlcblx0XHRcdHtcblx0XHRcdFx0bGV0IGYxOiBCdWZmZXIgPSBhd2FpdCBmcy5yZWFkRmlsZShhcGlfZmlsZSk7XG5cdFx0XHRcdGxldCBmMjogQnVmZmVyID0gYXdhaXQgZnMucmVhZEZpbGUobm92ZWxTdGF0Q2FjaGUuZmlsZSk7XG5cblx0XHRcdFx0aWYgKCFmMS5lcXVhbHMoZjIpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS5pbmZvKGDopIfoo70gJHtub3ZlbFN0YXRDYWNoZS5maWxlfSA9PiAke2FwaV9maWxlfWApO1xuXG5cdFx0XHRcdFx0ZnMuY29weVN5bmMobm92ZWxTdGF0Q2FjaGUuZmlsZSwgYXBpX2ZpbGUsIHtcblx0XHRcdFx0XHRcdG92ZXJ3cml0ZTogdHJ1ZSxcblx0XHRcdFx0XHRcdHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0XHRcdGFwaV9maWxlLFxuXHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdF9jcmVhdGVfcHIgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjYXRjaCAoZSlcblx0XHRcdHtcblxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0LyoqXG5cdFx0XHQgKiDpmLLmraLlronoo53liLDoiIrniYhcblx0XHRcdCAqL1xuXHRcdFx0aWYgKG5vdmVsU3RhdENhY2hlLmRhdGEubWV0YSlcblx0XHRcdHtcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5kYXRhLm1ldGEuc291cmNlVXJsID0gUHJvamVjdENvbmZpZy5zb3VyY2VVcmwgfHwgbm92ZWxTdGF0Q2FjaGUuZGF0YS5tZXRhLnNvdXJjZVVybDtcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRub3ZlbFN0YXRDYWNoZS5kYXRhLm1ldGEub3V0cHV0VXJsID0gUHJvamVjdENvbmZpZy5vdXRwdXRVcmwgfHwgbm92ZWxTdGF0Q2FjaGUuZGF0YS5tZXRhLm91dHB1dFVybDtcblx0XHRcdH1cblxuXHRcdFx0bm92ZWxTdGF0Q2FjaGUuc2F2ZSgyKTtcblxuXHRcdFx0ZnMub3V0cHV0RmlsZVN5bmMoZmlsZSwgb3V0KTtcblxuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0ZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0ZnMuY29weVN5bmMobm92ZWxTdGF0Q2FjaGUuZmlsZSwgYXBpX2ZpbGUsIHtcblx0XHRcdFx0b3ZlcndyaXRlOiB0cnVlLFxuXHRcdFx0XHRwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0YXBpX2ZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdF9jcmVhdGVfcHIgPSB0cnVlO1xuXG5cdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueri+e1seioiOizh+aWmWApO1xuXHRcdH1cblxuXHRcdGlmIChfY3JlYXRlX3ByKVxuXHRcdHtcblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0YFtzdGF0XSBISVNUT1JZYCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgcHVzaEdpdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIGdldFB1c2hVcmxHaXRlZShHSVRfU0VUVElOR19ESVNUX05PVkVMLnVybCkpO1xuXG5cdFx0XHRhd2FpdCBjcmVhdGVQdWxsUmVxdWVzdHMoKTtcblxuXHRcdFx0dXBkYXRlQ2FjaGVDb25maWdIYXNoSEVBRCgpO1xuXHRcdH1cblx0fVxuXG5cdGxldCB7IGhpc3RvcnksIG5vdmVscyB9ID0gbm92ZWxTdGF0Q2FjaGUuZGF0YTtcblxuXHQwICYmIGNvbnNvbGUuZGlyKHsgaGlzdG9yeSwgbm92ZWxzIH0sIHtcblx0XHRkZXB0aDogbnVsbCxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXG59KSgpO1xuIl19