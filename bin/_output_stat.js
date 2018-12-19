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
            }).forEach(function ([pathMain, novelID]) {
                let novel = novelStatCache.novel(pathMain, novelID);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCx5Q0FBMEM7QUFDMUMsbURBQTJEO0FBQzNELCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBNEQ7QUFDNUQsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFDekQsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBQ2pDLGlEQUF3RDtBQUV4RCxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFakIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztJQUUzQyxJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFFdkIsSUFBSSxHQUFZLENBQUM7SUFFakIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO1FBQ2hDLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7S0FDWixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3pDLFdBQVcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBRTFCLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pFLG9CQUFvQjtRQUVwQixJQUFJLElBQUksR0FBYSxFQUFFLENBQUM7UUFFeEIsSUFBSSxHQUFZLENBQUM7UUFFakIsSUFBSSxJQUFJ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LFdBQVc7Z0JBQ1gsSUFBSTthQUNKLEVBQUU7Z0JBQ0YsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLEdBQUcsRUFBRSw4QkFBYSxDQUFDLFVBQVU7YUFDN0IsQ0FBQyxDQUFDO1lBRUgsTUFBTSx1QkFBZSxDQUFDLEtBQUssRUFBRTtnQkFDNUIsUUFBUTtnQkFDUixJQUFJO2dCQUNKLElBQUk7Z0JBQ0osZ0JBQWdCO2FBQ2hCLEVBQUU7Z0JBQ0YsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLEdBQUcsRUFBRSw4QkFBYSxDQUFDLFVBQVU7YUFDN0IsQ0FBQyxDQUFDO1lBRUgsTUFBTSxhQUFPLENBQUMsOEJBQWEsQ0FBQyxVQUFVLEVBQUUscUJBQWUsQ0FBQyw0QkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXJGLGFBQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFNUIsTUFBTSw2QkFBa0IsRUFBRSxDQUFDO1NBQzNCO0tBQ0Q7QUFFRixDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMi8xOC8wMTguXG4gKi9cblxuaW1wb3J0IGRlZmF1bHRTb3J0Q2FsbGJhY2sgZnJvbSAnQG5vZGUtbm92ZWwvc29ydCc7XG5pbXBvcnQgeyBtZF9ocmVmIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IHRvY1NvcnRDYWxsYmFjayB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy9saWIvdXRpbCc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IGNybGYgZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSB9IGZyb20gJy4uL2xpYi9jYWNoZS9ub3ZlbC1zdGF0JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgeyBQcm9qZWN0Q29uZmlnIH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdGVlLXByJztcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9PiB7XG5cblx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5cdGxldCBfbWQ6IHN0cmluZ1tdID0gW107XG5cblx0bGV0IF9vazogYm9vbGVhbjtcblxuXHRjb25zb2xlLmRpcihub3ZlbFN0YXRDYWNoZS5kYXRhLCB7XG5cdFx0ZGVwdGg6IG51bGwsXG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9KTtcblxuXHRPYmplY3QuZW50cmllcyhub3ZlbFN0YXRDYWNoZS5kYXRhLmhpc3RvcnkpXG5cdFx0LnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdHtcblx0XHRcdGxldCBbdGltZXN0YW1wLCBzdGF0XSA9IGI7XG5cblx0XHRcdGxldCBkYXRlID0gbW9tZW50LnVuaXgocGFyc2VJbnQodGltZXN0YW1wKSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGRhdGUpO1xuXG5cdFx0XHRsZXQgX21kMjogc3RyaW5nW10gPSBbXTtcblxuXHRcdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdFx0aWYgKHN0YXQuZXB1YiAmJiBzdGF0LmVwdWIubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQyLnB1c2goYCMjIyBFcHViXFxuYCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYEVwdWJgKTtcblxuXHRcdFx0XHRzdGF0LmVwdWIuc29ydChmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiB0b2NTb3J0Q2FsbGJhY2soYVswXSwgYlswXSlcblx0XHRcdFx0XHRcdHx8IHRvY1NvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSURdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCBuID0gbm92ZWwuY2hhcHRlciAtIChub3ZlbC5jaGFwdGVyX29sZCB8IDApO1xuXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLSBbJHt0aXRsZX1dKCR7aHJlZn0pIC0gJHtwYXRoTWFpbn1gO1xuXG5cdFx0XHRcdFx0dGV4dCArPSBgXFxuICA8YnIvPiggdjogJHtub3ZlbC52b2x1bWV9ICwgYzogJHtub3ZlbC5jaGFwdGVyfSwgYWRkOiAke259IClgO1xuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0XHRfbWQyLnB1c2godGV4dCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9tZDIucHVzaChgYCk7XG5cblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXQuc2VnbWVudCAmJiBzdGF0LnNlZ21lbnQubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQyLnB1c2goYCMjIyBTZWdtZW50XFxuYCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFNlZ21lbnRgKTtcblxuXHRcdFx0XHRzdGF0LnNlZ21lbnQuc29ydChmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiB0b2NTb3J0Q2FsbGJhY2soYVswXSwgYlswXSlcblx0XHRcdFx0XHRcdHx8IHRvY1NvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSURdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gYC0gWyR7dGl0bGV9XSgke2hyZWZ9KSAtICR7cGF0aE1haW59YDtcblxuXHRcdFx0XHRcdHRleHQgKz0gYFxcbiAgPGJyLz4oIHM6ICR7bm92ZWwuc2VnbWVudH0gKWA7XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdF9tZDIucHVzaCh0ZXh0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X21kMi5wdXNoKGBgKTtcblxuXHRcdFx0XHRfZG8gPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2RvKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQucHVzaChgIyMgJHtkYXRlfVxcbmApO1xuXHRcdFx0XHRfbWQucHVzaCguLi5fbWQyKTtcblxuXHRcdFx0XHRfb2sgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYTtcblx0XHR9LCBbXSlcblx0O1xuXG5cdGlmICghX29rKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihg54Sh5rOV55Sf5oiQ57Wx6KiI6LOH5paZYCk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cblx0XHRfbWQucHVzaCgnXFxuXFxuJyk7XG5cblx0XHRsZXQgb3V0ID0gW1xuXHRcdFx0YCMgSElTVE9SWVxcbmAsXG5cdFx0XS5jb25jYXQoX21kKS5qb2luKCdcXG4nKTtcblxuXHRcdGxldCBmaWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcubm92ZWxfcm9vdCwgJ0hJU1RPUlkubWQnKTtcblxuXHRcdGxldCBfZG86IGJvb2xlYW47XG5cblx0XHRpZiAoZnMucGF0aEV4aXN0c1N5bmMoZmlsZSkpXG5cdFx0e1xuXHRcdFx0bGV0IHJldCA9IGNybGYoZnMucmVhZEZpbGVTeW5jKGZpbGUpLnRvU3RyaW5nKCkpO1xuXG5cdFx0XHRpZiAocmV0ICE9PSBvdXQpXG5cdFx0XHR7XG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRfZG8gPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICghX2RvKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZ3JheShg5qqU5qGI54Sh6K6K5YyWYCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRmcy5vdXRwdXRGaWxlU3luYyhmaWxlLCBvdXQpO1xuXG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCctLXZlcmJvc2UnLFxuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IFByb2plY3RDb25maWcubm92ZWxfcm9vdCxcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdCctYScsXG5cdFx0XHRcdCctbScsXG5cdFx0XHRcdGBbc3RhdF0gSElTVE9SWWAsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IHB1c2hHaXQoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBnZXRQdXNoVXJsR2l0ZWUoR0lUX1NFVFRJTkdfRElTVF9OT1ZFTC51cmwpKTtcblxuXHRcdFx0Y29uc29sZS5zdWNjZXNzKGDmiJDlip/lu7rnq4vntbHoqIjos4fmlplgKTtcblxuXHRcdFx0YXdhaXQgY3JlYXRlUHVsbFJlcXVlc3RzKCk7XG5cdFx0fVxuXHR9XG5cbn0pKCk7XG4iXX0=