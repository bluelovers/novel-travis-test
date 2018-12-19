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
const moment = require("moment");
const path = require("upath2");
const fs = require("fs-extra");
const log_1 = require("../lib/log");
const gitee_pr_1 = require("../script/gitee-pr");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    let _md = [];
    let _ok;
    log_1.default.dir(novelStatCache.data, {
        depth: null,
        colors: true,
    });
    Object.entries(novelStatCache.data.history)
        .reduceRight(function (a, b) {
        let [timestamp, stat] = b;
        let date = moment.unix(parseInt(timestamp)).format('YYYY-MM-DD');
        //console.log(date);
        let _md2 = [];
        let _do;
        if (stat.epub && stat.epub.length) {
            _md2.push(`### Epub\n`);
            //console.log(`Epub`);
            stat.epub.sort(function (a, b) {
                return util_1.tocSortCallback(a[0], b[0])
                    || util_1.tocSortCallback(a[1], b[1]);
            }).forEach(function ([pathMain, novelID]) {
                let novel = novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let n = novel.chapter - (novel.chapter_old | 0);
                let text = `- [${title}](${href}) - ${pathMain}`;
                text += `\n  ( v: ${novel.volume} , c: ${novel.chapter}, add: ${n} )`;
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
            }).forEach(function ([pathMain, novelID]) {
                let novel = novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let text = `- [${title}](${href}) - ${pathMain}`;
                text += `\n  ( s: ${novel.segment} )`;
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
        if (!_do) {
            log_1.default.gray(`檔案無變化`);
        }
        else {
            fs.outputFileSync(file, out);
            await index_1.crossSpawnAsync('git', [
                'add',
                '--verbose',
                file,
            ], {
                stdio: 'inherit',
                cwd: project_config_1.ProjectConfig.novel_root,
            });
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
            log_1.default.success(`成功建立統計資料`);
            await gitee_pr_1.createPullRequests();
        }
    }
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBNEQ7QUFDNUQsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFDekQsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBQ2pDLGlEQUF3RDtBQUV4RCxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFakIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztJQUUzQyxJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFFdkIsSUFBSSxHQUFZLENBQUM7SUFFakIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO1FBQ2hDLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7S0FDWixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3pDLFdBQVcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBRTFCLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pFLG9CQUFvQjtRQUVwQixJQUFJLElBQUksR0FBYSxFQUFFLENBQUM7UUFFeEIsSUFBSSxHQUFZLENBQUM7UUFFakIsSUFBSSxJQUFJ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VztnQkFDWCxJQUFJO2FBQ0osRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLDhCQUFhLENBQUMsVUFBVTthQUM3QixDQUFDLENBQUM7WUFFSCxNQUFNLHVCQUFlLENBQUMsS0FBSyxFQUFFO2dCQUM1QixRQUFRO2dCQUNSLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixnQkFBZ0I7YUFDaEIsRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLDhCQUFhLENBQUMsVUFBVTthQUM3QixDQUFDLENBQUM7WUFFSCxNQUFNLGFBQU8sQ0FBQyw4QkFBYSxDQUFDLFVBQVUsRUFBRSxxQkFBZSxDQUFDLDRCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFckYsYUFBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1QixNQUFNLDZCQUFrQixFQUFFLENBQUM7U0FDM0I7S0FDRDtBQUVGLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzEyLzE4LzAxOC5cbiAqL1xuXG5pbXBvcnQgZGVmYXVsdFNvcnRDYWxsYmFjayBmcm9tICdAbm9kZS1ub3ZlbC9zb3J0JztcbmltcG9ydCB7IG1kX2hyZWYgfSBmcm9tICdAbm9kZS1ub3ZlbC90b2MnO1xuaW1wb3J0IHsgdG9jU29ydENhbGxiYWNrIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL2xpYi91dGlsJztcbmltcG9ydCB7IG1kX2xpbmtfZXNjYXBlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jL3RvY19jb250ZW50cyc7XG5pbXBvcnQgY3JsZiBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgeyBHSVRfU0VUVElOR19ESVNUX05PVkVMIH0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduU3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGdldE5vdmVsU3RhdENhY2hlIH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IFByb2plY3RDb25maWcgfSBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBjcmVhdGVQdWxsUmVxdWVzdHMgfSBmcm9tICcuLi9zY3JpcHQvZ2l0ZWUtcHInO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+IHtcblxuXHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cblx0bGV0IF9tZDogc3RyaW5nW10gPSBbXTtcblxuXHRsZXQgX29rOiBib29sZWFuO1xuXG5cdGNvbnNvbGUuZGlyKG5vdmVsU3RhdENhY2hlLmRhdGEsIHtcblx0XHRkZXB0aDogbnVsbCxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXG5cdE9iamVjdC5lbnRyaWVzKG5vdmVsU3RhdENhY2hlLmRhdGEuaGlzdG9yeSlcblx0XHQucmVkdWNlUmlnaHQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0bGV0IFt0aW1lc3RhbXAsIHN0YXRdID0gYjtcblxuXHRcdFx0bGV0IGRhdGUgPSBtb21lbnQudW5peChwYXJzZUludCh0aW1lc3RhbXApKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcblx0XHRcdC8vY29uc29sZS5sb2coZGF0ZSk7XG5cblx0XHRcdGxldCBfbWQyOiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0XHRsZXQgX2RvOiBib29sZWFuO1xuXG5cdFx0XHRpZiAoc3RhdC5lcHViICYmIHN0YXQuZXB1Yi5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIEVwdWJcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgRXB1YmApO1xuXG5cdFx0XHRcdHN0YXQuZXB1Yi5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRF0pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgbm92ZWwgPSBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBub3ZlbC5jaGFwdGVyIC0gKG5vdmVsLmNoYXB0ZXJfb2xkIHwgMCk7XG5cblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAtIFske3RpdGxlfV0oJHtocmVmfSkgLSAke3BhdGhNYWlufWA7XG5cblx0XHRcdFx0XHR0ZXh0ICs9IGBcXG4gICggdjogJHtub3ZlbC52b2x1bWV9ICwgYzogJHtub3ZlbC5jaGFwdGVyfSwgYWRkOiAke259IClgO1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRfbWQyLnB1c2godGV4dCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9tZDIucHVzaChgYCk7XG5cblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXQuc2VnbWVudCAmJiBzdGF0LnNlZ21lbnQubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQyLnB1c2goYCMjIyBTZWdtZW50XFxuYCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFNlZ21lbnRgKTtcblxuXHRcdFx0XHRzdGF0LnNlZ21lbnQuc29ydChmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiB0b2NTb3J0Q2FsbGJhY2soYVswXSwgYlswXSlcblx0XHRcdFx0XHRcdHx8IHRvY1NvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSURdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gYC0gWyR7dGl0bGV9XSgke2hyZWZ9KSAtICR7cGF0aE1haW59YDtcblxuXHRcdFx0XHRcdHRleHQgKz0gYFxcbiAgKCBzOiAke25vdmVsLnNlZ21lbnR9IClgO1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRfbWQyLnB1c2godGV4dCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9tZDIucHVzaChgYCk7XG5cblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9kbylcblx0XHRcdHtcblx0XHRcdFx0X21kLnB1c2goYCMjICR7ZGF0ZX1cXG5gKTtcblx0XHRcdFx0X21kLnB1c2goLi4uX21kMik7XG5cblx0XHRcdFx0X29rID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fSwgW10pXG5cdDtcblxuXHRpZiAoIV9vaylcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYOeEoeazleeUn+aIkOe1seioiOizh+aWmWApO1xuXHR9XG5cdGVsc2Vcblx0e1xuXG5cdFx0X21kLnB1c2goJ1xcblxcbicpO1xuXG5cdFx0bGV0IG91dCA9IFtcblx0XHRcdGAjIEhJU1RPUllcXG5gLFxuXHRcdF0uY29uY2F0KF9tZCkuam9pbignXFxuJyk7XG5cblx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsICdISVNUT1JZLm1kJyk7XG5cblx0XHRsZXQgX2RvOiBib29sZWFuO1xuXG5cdFx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpKVxuXHRcdHtcblx0XHRcdGxldCByZXQgPSBjcmxmKGZzLnJlYWRGaWxlU3luYyhmaWxlKS50b1N0cmluZygpKTtcblxuXHRcdFx0aWYgKHJldCAhPT0gb3V0KVxuXHRcdFx0e1xuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0X2RvID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoIV9kbylcblx0XHR7XG5cdFx0XHRjb25zb2xlLmdyYXkoYOaqlOahiOeEoeiuiuWMlmApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZnMub3V0cHV0RmlsZVN5bmMoZmlsZSwgb3V0KTtcblxuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0ZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHQnLWEnLFxuXHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRgW3N0YXRdIEhJU1RPUllgLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCBwdXNoR2l0KFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSk7XG5cblx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg5oiQ5Yqf5bu656uL57Wx6KiI6LOH5paZYCk7XG5cblx0XHRcdGF3YWl0IGNyZWF0ZVB1bGxSZXF1ZXN0cygpO1xuXHRcdH1cblx0fVxuXG59KSgpO1xuIl19