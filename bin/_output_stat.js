"use strict";
/**
 * Created by user on 2018/12/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const sort_1 = require("@node-novel/sort");
const toc_1 = require("@node-novel/toc");
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
    log_1.default.debug(novelStatCache.data);
    Object.entries(novelStatCache.data.history)
        .reduceRight(function (a, b) {
        let [timestamp, stat] = b;
        let date = moment.unix(parseInt(timestamp)).format('YYYY-MM-DD');
        log_1.default.log(date);
        let _md2 = [];
        let _do;
        if (stat.epub && stat.epub.length) {
            _md2.push(`### Epub\n`);
            log_1.default.log(`Epub`);
            stat.epub.sort(function (a, b) {
                return sort_1.default(a[0], b[0])
                    || sort_1.default(a[1], b[1]);
            }).forEach(function ([pathMain, novelID]) {
                let novel = novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let n = novel.chapter - (novel.chapter_old | 0);
                let text = `- [${title}](${href}) - ${pathMain}`;
                text += ` ( v: ${novel.volume} , c: ${novel.chapter}, add: ${n} )`;
                log_1.default.log(pathMain, novelID);
                _md2.push(text);
            });
            _md2.push(``);
            _do = true;
        }
        if (stat.segment && stat.segment.length) {
            _md2.push(`### Segment\n`);
            log_1.default.log(`Segment`);
            stat.segment.sort(function (a, b) {
                return sort_1.default(a[0], b[0])
                    || sort_1.default(a[1], b[1]);
            }).forEach(function ([pathMain, novelID]) {
                let novel = novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let text = `- [${title}](${href}) - ${pathMain}`;
                text += ` ( s: ${novel.segment} )`;
                log_1.default.log(pathMain, novelID);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwyQ0FBbUQ7QUFDbkQseUNBQTBDO0FBQzFDLCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBNEQ7QUFDNUQsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFDekQsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBQ2pDLGlEQUF3RDtBQUV4RCxpQ0FBeUIsQ0FBQztJQUN6Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFakIsTUFBTSxjQUFjLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQztJQUUzQyxJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFFdkIsSUFBSSxHQUFZLENBQUM7SUFFakIsYUFBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUN6QyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUUxQixJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUxQixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRSxhQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxCLElBQUksSUFBSSxHQUFhLEVBQUUsQ0FBQztRQUV4QixJQUFJLEdBQVksQ0FBQztRQUVqQixJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxD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QjthQUVEO1lBQ0MsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFN0IsTUFBTSx1QkFBZSxDQUFDLEtBQUssRUFBRTtnQkFDNUIsS0FBSztnQkFDTCxXQUFXO2dCQUNYLElBQUk7YUFDSixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHLEVBQUUsOEJBQWEsQ0FBQyxVQUFVO2FBQzdCLENBQUMsQ0FBQztZQUVILE1BQU0sdUJBQWUsQ0FBQyxLQUFLLEVBQUU7Z0JBQzVCLFFBQVE7Z0JBQ1IsSUFBSTtnQkFDSixJQUFJO2dCQUNKLGdCQUFnQjthQUNoQixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHLEVBQUUsOEJBQWEsQ0FBQyxVQUFVO2FBQzdCLENBQUMsQ0FBQztZQUVILE1BQU0sYUFBTyxDQUFDLDhCQUFhLENBQUMsVUFBVSxFQUFFLHFCQUFlLENBQUMsNEJBQXNCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVyRixhQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTVCLE1BQU0sNkJBQWtCLEVBQUUsQ0FBQztTQUMzQjtLQUNEO0FBRUYsQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMTIvMTgvMDE4LlxuICovXG5cbmltcG9ydCBkZWZhdWx0U29ydENhbGxiYWNrIGZyb20gJ0Bub2RlLW5vdmVsL3NvcnQnO1xuaW1wb3J0IHsgbWRfaHJlZiB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IGNybGYgZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSB9IGZyb20gJy4uL2xpYi9jYWNoZS9ub3ZlbC1zdGF0JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgeyBQcm9qZWN0Q29uZmlnIH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdGVlLXByJztcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIChhc3luYyAoKSA9PiB7XG5cblx0Y29uc3Qgbm92ZWxTdGF0Q2FjaGUgPSBnZXROb3ZlbFN0YXRDYWNoZSgpO1xuXG5cdGxldCBfbWQ6IHN0cmluZ1tdID0gW107XG5cblx0bGV0IF9vazogYm9vbGVhbjtcblxuXHRjb25zb2xlLmRlYnVnKG5vdmVsU3RhdENhY2hlLmRhdGEpO1xuXG5cdE9iamVjdC5lbnRyaWVzKG5vdmVsU3RhdENhY2hlLmRhdGEuaGlzdG9yeSlcblx0XHQucmVkdWNlUmlnaHQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0bGV0IFt0aW1lc3RhbXAsIHN0YXRdID0gYjtcblxuXHRcdFx0bGV0IGRhdGUgPSBtb21lbnQudW5peChwYXJzZUludCh0aW1lc3RhbXApKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcblx0XHRcdGNvbnNvbGUubG9nKGRhdGUpO1xuXG5cdFx0XHRsZXQgX21kMjogc3RyaW5nW10gPSBbXTtcblxuXHRcdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdFx0aWYgKHN0YXQuZXB1YiAmJiBzdGF0LmVwdWIubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRfbWQyLnB1c2goYCMjIyBFcHViXFxuYCk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBFcHViYCk7XG5cblx0XHRcdFx0c3RhdC5lcHViLnNvcnQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gZGVmYXVsdFNvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgZGVmYXVsdFNvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSURdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCBuID0gbm92ZWwuY2hhcHRlciAtIChub3ZlbC5jaGFwdGVyX29sZCB8IDApO1xuXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLSBbJHt0aXRsZX1dKCR7aHJlZn0pIC0gJHtwYXRoTWFpbn1gO1xuXG5cdFx0XHRcdFx0dGV4dCArPSBgICggdjogJHtub3ZlbC52b2x1bWV9ICwgYzogJHtub3ZlbC5jaGFwdGVyfSwgYWRkOiAke259IClgO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0X21kMi5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQyLnB1c2goYGApO1xuXG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdGF0LnNlZ21lbnQgJiYgc3RhdC5zZWdtZW50Lmxlbmd0aClcblx0XHRcdHtcblx0XHRcdFx0X21kMi5wdXNoKGAjIyMgU2VnbWVudFxcbmApO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgU2VnbWVudGApO1xuXG5cdFx0XHRcdHN0YXQuc2VnbWVudC5zb3J0KGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRTb3J0Q2FsbGJhY2soYVswXSwgYlswXSlcblx0XHRcdFx0XHRcdHx8IGRlZmF1bHRTb3J0Q2FsbGJhY2soYVsxXSwgYlsxXSlcblx0XHRcdFx0fSkuZm9yRWFjaChmdW5jdGlvbiAoW3BhdGhNYWluLCBub3ZlbElEXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBub3ZlbCA9IG5vdmVsU3RhdENhY2hlLm5vdmVsKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdGxldCB0aXRsZSA9IG1kX2xpbmtfZXNjYXBlKG5vdmVsSUQpO1xuXHRcdFx0XHRcdGxldCBocmVmID0gbWRfaHJlZihbXG5cdFx0XHRcdFx0XHRwYXRoTWFpbiwgbm92ZWxJRCxcblx0XHRcdFx0XHRdLmpvaW4oJy8nKSk7XG5cblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAtIFske3RpdGxlfV0oJHtocmVmfSkgLSAke3BhdGhNYWlufWA7XG5cblx0XHRcdFx0XHR0ZXh0ICs9IGAgKCBzOiAke25vdmVsLnNlZ21lbnR9IClgO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0X21kMi5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQyLnB1c2goYGApO1xuXG5cdFx0XHRcdF9kbyA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfZG8pXG5cdFx0XHR7XG5cdFx0XHRcdF9tZC5wdXNoKGAjIyAke2RhdGV9XFxuYCk7XG5cdFx0XHRcdF9tZC5wdXNoKC4uLl9tZDIpO1xuXG5cdFx0XHRcdF9vayA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhO1xuXHRcdH0sIFtdKVxuXHQ7XG5cblx0aWYgKCFfb2spXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDnhKHms5XnlJ/miJDntbHoqIjos4fmlplgKTtcblx0fVxuXHRlbHNlXG5cdHtcblxuXHRcdF9tZC5wdXNoKCdcXG5cXG4nKTtcblxuXHRcdGxldCBvdXQgPSBbXG5cdFx0XHRgIyBISVNUT1JZXFxuYCxcblx0XHRdLmNvbmNhdChfbWQpLmpvaW4oJ1xcbicpO1xuXG5cdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCAnSElTVE9SWS5tZCcpO1xuXG5cdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdGlmIChmcy5wYXRoRXhpc3RzU3luYyhmaWxlKSlcblx0XHR7XG5cdFx0XHRsZXQgcmV0ID0gY3JsZihmcy5yZWFkRmlsZVN5bmMoZmlsZSkudG9TdHJpbmcoKSk7XG5cblx0XHRcdGlmIChyZXQgIT09IG91dClcblx0XHRcdHtcblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdF9kbyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFfZG8pXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5ncmF5KGDmqpTmoYjnhKHororljJZgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGZzLm91dHB1dEZpbGVTeW5jKGZpbGUsIG91dCk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdGZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0YFtzdGF0XSBISVNUT1JZYCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgcHVzaEdpdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIGdldFB1c2hVcmxHaXRlZShHSVRfU0VUVElOR19ESVNUX05PVkVMLnVybCkpO1xuXG5cdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueri+e1seioiOizh+aWmWApO1xuXG5cdFx0XHRhd2FpdCBjcmVhdGVQdWxsUmVxdWVzdHMoKTtcblx0XHR9XG5cdH1cblxufSkoKTtcbiJdfQ==