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
        }
    }
    let { history, novels } = novelStatCache.data;
    log_1.default.dir({ history, novels }, {
        depth: null,
        colors: true,
    });
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFFekQsK0JBQWdDO0FBQ2hDLCtCQUFnQztBQUNoQyxvQ0FBaUM7QUFDakMscURBQTBEO0FBRTFELGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVqQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0lBRTNDLGFBQU8sQ0FBQyxLQUFLLENBQUMseUJBQVksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUUvRCxJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFFdkIsSUFBSSxHQUFZLENBQUM7SUFFakIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUN6QyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUUxQixJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUxQixJQUFJLElBQUksR0FBRyx5QkFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUVsRSxJQUFJLElBQUksR0FBYSxFQUFFLENBQUM7UUFFeEIsSUFBSSxHQUFZLENBQUM7UUFFakIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUNqQztZQUNDLElB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RUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDaEMsS0FBSyxFQUFFLElBQUk7UUFDWCxNQUFNLEVBQUUsSUFBSTtLQUNaLENBQUMsQ0FBQztBQUVKLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzEyLzE4LzAxOC5cbiAqL1xuXG5pbXBvcnQgZGVmYXVsdFNvcnRDYWxsYmFjayBmcm9tICdAbm9kZS1ub3ZlbC9zb3J0JztcbmltcG9ydCB7IG1kX2hyZWYgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IHsgdG9jU29ydENhbGxiYWNrIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvY19jb250ZW50cyc7XG5pbXBvcnQgY3JsZiBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgeyBHSVRfU0VUVElOR19ESVNUX05PVkVMIH0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduU3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlLCBjcmVhdGVNb21lbnQgfSBmcm9tICcuLi9saWIvY2FjaGUvbm92ZWwtc3RhdCc7XG5pbXBvcnQgeyBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzLCBFbnVtU2hhcmVTdGF0ZXMgfSBmcm9tICcuLi9saWIvc2hhcmUnO1xuaW1wb3J0IHsgUHJvamVjdENvbmZpZyB9IGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IGdldFB1c2hVcmxHaXRlZSwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IGNyZWF0ZVB1bGxSZXF1ZXN0cyB9IGZyb20gJy4uL3NjcmlwdC9naXQtYXBpLXByJztcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9PiB7XG5cblx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5cdGNvbnNvbGUuZGVidWcoY3JlYXRlTW9tZW50KG5vdmVsU3RhdENhY2hlLnRpbWVzdGFtcCkuZm9ybWF0KCkpO1xuXG5cdGxldCBfbWQ6IHN0cmluZ1tdID0gW107XG5cblx0bGV0IF9vazogYm9vbGVhbjtcblxuXHRPYmplY3QuZW50cmllcyhub3ZlbFN0YXRDYWNoZS5kYXRhLmhpc3RvcnkpXG5cdFx0LnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdHtcblx0XHRcdGxldCBbdGltZXN0YW1wLCBzdGF0XSA9IGI7XG5cblx0XHRcdGxldCBkYXRlID0gY3JlYXRlTW9tZW50KHBhcnNlSW50KHRpbWVzdGFtcCkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuXG5cdFx0XHRsZXQgX21kMjogc3RyaW5nW10gPSBbXTtcblxuXHRcdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdFx0aWYgKHN0YXQuZXB1YiAmJiBzdGF0LmVwdWIubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQyLnB1c2goYCMjIyBFcHViXFxuYCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYEVwdWJgKTtcblxuXHRcdFx0XHRzdGF0LmVwdWIuc29ydChmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiB0b2NTb3J0Q2FsbGJhY2soYVswXSwgYlswXSlcblx0XHRcdFx0XHRcdHx8IHRvY1NvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSUQsIG5vdmVsRGF0YV0pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbERhdGEgfHwgbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCBuID0gbm92ZWwuY2hhcHRlciAtIChub3ZlbC5jaGFwdGVyX29sZCB8IDApO1xuXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLSBbJHt0aXRsZX1dKCR7aHJlZn0pIC0gJHtwYXRoTWFpbn1gO1xuXG5cdFx0XHRcdFx0dGV4dCArPSBgXFxuICA8YnIvPiggdjogJHtub3ZlbC52b2x1bWV9ICwgYzogJHtub3ZlbC5jaGFwdGVyfSwgYWRkOiAke259IClgO1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRfbWQyLnB1c2godGV4dCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9tZDIucHVzaChgYCk7XG5cblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXQuc2VnbWVudCAmJiBzdGF0LnNlZ21lbnQubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQyLnB1c2goYCMjIyBTZWdtZW50XFxuYCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFNlZ21lbnRgKTtcblxuXHRcdFx0XHRzdGF0LnNlZ21lbnQuc29ydChmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiB0b2NTb3J0Q2FsbGJhY2soYVswXSwgYlswXSlcblx0XHRcdFx0XHRcdHx8IHRvY1NvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSUQsIG5vdmVsRGF0YV0pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbERhdGEgfHwgbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gYC0gWyR7dGl0bGV9XSgke2hyZWZ9KSAtICR7cGF0aE1haW59YDtcblxuXHRcdFx0XHRcdHRleHQgKz0gYFxcbiAgPGJyLz4oIHM6ICR7bm92ZWwuc2VnbWVudH0gKWA7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdF9tZDIucHVzaCh0ZXh0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X21kMi5wdXNoKGBgKTtcblxuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2RvKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQucHVzaChgIyMgJHtkYXRlfVxcbmApO1xuXHRcdFx0XHRfbWQucHVzaCguLi5fbWQyKTtcblxuXHRcdFx0XHRfb2sgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYTtcblx0XHR9LCBbXSlcblx0O1xuXG5cdGlmICghX29rKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihg54Sh5rOV55Sf5oiQ57Wx6KiI6LOH5paZYCk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0X21kLnB1c2goJ1xcblxcbicpO1xuXG5cdFx0bGV0IG91dCA9IFtcblx0XHRcdGAjIEhJU1RPUllcXG5gLFxuXHRcdF0uY29uY2F0KF9tZCkuam9pbignXFxuJyk7XG5cblx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdISVNUT1JZLm1kJyk7XG5cblx0XHRsZXQgX2RvOiBib29sZWFuO1xuXG5cdFx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpKVxuXHRcdHtcblx0XHRcdGxldCByZXQgPSBjcmxmKGZzLnJlYWRGaWxlU3luYyhmaWxlKS50b1N0cmluZygpKTtcblxuXHRcdFx0aWYgKHJldCAhPT0gb3V0KVxuXHRcdFx0e1xuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0X2RvID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgX2NyZWF0ZV9wcjogYm9vbGVhbjtcblxuXHRcdGxldCBhcGlfZmlsZSA9IG5vdmVsU3RhdENhY2hlLmZpbGVfZ2l0O1xuXG5cdFx0aWYgKCFfZG8pXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5ncmF5KGDmqpTmoYjnhKHororljJZgKTtcblxuXHRcdFx0dHJ5XG5cdFx0XHR7XG5cdFx0XHRcdGxldCBmMTogQnVmZmVyID0gYXdhaXQgZnMucmVhZEZpbGUoYXBpX2ZpbGUpO1xuXHRcdFx0XHRsZXQgZjI6IEJ1ZmZlciA9IGF3YWl0IGZzLnJlYWRGaWxlKG5vdmVsU3RhdENhY2hlLmZpbGUpO1xuXG5cdFx0XHRcdGlmICghZjEuZXF1YWxzKGYyKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhg6KSH6KO9ICR7bm92ZWxTdGF0Q2FjaGUuZmlsZX0gPT4gJHthcGlfZmlsZX1gKTtcblxuXHRcdFx0XHRcdGZzLmNvcHlTeW5jKG5vdmVsU3RhdENhY2hlLmZpbGUsIGFwaV9maWxlLCB7XG5cdFx0XHRcdFx0XHRvdmVyd3JpdGU6IHRydWUsXG5cdFx0XHRcdFx0XHRwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdFx0XHRhcGlfZmlsZSxcblx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRfY3JlYXRlX3ByID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGUpXG5cdFx0XHR7XG5cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdC8qKlxuXHRcdFx0ICog6Ziy5q2i5a6J6KOd5Yiw6IiK54mIXG5cdFx0XHQgKi9cblx0XHRcdGlmIChub3ZlbFN0YXRDYWNoZS5kYXRhLm1ldGEpXG5cdFx0XHR7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUuZGF0YS5tZXRhLnNvdXJjZVVybCA9IFByb2plY3RDb25maWcuc291cmNlVXJsIHx8IG5vdmVsU3RhdENhY2hlLmRhdGEubWV0YS5zb3VyY2VVcmw7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0bm92ZWxTdGF0Q2FjaGUuZGF0YS5tZXRhLm91dHB1dFVybCA9IFByb2plY3RDb25maWcub3V0cHV0VXJsIHx8IG5vdmVsU3RhdENhY2hlLmRhdGEubWV0YS5vdXRwdXRVcmw7XG5cdFx0XHR9XG5cblx0XHRcdG5vdmVsU3RhdENhY2hlLnNhdmUoMik7XG5cblx0XHRcdGZzLm91dHB1dEZpbGVTeW5jKGZpbGUsIG91dCk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdGZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGZzLmNvcHlTeW5jKG5vdmVsU3RhdENhY2hlLmZpbGUsIGFwaV9maWxlLCB7XG5cdFx0XHRcdG92ZXJ3cml0ZTogdHJ1ZSxcblx0XHRcdFx0cHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlLFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdGFwaV9maWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdH0pO1xuXG5cdFx0XHRfY3JlYXRlX3ByID0gdHJ1ZTtcblxuXHRcdFx0Y29uc29sZS5zdWNjZXNzKGDmiJDlip/lu7rnq4vntbHoqIjos4fmlplgKTtcblx0XHR9XG5cblx0XHRpZiAoX2NyZWF0ZV9wcilcblx0XHR7XG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdCctYScsXG5cdFx0XHRcdCctbScsXG5cdFx0XHRcdGBbc3RhdF0gSElTVE9SWWAsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IHB1c2hHaXQoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBnZXRQdXNoVXJsR2l0ZWUoR0lUX1NFVFRJTkdfRElTVF9OT1ZFTC51cmwpKTtcblxuXHRcdFx0YXdhaXQgY3JlYXRlUHVsbFJlcXVlc3RzKCk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IHsgaGlzdG9yeSwgbm92ZWxzIH0gPSBub3ZlbFN0YXRDYWNoZS5kYXRhO1xuXG5cdGNvbnNvbGUuZGlyKHsgaGlzdG9yeSwgbm92ZWxzIH0sIHtcblx0XHRkZXB0aDogbnVsbCxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXG59KSgpO1xuIl19