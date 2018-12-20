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
    log_1.default.debug(moment(novelStatCache.timestamp));
    let _md = [];
    let _ok;
    log_1.default.dir(novelStatCache.data, {
        depth: null,
        colors: true,
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFDekQsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBQ2pDLGlEQUF3RDtBQUV4RCxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFakIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztJQUUzQyxhQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUVoRCxJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFFdkIsSUFBSSxHQUFZLENBQUM7SUFFakIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO1FBQ2hDLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7S0FDWixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3pDLFdBQVcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBRTFCLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFCLElBQUksSUFBSSxHQUFHLHlCQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRWxFLElBQUksSUFBSSxHQUFhLEVB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Y0FBYyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUU3QixNQUFNLHVCQUFlLENBQUMsS0FBSyxFQUFFO2dCQUM1QixLQUFLO2dCQUNMLFdBQVc7Z0JBQ1gsSUFBSTthQUNKLEVBQUU7Z0JBQ0YsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLEdBQUcsRUFBRSw4QkFBYSxDQUFDLFVBQVU7YUFDN0IsQ0FBQyxDQUFDO1lBRUgsTUFBTSx1QkFBZSxDQUFDLEtBQUssRUFBRTtnQkFDNUIsUUFBUTtnQkFDUixJQUFJO2dCQUNKLElBQUk7Z0JBQ0osZ0JBQWdCO2FBQ2hCLEVBQUU7Z0JBQ0YsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLEdBQUcsRUFBRSw4QkFBYSxDQUFDLFVBQVU7YUFDN0IsQ0FBQyxDQUFDO1lBRUgsTUFBTSxhQUFPLENBQUMsOEJBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQWUsQ0FBQyw0QkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXJGLGFBQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFNUIsTUFBTSw2QkFBa0IsRUFBRSxDQUFDO1NBQzNCO0tBQ0Q7QUFFRixDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMi8xOC8wMTguXG4gKi9cblxuaW1wb3J0IGRlZmF1bHRTb3J0Q2FsbGJhY2sgZnJvbSAnQG5vZGUtbm92ZWwvc29ydCc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IHRvY1NvcnRDYWxsYmFjayB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy9saWIvdXRpbCc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IGNybGYgZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSwgY3JlYXRlTW9tZW50IH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IFByb2plY3RDb25maWcgfSBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBjcmVhdGVQdWxsUmVxdWVzdHMgfSBmcm9tICcuLi9zY3JpcHQvZ2l0ZWUtcHInO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+IHtcblxuXHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cblx0Y29uc29sZS5kZWJ1Zyhtb21lbnQobm92ZWxTdGF0Q2FjaGUudGltZXN0YW1wKSk7XG5cblx0bGV0IF9tZDogc3RyaW5nW10gPSBbXTtcblxuXHRsZXQgX29rOiBib29sZWFuO1xuXG5cdGNvbnNvbGUuZGlyKG5vdmVsU3RhdENhY2hlLmRhdGEsIHtcblx0XHRkZXB0aDogbnVsbCxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXG5cdE9iamVjdC5lbnRyaWVzKG5vdmVsU3RhdENhY2hlLmRhdGEuaGlzdG9yeSlcblx0XHQucmVkdWNlUmlnaHQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0bGV0IFt0aW1lc3RhbXAsIHN0YXRdID0gYjtcblxuXHRcdFx0bGV0IGRhdGUgPSBjcmVhdGVNb21lbnQocGFyc2VJbnQodGltZXN0YW1wKSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG5cblx0XHRcdGxldCBfbWQyOiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0XHRsZXQgX2RvOiBib29sZWFuO1xuXG5cdFx0XHRpZiAoc3RhdC5lcHViICYmIHN0YXQuZXB1Yi5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIEVwdWJcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgRXB1YmApO1xuXG5cdFx0XHRcdHN0YXQuZXB1Yi5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxEYXRhXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsRGF0YSB8fCBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBub3ZlbC5jaGFwdGVyIC0gKG5vdmVsLmNoYXB0ZXJfb2xkIHwgMCk7XG5cblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAtIFske3RpdGxlfV0oJHtocmVmfSkgLSAke3BhdGhNYWlufWA7XG5cblx0XHRcdFx0XHR0ZXh0ICs9IGBcXG4gIDxici8+KCB2OiAke25vdmVsLnZvbHVtZX0gLCBjOiAke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6ICR7bn0gKWA7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdF9tZDIucHVzaCh0ZXh0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X21kMi5wdXNoKGBgKTtcblxuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3RhdC5zZWdtZW50ICYmIHN0YXQuc2VnbWVudC5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIFNlZ21lbnRcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgU2VnbWVudGApO1xuXG5cdFx0XHRcdHN0YXQuc2VnbWVudC5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxEYXRhXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsRGF0YSB8fCBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLSBbJHt0aXRsZX1dKCR7aHJlZn0pIC0gJHtwYXRoTWFpbn1gO1xuXG5cdFx0XHRcdFx0dGV4dCArPSBgXFxuICA8YnIvPiggczogJHtub3ZlbC5zZWdtZW50fSApYDtcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0X21kMi5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQyLnB1c2goYGApO1xuXG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfZG8pXG5cdFx0XHR7XG5cdFx0XHRcdF9tZC5wdXNoKGAjIyAke2RhdGV9XFxuYCk7XG5cdFx0XHRcdF9tZC5wdXNoKC4uLl9tZDIpO1xuXG5cdFx0XHRcdF9vayA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhO1xuXHRcdH0sIFtdKVxuXHQ7XG5cblx0aWYgKCFfb2spXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDnhKHms5XnlJ/miJDntbHoqIjos4fmlplgKTtcblx0fVxuXHRlbHNlXG5cdHtcblxuXHRcdF9tZC5wdXNoKCdcXG5cXG4nKTtcblxuXHRcdGxldCBvdXQgPSBbXG5cdFx0XHRgIyBISVNUT1JZXFxuYCxcblx0XHRdLmNvbmNhdChfbWQpLmpvaW4oJ1xcbicpO1xuXG5cdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCAnSElTVE9SWS5tZCcpO1xuXG5cdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdGlmIChmcy5wYXRoRXhpc3RzU3luYyhmaWxlKSlcblx0XHR7XG5cdFx0XHRsZXQgcmV0ID0gY3JsZihmcy5yZWFkRmlsZVN5bmMoZmlsZSkudG9TdHJpbmcoKSk7XG5cblx0XHRcdGlmIChyZXQgIT09IG91dClcblx0XHRcdHtcblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdF9kbyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFfZG8pXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5ncmF5KGDmqpTmoYjnhKHororljJZgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGZzLm91dHB1dEZpbGVTeW5jKGZpbGUsIG91dCk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdGZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0YFtzdGF0XSBISVNUT1JZYCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgcHVzaEdpdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIGdldFB1c2hVcmxHaXRlZShHSVRfU0VUVElOR19ESVNUX05PVkVMLnVybCkpO1xuXG5cdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueri+e1seioiOizh+aWmWApO1xuXG5cdFx0XHRhd2FpdCBjcmVhdGVQdWxsUmVxdWVzdHMoKTtcblx0XHR9XG5cdH1cblxufSkoKTtcbiJdfQ==