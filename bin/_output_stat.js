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
const gitee_pr_1 = require("../script/gitee-pr");
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
        if (!_do) {
            log_1.default.gray(`檔案無變化`);
        }
        else {
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
            let api_file = novelStatCache.file_git;
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
    let { history, novels } = novelStatCache.data;
    log_1.default.dir({ history, novels }, {
        depth: null,
        colors: true,
    });
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBMEU7QUFDMUUsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFFekQsK0JBQWdDO0FBQ2hDLCtCQUFnQztBQUNoQyxvQ0FBaUM7QUFDakMsaURBQXdEO0FBRXhELGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVqQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0lBRTNDLGFBQU8sQ0FBQyxLQUFLLENBQUMseUJBQVksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUUvRCxJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFFdkIsSUFBSSxHQUFZLENBQUM7SUFFakIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUN6QyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUUxQixJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUxQixJQUFJLElBQUksR0FBRyx5QkFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUVsRSxJQUFJLElBQUksR0FBYSxFQUFFLENBQUM7UUFFeEIsSUFBSSxHQUFZLENBQUM7UUFFakIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUNqQztZQUNDLElB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LElBQUk7S0FDWixDQUFDLENBQUM7QUFFSixDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMi8xOC8wMTguXG4gKi9cblxuaW1wb3J0IGRlZmF1bHRTb3J0Q2FsbGJhY2sgZnJvbSAnQG5vZGUtbm92ZWwvc29ydCc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IHRvY1NvcnRDYWxsYmFjayB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy9saWIvdXRpbCc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IGNybGYgZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSwgY3JlYXRlTW9tZW50IH0gZnJvbSAnLi4vbGliL2NhY2hlL25vdmVsLXN0YXQnO1xuaW1wb3J0IHsgY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cywgRW51bVNoYXJlU3RhdGVzIH0gZnJvbSAnLi4vbGliL3NoYXJlJztcbmltcG9ydCB7IFByb2plY3RDb25maWcgfSBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBnZXRQdXNoVXJsR2l0ZWUsIHB1c2hHaXQgfSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBjcmVhdGVQdWxsUmVxdWVzdHMgfSBmcm9tICcuLi9zY3JpcHQvZ2l0ZWUtcHInO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+IHtcblxuXHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cblx0Y29uc29sZS5kZWJ1ZyhjcmVhdGVNb21lbnQobm92ZWxTdGF0Q2FjaGUudGltZXN0YW1wKS5mb3JtYXQoKSk7XG5cblx0bGV0IF9tZDogc3RyaW5nW10gPSBbXTtcblxuXHRsZXQgX29rOiBib29sZWFuO1xuXG5cdE9iamVjdC5lbnRyaWVzKG5vdmVsU3RhdENhY2hlLmRhdGEuaGlzdG9yeSlcblx0XHQucmVkdWNlUmlnaHQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0bGV0IFt0aW1lc3RhbXAsIHN0YXRdID0gYjtcblxuXHRcdFx0bGV0IGRhdGUgPSBjcmVhdGVNb21lbnQocGFyc2VJbnQodGltZXN0YW1wKSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG5cblx0XHRcdGxldCBfbWQyOiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0XHRsZXQgX2RvOiBib29sZWFuO1xuXG5cdFx0XHRpZiAoc3RhdC5lcHViICYmIHN0YXQuZXB1Yi5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIEVwdWJcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgRXB1YmApO1xuXG5cdFx0XHRcdHN0YXQuZXB1Yi5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxEYXRhXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsRGF0YSB8fCBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IG4gPSBub3ZlbC5jaGFwdGVyIC0gKG5vdmVsLmNoYXB0ZXJfb2xkIHwgMCk7XG5cblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAtIFske3RpdGxlfV0oJHtocmVmfSkgLSAke3BhdGhNYWlufWA7XG5cblx0XHRcdFx0XHR0ZXh0ICs9IGBcXG4gIDxici8+KCB2OiAke25vdmVsLnZvbHVtZX0gLCBjOiAke25vdmVsLmNoYXB0ZXJ9LCBhZGQ6ICR7bn0gKWA7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdF9tZDIucHVzaCh0ZXh0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X21kMi5wdXNoKGBgKTtcblxuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3RhdC5zZWdtZW50ICYmIHN0YXQuc2VnbWVudC5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdF9tZDIucHVzaChgIyMjIFNlZ21lbnRcXG5gKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgU2VnbWVudGApO1xuXG5cdFx0XHRcdHN0YXQuc2VnbWVudC5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHRvY1NvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgdG9jU29ydENhbGxiYWNrKGFbMV0sIGJbMV0pXG5cdFx0XHRcdH0pLmZvckVhY2goZnVuY3Rpb24gKFtwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxEYXRhXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsRGF0YSB8fCBub3ZlbFN0YXRDYWNoZS5ub3ZlbChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRsZXQgdGl0bGUgPSBtZF9saW5rX2VzY2FwZShub3ZlbElEKTtcblx0XHRcdFx0XHRsZXQgaHJlZiA9IG1kX2hyZWYoW1xuXHRcdFx0XHRcdFx0cGF0aE1haW4sIG5vdmVsSUQsXG5cdFx0XHRcdFx0XS5qb2luKCcvJykpO1xuXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLSBbJHt0aXRsZX1dKCR7aHJlZn0pIC0gJHtwYXRoTWFpbn1gO1xuXG5cdFx0XHRcdFx0dGV4dCArPSBgXFxuICA8YnIvPiggczogJHtub3ZlbC5zZWdtZW50fSApYDtcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0X21kMi5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQyLnB1c2goYGApO1xuXG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfZG8pXG5cdFx0XHR7XG5cdFx0XHRcdF9tZC5wdXNoKGAjIyAke2RhdGV9XFxuYCk7XG5cdFx0XHRcdF9tZC5wdXNoKC4uLl9tZDIpO1xuXG5cdFx0XHRcdF9vayA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhO1xuXHRcdH0sIFtdKVxuXHQ7XG5cblx0aWYgKCFfb2spXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDnhKHms5XnlJ/miJDntbHoqIjos4fmlplgKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRfbWQucHVzaCgnXFxuXFxuJyk7XG5cblx0XHRsZXQgb3V0ID0gW1xuXHRcdFx0YCMgSElTVE9SWVxcbmAsXG5cdFx0XS5jb25jYXQoX21kKS5qb2luKCdcXG4nKTtcblxuXHRcdGxldCBmaWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgJ0hJU1RPUlkubWQnKTtcblxuXHRcdGxldCBfZG86IGJvb2xlYW47XG5cblx0XHRpZiAoZnMucGF0aEV4aXN0c1N5bmMoZmlsZSkpXG5cdFx0e1xuXHRcdFx0bGV0IHJldCA9IGNybGYoZnMucmVhZEZpbGVTeW5jKGZpbGUpLnRvU3RyaW5nKCkpO1xuXG5cdFx0XHRpZiAocmV0ICE9PSBvdXQpXG5cdFx0XHR7XG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRfZG8gPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICghX2RvKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZ3JheShg5qqU5qGI54Sh6K6K5YyWYCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRub3ZlbFN0YXRDYWNoZS5zYXZlKDIpO1xuXG5cdFx0XHRmcy5vdXRwdXRGaWxlU3luYyhmaWxlLCBvdXQpO1xuXG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgYXBpX2ZpbGUgPSBub3ZlbFN0YXRDYWNoZS5maWxlX2dpdDtcblxuXHRcdFx0ZnMuY29weVN5bmMobm92ZWxTdGF0Q2FjaGUuZmlsZSwgYXBpX2ZpbGUsIHtcblx0XHRcdFx0b3ZlcndyaXRlOiB0cnVlLFxuXHRcdFx0XHRwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0YXBpX2ZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0YFtzdGF0XSBISVNUT1JZYCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgcHVzaEdpdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIGdldFB1c2hVcmxHaXRlZShHSVRfU0VUVElOR19ESVNUX05PVkVMLnVybCkpO1xuXG5cdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueri+e1seioiOizh+aWmWApO1xuXG5cdFx0XHRhd2FpdCBjcmVhdGVQdWxsUmVxdWVzdHMoKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgeyBoaXN0b3J5LCBub3ZlbHMgfSA9IG5vdmVsU3RhdENhY2hlLmRhdGE7XG5cblx0Y29uc29sZS5kaXIoeyBoaXN0b3J5LCBub3ZlbHMgfSwge1xuXHRcdGRlcHRoOiBudWxsLFxuXHRcdGNvbG9yczogdHJ1ZSxcblx0fSk7XG5cbn0pKCk7XG4iXX0=