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
    log_1.default.dir({ history, novels }, {
        depth: null,
        colors: true,
    });
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCwyREFBdUU7QUFDdkUsdUNBQXlEO0FBRXpELCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBQ2pDLHFEQUEwRDtBQUUxRCxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFakIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztJQUUzQyxhQUFPLENBQUMsS0FBSyxDQUFDLHlCQUFZLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFFL0QsSUFBSSxHQUFHLEdBQWEsRUFBRSxDQUFDO0lBRXZCLElBQUksR0FBWSxDQUFDO0lBRWpCLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDekMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFFMUIsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUIsSUFBSSxJQUFJLEdBQUcseUJBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFbEUsSUFBSSxJQUFJLEdBQWEsRUFBRSxDQUFDO1FBRXhCLElBQUksR0FBWSxDQUFDO1FBRWpCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0s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SUFBSSxDQUFDO0lBRTlDLGFBQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDaEMsS0FBSyxFQUFFLElBQUk7UUFDWCxNQUFNLEVBQUUsSUFBSTtLQUNaLENBQUMsQ0FBQztBQUVKLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzEyLzE4LzAxOC5cbiAqL1xuXG5pbXBvcnQgZGVmYXVsdFNvcnRDYWxsYmFjayBmcm9tICdAbm9kZS1ub3ZlbC9zb3J0JztcbmltcG9ydCB7IG1kX2hyZWYgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IHsgdG9jU29ydENhbGxiYWNrIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvY19jb250ZW50cyc7XG5pbXBvcnQgY3JsZiBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgeyBHSVRfU0VUVElOR19ESVNUX05PVkVMIH0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduU3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlLCBjcmVhdGVNb21lbnQgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgUHJvamVjdENvbmZpZyB9IGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IHVwZGF0ZUNhY2hlQ29uZmlnSGFzaEhFQUQgfSBmcm9tICcuLi9zY3JpcHQvY2FjaGUvY2FjaGUtanNvbic7XG5pbXBvcnQgeyBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBjcmVhdGVQdWxsUmVxdWVzdHMgfSBmcm9tICcuLi9zY3JpcHQvZ2l0LWFwaS1wcic7XG5cbmNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lUXG5dKSAmJiAoYXN5bmMgKCkgPT4ge1xuXG5cdGNvbnN0IG5vdmVsU3RhdENhY2hlID0gZ2V0Tm92ZWxTdGF0Q2FjaGUoKTtcblxuXHRjb25zb2xlLmRlYnVnKGNyZWF0ZU1vbWVudChub3ZlbFN0YXRDYWNoZS50aW1lc3RhbXApLmZvcm1hdCgpKTtcblxuXHRsZXQgX21kOiBzdHJpbmdbXSA9IFtdO1xuXG5cdGxldCBfb2s6IGJvb2xlYW47XG5cblx0T2JqZWN0LmVudHJpZXMobm92ZWxTdGF0Q2FjaGUuZGF0YS5oaXN0b3J5KVxuXHRcdC5yZWR1Y2VSaWdodChmdW5jdGlvbiAoYSwgYilcblx0XHR7XG5cdFx0XHRsZXQgW3RpbWVzdGFtcCwgc3RhdF0gPSBiO1xuXG5cdFx0XHRsZXQgZGF0ZSA9IGNyZWF0ZU1vbWVudChwYXJzZUludCh0aW1lc3RhbXApKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcblxuXHRcdFx0bGV0IF9tZDI6IHN0cmluZ1tdID0gW107XG5cblx0XHRcdGxldCBfZG86IGJvb2xlYW47XG5cblx0XHRcdGlmIChzdGF0LmVwdWIgJiYgc3RhdC5lcHViLmxlbmd0aClcblx0XHRcdHtcblx0XHRcdFx0X21kMi5wdXNoKGAjIyMgRXB1YlxcbmApO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGBFcHViYCk7XG5cblx0XHRcdFx0c3RhdC5lcHViLnNvcnQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gdG9jU29ydENhbGxiYWNrKGFbMF0sIGJbMF0pXG5cdFx0XHRcdFx0XHR8fCB0b2NTb3J0Q2FsbGJhY2soYVsxXSwgYlsxXSlcblx0XHRcdFx0fSkuZm9yRWFjaChmdW5jdGlvbiAoW3BhdGhNYWluLCBub3ZlbElELCBub3ZlbERhdGFdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxEYXRhIHx8IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGxldCB0aXRsZSA9IG1kX2xpbmtfZXNjYXBlKG5vdmVsSUQpO1xuXHRcdFx0XHRcdGxldCBocmVmID0gbWRfaHJlZihbXG5cdFx0XHRcdFx0XHRwYXRoTWFpbiwgbm92ZWxJRCxcblx0XHRcdFx0XHRdLmpvaW4oJy8nKSk7XG5cblx0XHRcdFx0XHRsZXQgbiA9IG5vdmVsLmNoYXB0ZXIgLSAobm92ZWwuY2hhcHRlcl9vbGQgfCAwKTtcblxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gYC0gWyR7dGl0bGV9XSgke2hyZWZ9KSAtICR7cGF0aE1haW59YDtcblxuXHRcdFx0XHRcdHRleHQgKz0gYFxcbiAgPGJyLz4oIHY6ICR7bm92ZWwudm9sdW1lfSAsIGM6ICR7bm92ZWwuY2hhcHRlcn0sIGFkZDogJHtufSApYDtcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0X21kMi5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQyLnB1c2goYGApO1xuXG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdGF0LnNlZ21lbnQgJiYgc3RhdC5zZWdtZW50Lmxlbmd0aClcblx0XHRcdHtcblx0XHRcdFx0X21kMi5wdXNoKGAjIyMgU2VnbWVudFxcbmApO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGBTZWdtZW50YCk7XG5cblx0XHRcdFx0c3RhdC5zZWdtZW50LnNvcnQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gdG9jU29ydENhbGxiYWNrKGFbMF0sIGJbMF0pXG5cdFx0XHRcdFx0XHR8fCB0b2NTb3J0Q2FsbGJhY2soYVsxXSwgYlsxXSlcblx0XHRcdFx0fSkuZm9yRWFjaChmdW5jdGlvbiAoW3BhdGhNYWluLCBub3ZlbElELCBub3ZlbERhdGFdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxEYXRhIHx8IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGxldCB0aXRsZSA9IG1kX2xpbmtfZXNjYXBlKG5vdmVsSUQpO1xuXHRcdFx0XHRcdGxldCBocmVmID0gbWRfaHJlZihbXG5cdFx0XHRcdFx0XHRwYXRoTWFpbiwgbm92ZWxJRCxcblx0XHRcdFx0XHRdLmpvaW4oJy8nKSk7XG5cblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAtIFske3RpdGxlfV0oJHtocmVmfSkgLSAke3BhdGhNYWlufWA7XG5cblx0XHRcdFx0XHR0ZXh0ICs9IGBcXG4gIDxici8+KCBzOiAke25vdmVsLnNlZ21lbnR9IClgO1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRfbWQyLnB1c2godGV4dCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9tZDIucHVzaChgYCk7XG5cblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9kbylcblx0XHRcdHtcblx0XHRcdFx0X21kLnB1c2goYCMjICR7ZGF0ZX1cXG5gKTtcblx0XHRcdFx0X21kLnB1c2goLi4uX21kMik7XG5cblx0XHRcdFx0X29rID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fSwgW10pXG5cdDtcblxuXHRpZiAoIV9vaylcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYOeEoeazleeUn+aIkOe1seioiOizh+aWmWApO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdF9tZC5wdXNoKCdcXG5cXG4nKTtcblxuXHRcdGxldCBvdXQgPSBbXG5cdFx0XHRgIyBISVNUT1JZXFxuYCxcblx0XHRdLmNvbmNhdChfbWQpLmpvaW4oJ1xcbicpO1xuXG5cdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCAnSElTVE9SWS5tZCcpO1xuXG5cdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdGlmIChmcy5wYXRoRXhpc3RzU3luYyhmaWxlKSlcblx0XHR7XG5cdFx0XHRsZXQgcmV0ID0gY3JsZihmcy5yZWFkRmlsZVN5bmMoZmlsZSkudG9TdHJpbmcoKSk7XG5cblx0XHRcdGlmIChyZXQgIT09IG91dClcblx0XHRcdHtcblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdF9kbyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0bGV0IF9jcmVhdGVfcHI6IGJvb2xlYW47XG5cblx0XHRsZXQgYXBpX2ZpbGUgPSBub3ZlbFN0YXRDYWNoZS5maWxlX2dpdDtcblxuXHRcdGlmICghX2RvKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZ3JheShg5qqU5qGI54Sh6K6K5YyWYCk7XG5cblx0XHRcdHRyeVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZjE6IEJ1ZmZlciA9IGF3YWl0IGZzLnJlYWRGaWxlKGFwaV9maWxlKTtcblx0XHRcdFx0bGV0IGYyOiBCdWZmZXIgPSBhd2FpdCBmcy5yZWFkRmlsZShub3ZlbFN0YXRDYWNoZS5maWxlKTtcblxuXHRcdFx0XHRpZiAoIWYxLmVxdWFscyhmMikpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zb2xlLmluZm8oYOikh+ijvSAke25vdmVsU3RhdENhY2hlLmZpbGV9ID0+ICR7YXBpX2ZpbGV9YCk7XG5cblx0XHRcdFx0XHRmcy5jb3B5U3luYyhub3ZlbFN0YXRDYWNoZS5maWxlLCBhcGlfZmlsZSwge1xuXHRcdFx0XHRcdFx0b3ZlcndyaXRlOiB0cnVlLFxuXHRcdFx0XHRcdFx0cHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlLFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRcdFx0YXBpX2ZpbGUsXG5cdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0X2NyZWF0ZV9wciA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhdGNoIChlKVxuXHRcdFx0e1xuXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHQvKipcblx0XHRcdCAqIOmYsuatouWuieijneWIsOiIiueJiFxuXHRcdFx0ICovXG5cdFx0XHRpZiAobm92ZWxTdGF0Q2FjaGUuZGF0YS5tZXRhKVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLmRhdGEubWV0YS5zb3VyY2VVcmwgPSBQcm9qZWN0Q29uZmlnLnNvdXJjZVVybCB8fCBub3ZlbFN0YXRDYWNoZS5kYXRhLm1ldGEuc291cmNlVXJsO1xuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdG5vdmVsU3RhdENhY2hlLmRhdGEubWV0YS5vdXRwdXRVcmwgPSBQcm9qZWN0Q29uZmlnLm91dHB1dFVybCB8fCBub3ZlbFN0YXRDYWNoZS5kYXRhLm1ldGEub3V0cHV0VXJsO1xuXHRcdFx0fVxuXG5cdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKDIpO1xuXG5cdFx0XHRmcy5vdXRwdXRGaWxlU3luYyhmaWxlLCBvdXQpO1xuXG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdH0pO1xuXG5cdFx0XHRmcy5jb3B5U3luYyhub3ZlbFN0YXRDYWNoZS5maWxlLCBhcGlfZmlsZSwge1xuXHRcdFx0XHRvdmVyd3JpdGU6IHRydWUsXG5cdFx0XHRcdHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRhcGlfZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0X2NyZWF0ZV9wciA9IHRydWU7XG5cblx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg5oiQ5Yqf5bu656uL57Wx6KiI6LOH5paZYCk7XG5cdFx0fVxuXG5cdFx0aWYgKF9jcmVhdGVfcHIpXG5cdFx0e1xuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHQnLWEnLFxuXHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRgW3N0YXRdIEhJU1RPUllgLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXG5cdFx0XHR1cGRhdGVDYWNoZUNvbmZpZ0hhc2hIRUFEKCk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IHsgaGlzdG9yeSwgbm92ZWxzIH0gPSBub3ZlbFN0YXRDYWNoZS5kYXRhO1xuXG5cdGNvbnNvbGUuZGlyKHsgaGlzdG9yeSwgbm92ZWxzIH0sIHtcblx0XHRkZXB0aDogbnVsbCxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXG59KSgpO1xuIl19