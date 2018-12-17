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
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    let _md = [];
    let _ok;
    Object.entries(novelStatCache.data.history)
        .reduceRight(function (a, b) {
        let [timestamp, stat] = b;
        if (stat.epub && stat.epub.length) {
            let date = moment.unix(parseInt(timestamp)).format('YYYY-MM-DD');
            log_1.default.log(date);
            _md.push(`## ${date}\n`);
            stat.epub.sort(function (a, b) {
                return sort_1.default(a[0], b[0])
                    || sort_1.default(a[1], b[1]);
            }).forEach(function ([pathMain, novelID]) {
                let novel = novelStatCache.novel(pathMain, novelID);
                let title = toc_contents_1.md_link_escape(novelID);
                let href = toc_1.md_href([
                    pathMain, novelID,
                ].join('/'));
                let text = `- [${title}](${href}) - ${pathMain}`;
                log_1.default.log(pathMain, novelID);
                _md.push(text);
            });
            _md.push(``);
            _ok = true;
        }
        return a;
    }, []);
    if (!_ok) {
        log_1.default.error(`無法生成統計資料`);
    }
    else {
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
        }
    }
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX291dHB1dF9zdGF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX291dHB1dF9zdGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwyQ0FBbUQ7QUFDbkQseUNBQTBDO0FBQzFDLCtEQUE4RDtBQUM5RCxtREFBa0M7QUFDbEMscUNBQXFEO0FBQ3JELG9DQUEyRDtBQUMzRCx3REFBNEQ7QUFDNUQsd0NBQTBFO0FBQzFFLHNEQUFrRDtBQUNsRCx1Q0FBeUQ7QUFDekQsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQywrQkFBZ0M7QUFDaEMsb0NBQWlDO0FBRWpDLGlDQUF5QixDQUFDO0lBQ3pCLHVCQUFlLENBQUMsZUFBZTtDQUMvQixDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVqQixNQUFNLGNBQWMsR0FBRyw4QkFBaUIsRUFBRSxDQUFDO0lBRTNDLElBQUksR0FBRyxHQUFhLEVBQUUsQ0FBQztJQUV2QixJQUFJLEdBQVksQ0FBQztJQUVqQixNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3pDLFdBQVcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBRTFCLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFDakM7WUFDQyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVqRSxhQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWxCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDO1lBRXpCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUs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Q0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMTIvMTgvMDE4LlxuICovXG5cbmltcG9ydCBkZWZhdWx0U29ydENhbGxiYWNrIGZyb20gJ0Bub2RlLW5vdmVsL3NvcnQnO1xuaW1wb3J0IHsgbWRfaHJlZiB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgeyBtZF9saW5rX2VzY2FwZSB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYy90b2NfY29udGVudHMnO1xuaW1wb3J0IGNybGYgZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTCB9IGZyb20gJy4uL2RhdGEvZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBnZXROb3ZlbFN0YXRDYWNoZSB9IGZyb20gJy4uL2xpYi9jYWNoZS9ub3ZlbC1zdGF0JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgeyBQcm9qZWN0Q29uZmlnIH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuXG5jaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKFtcblx0RW51bVNoYXJlU3RhdGVzLldBSVRfQ1JFQVRFX0dJVFxuXSkgJiYgKGFzeW5jICgpID0+IHtcblxuXHRjb25zdCBub3ZlbFN0YXRDYWNoZSA9IGdldE5vdmVsU3RhdENhY2hlKCk7XG5cblx0bGV0IF9tZDogc3RyaW5nW10gPSBbXTtcblxuXHRsZXQgX29rOiBib29sZWFuO1xuXG5cdE9iamVjdC5lbnRyaWVzKG5vdmVsU3RhdENhY2hlLmRhdGEuaGlzdG9yeSlcblx0XHQucmVkdWNlUmlnaHQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0bGV0IFt0aW1lc3RhbXAsIHN0YXRdID0gYjtcblxuXHRcdFx0aWYgKHN0YXQuZXB1YiAmJiBzdGF0LmVwdWIubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZGF0ZSA9IG1vbWVudC51bml4KHBhcnNlSW50KHRpbWVzdGFtcCkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKGRhdGUpO1xuXG5cdFx0XHRcdF9tZC5wdXNoKGAjIyAke2RhdGV9XFxuYCk7XG5cblx0XHRcdFx0c3RhdC5lcHViLnNvcnQoZnVuY3Rpb24gKGEsIGIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gZGVmYXVsdFNvcnRDYWxsYmFjayhhWzBdLCBiWzBdKVxuXHRcdFx0XHRcdFx0fHwgZGVmYXVsdFNvcnRDYWxsYmFjayhhWzFdLCBiWzFdKVxuXHRcdFx0XHR9KS5mb3JFYWNoKGZ1bmN0aW9uIChbcGF0aE1haW4sIG5vdmVsSURdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IG5vdmVsID0gbm92ZWxTdGF0Q2FjaGUubm92ZWwocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdFx0bGV0IHRpdGxlID0gbWRfbGlua19lc2NhcGUobm92ZWxJRCk7XG5cdFx0XHRcdFx0bGV0IGhyZWYgPSBtZF9ocmVmKFtcblx0XHRcdFx0XHRcdHBhdGhNYWluLCBub3ZlbElELFxuXHRcdFx0XHRcdF0uam9pbignLycpKTtcblxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gYC0gWyR7dGl0bGV9XSgke2hyZWZ9KSAtICR7cGF0aE1haW59YDtcblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRcdF9tZC5wdXNoKHRleHQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbWQucHVzaChgYCk7XG5cblx0XHRcdFx0X29rID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fSwgW10pXG5cdDtcblxuXHRpZiAoIV9vaylcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYOeEoeazleeUn+aIkOe1seioiOizh+aWmWApO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGxldCBvdXQgPSBbXG5cdFx0XHRgIyBISVNUT1JZXFxuYCxcblx0XHRdLmNvbmNhdChfbWQpLmpvaW4oJ1xcbicpO1xuXG5cdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCAnSElTVE9SWS5tZCcpO1xuXG5cdFx0bGV0IF9kbzogYm9vbGVhbjtcblxuXHRcdGlmIChmcy5wYXRoRXhpc3RzU3luYyhmaWxlKSlcblx0XHR7XG5cdFx0XHRsZXQgcmV0ID0gY3JsZihmcy5yZWFkRmlsZVN5bmMoZmlsZSkudG9TdHJpbmcoKSk7XG5cblx0XHRcdGlmIChyZXQgIT09IG91dClcblx0XHRcdHtcblx0XHRcdFx0X2RvID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdF9kbyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFfZG8pXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5ncmF5KGDmqpTmoYjnhKHororljJZgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGZzLm91dHB1dEZpbGVTeW5jKGZpbGUsIG91dCk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0Jy0tdmVyYm9zZScsXG5cdFx0XHRcdGZpbGUsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LFxuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IGNyb3NzU3Bhd25Bc3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0YFtzdGF0XSBISVNUT1JZYCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgcHVzaEdpdChQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsIGdldFB1c2hVcmxHaXRlZShHSVRfU0VUVElOR19ESVNUX05PVkVMLnVybCkpO1xuXG5cdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueri+e1seioiOizh+aWmWApO1xuXHRcdH1cblx0fVxuXG59KSgpO1xuIl19