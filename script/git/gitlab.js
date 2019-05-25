"use strict";
/**
 * Created by user on 2019/1/26/026.
 */
Object.defineProperty(exports, "__esModule", { value: true });
//import { ProjectId } from 'gitlab/types/types';
const git_1 = require("../git");
const project_config_1 = require("../../project.config");
const dotenv_1 = require("dotenv");
const path = require("upath2");
const log_1 = require("../../lib/log");
const Bluebird = require("bluebird");
const gitlab_1 = require("gitlab");
//import * as APIServices from 'gitlab/dist/services';
const chai_1 = require("chai");
function createPullRequestsGitlab() {
    // @ts-ignore
    return Bluebird.resolve()
        .then(async function () {
        log_1.default.info(`嘗試建立 PR`);
        let br_name = git_1.currentBranchName(project_config_1.novel_root);
        if (!br_name.match(/^auto\//)) {
            log_1.default.error(`目前分支為 ${br_name} 忽略建立 PR`);
            return;
        }
        else {
            log_1.default.info(`目前分支為 ${br_name}`);
        }
        let _p = [
            {
                //id: 10539227,
                id: 10553494,
                br: `${br_name}`,
            },
            {
                //id: 10538240,
                id: 10548591,
                br: `master`,
            },
        ];
        let _i = 0;
        let _ij = Math.abs(_i - 1);
        const api = apiGitlab();
        let projectId = decodeProjectId(_p[_i].id);
        let sourceBranch = _p[_i].br;
        let targetBranch = _p[_ij].br;
        //			sourceBranch = encodeProjectId(sourceBranch);
        let target_project_id = _p[_ij].id;
        let title = `auto pr (${br_name})`;
        // @ts-ignore
        return Bluebird.resolve()
            .then(function () {
            return api.MergeRequests.create(projectId, sourceBranch, targetBranch, title, {
                remove_source_branch: true,
                allow_collaboration: true,
                allow_maintainer_to_push: true,
                /*
                labels: [

                ].join(','),
                */
                target_project_id,
            });
        })
            .tap(function (ret) {
            let data = filterGitlabMergeRequestsCreateReturn(ret);
            if (!data.merge_status || String(data.merge_status) == 'cannot_be_merged') {
                log_1.default.error(`建立 PR 失敗 #${data.iid} ${data.title}`);
                log_1.default.red.dir(data);
            }
            else {
                log_1.default.success(`成功建立 PR #${data.iid} ${data.title}`);
                log_1.default.dir(data);
            }
        })
            .catch(function (err) {
            let _know_error = false;
            if (err.body) {
                if (err.body.message && String(err.body.message).match(/Another open merge request already exists for this source branch/)) {
                    _know_error = true;
                    log_1.default.info(`本次使用的分支已經建立過 PR，無須在意此錯誤訊息`);
                }
            }
            //console.dir(err);
            if (_know_error) {
                log_1.default.info(err.toString());
                log_1.default.dir(err.body);
            }
            else {
                log_1.default.error(`建立 PR 失敗`);
                log_1.default.error(err.toString());
                log_1.default.red.dir(err.body);
            }
            return err;
        })
            .catch(e => e);
    });
}
exports.createPullRequestsGitlab = createPullRequestsGitlab;
exports.default = createPullRequestsGitlab;
function filterGitlabMergeRequestsCreateReturn(ret) {
    let { id, iid, project_id, title, description, state, created_at, updated_at, target_branch, source_branch, target_project_id, source_project_id, labels, work_in_progress, merge_status, merge_error, squash, changes_count, should_remove_source_branch, web_url, diff_refs, } = ret;
    /*
    console.dir(ret, {
        depth: 5,
        colors: true,
    });
    */
    return {
        id,
        iid,
        project_id,
        title,
        description,
        state,
        created_at,
        updated_at,
        target_branch,
        source_branch,
        target_project_id,
        source_project_id,
        labels,
        work_in_progress,
        merge_status,
        merge_error,
        squash,
        changes_count,
        should_remove_source_branch,
        web_url,
        diff_refs,
    };
}
exports.filterGitlabMergeRequestsCreateReturn = filterGitlabMergeRequestsCreateReturn;
function apiGitlab() {
    log_1.default.info(`連接 api`);
    let _env = _getEnvGitlab();
    try {
        /*
        const api = new ProjectsBundle({
            token: _env.ACCESS_TOKEN,
        });
        */
        const api = new gitlab_1.default({
            token: _env.ACCESS_TOKEN,
        });
        return api;
    }
    catch (e) {
        log_1.default.error(`連接 api 失敗`);
        log_1.default.error(e.message);
    }
}
exports.apiGitlab = apiGitlab;
/**
 * because gitlab will auto do `const pId = encodeURIComponent(projectId);`
 */
function decodeProjectId(projectId) {
    if (typeof projectId === 'string') {
        if (/^\d+$/.test(projectId)) {
            return projectId;
        }
        let arr = projectId.split(/%2F|\//);
        chai_1.expect(arr).have.lengthOf(2);
        return arr.join('/');
    }
    chai_1.expect(projectId).a('number');
    return projectId;
}
exports.decodeProjectId = decodeProjectId;
function encodeProjectId(projectId) {
    if (typeof projectId === 'string') {
        if (/^\d+$/.test(projectId)) {
            return projectId;
        }
        let arr = projectId.split(/%2F|\//);
        return arr.join('%2F');
    }
    chai_1.expect(projectId).a('number');
    return projectId;
}
exports.encodeProjectId = encodeProjectId;
function _getEnvGitlab() {
    let ACCESS_TOKEN = process.env.GITLAB_ACCESS_TOKEN || '';
    let TOKEN = process.env.GITLAB_TOKEN || '';
    if (!ACCESS_TOKEN || !TOKEN) {
        let env = dotenv_1.config({ path: path.join(project_config_1.default.project_root, '.env') });
        if (env.parsed) {
            ACCESS_TOKEN = ACCESS_TOKEN || env.parsed.GITLAB_ACCESS_TOKEN;
            TOKEN = TOKEN || env.parsed.GITLAB_TOKEN;
        }
    }
    return {
        /**
         * for api. Can be created in your profile.
         * https://gitlab.com/profile/personal_access_tokens
         */
        ACCESS_TOKEN,
        /**
         * username:password@
         */
        TOKEN,
    };
}
exports._getEnvGitlab = _getEnvGitlab;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCxpREFBaUQ7QUFDakQsZ0NBQTJDO0FBQzNDLHlEQUFpRTtBQUNqRSxtQ0FBZ0Q7QUFDaEQsK0JBQWdDO0FBQ2hDLHVDQUFvQztBQUNwQyxxQ0FBc0M7QUFFdEMsbUNBQWdEO0FBQ2hELHNEQUFzRDtBQUN0RCwrQkFBOEI7QUFJOUIsU0FBZ0Isd0JBQXdCO0lBRXZDLGFBQWE7SUFDYixPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUU7U0FDdkIsSUFBSSxDQUFDLEtBQUs7UUFFVixhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXhCLElBQUksT0FBTyxHQUFHLHVCQUFpQixDQUFDLDJCQUFVLENBQUMsQ0FBQztRQUU1QyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFDN0I7WUFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsT0FBTyxVQUFVLENBQUMsQ0FBQztZQUUxQyxPQUFPO1NBQ1A7YUFFRDtZQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsSUFBSSxFQUFFLEdBQUc7WUFDUjtnQkFDQyxlQUFlO2dCQUNmLEVBQUUsRUFBRSxRQUFRO2dCQUNaLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRTthQUNoQjtZQUNEO2dCQUNDLGVBQWU7Z0JBQ2YsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osRUFBRSxFQUFFLFFBQVE7YUFDWjtTQUNELENBQUM7UUFFRixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUUzQixNQUFNLEdBQUcsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUV4QixJQUFJLFNBQVMs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LElBQUksQ0FBQyxLQUFLLEVBQzNCO1FBQ0MsSUFBSSxHQUFHLEdBQUcsZUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhGLElBQUksR0FBRyxDQUFDLE1BQU0sRUFDZDtZQUNDLFlBQVksR0FBRyxZQUFZLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztZQUU5RCxLQUFLLEdBQUcsS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQ3pDO0tBQ0Q7SUFFRCxPQUFPO1FBQ047OztXQUdHO1FBQ0gsWUFBWTtRQUNaOztXQUVHO1FBQ0gsS0FBSztLQUNMLENBQUE7QUFDRixDQUFDO0FBNUJELHNDQTRCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvMS8yNi8wMjYuXG4gKi9cblxuLy9pbXBvcnQgeyBQcm9qZWN0SWQgfSBmcm9tICdnaXRsYWIvdHlwZXMvdHlwZXMnO1xuaW1wb3J0IHsgY3VycmVudEJyYW5jaE5hbWUgfSBmcm9tICcuLi9naXQnO1xuaW1wb3J0IFByb2plY3RDb25maWcsIHsgbm92ZWxfcm9vdCB9IGZyb20gJy4uLy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IGNvbmZpZyBhcyBkb3RlbnZDb25maWcgfSBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaW1wb3J0IEdpdGxhYiwgeyBQcm9qZWN0c0J1bmRsZSB9IGZyb20gJ2dpdGxhYic7XG4vL2ltcG9ydCAqIGFzIEFQSVNlcnZpY2VzIGZyb20gJ2dpdGxhYi9kaXN0L3NlcnZpY2VzJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuXG50eXBlIFByb2plY3RJZCA9IHN0cmluZyB8IG51bWJlcjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYigpOiBCbHVlYmlyZDxJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybj5cbntcblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRjb25zb2xlLmluZm8oYOWYl+ippuW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgYnJfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKG5vdmVsX3Jvb3QpO1xuXG5cdFx0XHRpZiAoIWJyX25hbWUubWF0Y2goL15hdXRvXFwvLykpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOebruWJjeWIhuaUr+eCuiAke2JyX25hbWV9IOW/veeVpeW7uueriyBQUmApO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5pbmZvKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfWApO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgX3AgPSBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2lkOiAxMDUzOTIyNyxcblx0XHRcdFx0XHRpZDogMTA1NTM0OTQsXG5cdFx0XHRcdFx0YnI6IGAke2JyX25hbWV9YCxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vaWQ6IDEwNTM4MjQwLFxuXHRcdFx0XHRcdGlkOiAxMDU0ODU5MSxcblx0XHRcdFx0XHRicjogYG1hc3RlcmAsXG5cdFx0XHRcdH0sXG5cdFx0XHRdO1xuXG5cdFx0XHRsZXQgX2kgPSAwO1xuXHRcdFx0bGV0IF9paiA9IE1hdGguYWJzKF9pIC0gMSk7XG5cblx0XHRcdGNvbnN0IGFwaSA9IGFwaUdpdGxhYigpO1xuXG5cdFx0XHRsZXQgcHJvamVjdElkID0gZGVjb2RlUHJvamVjdElkKF9wW19pXS5pZCk7XG5cblx0XHRcdGxldCBzb3VyY2VCcmFuY2g6IHN0cmluZyA9IF9wW19pXS5icjtcblx0XHRcdGxldCB0YXJnZXRCcmFuY2g6IHN0cmluZyA9IF9wW19pal0uYnI7XG5cbi8vXHRcdFx0c291cmNlQnJhbmNoID0gZW5jb2RlUHJvamVjdElkKHNvdXJjZUJyYW5jaCk7XG5cblx0XHRcdGxldCB0YXJnZXRfcHJvamVjdF9pZDogbnVtYmVyID0gX3BbX2lqXS5pZDtcblxuXHRcdFx0bGV0IHRpdGxlOiBzdHJpbmcgPSBgYXV0byBwciAoJHticl9uYW1lfSlgO1xuXG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gYXBpLk1lcmdlUmVxdWVzdHMuY3JlYXRlKFxuXHRcdFx0XHRcdFx0cHJvamVjdElkLFxuXHRcdFx0XHRcdFx0c291cmNlQnJhbmNoLFxuXHRcdFx0XHRcdFx0dGFyZ2V0QnJhbmNoLFxuXHRcdFx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJlbW92ZV9zb3VyY2VfYnJhbmNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGxvd19jb2xsYWJvcmF0aW9uOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGxvd19tYWludGFpbmVyX3RvX3B1c2g6IHRydWUsXG5cdFx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRcdGxhYmVsczogW1xuXG5cdFx0XHRcdFx0XHRcdF0uam9pbignLCcpLFxuXHRcdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXG5cdFx0XHRcdFx0XHRcdC8vc3F1YXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50YXAoZnVuY3Rpb24gKHJldDogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgZGF0YSA9IGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0KTtcblxuXHRcdFx0XHRcdGlmICghZGF0YS5tZXJnZV9zdGF0dXMgfHwgU3RyaW5nKGRhdGEubWVyZ2Vfc3RhdHVzKSA9PSAnY2Fubm90X2JlX21lcmdlZCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihg5bu656uLIFBSIOWkseaVlyAjJHtkYXRhLmlpZH0gJHtkYXRhLnRpdGxlfWApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5yZWQuZGlyKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGDmiJDlip/lu7rnq4sgUFIgIyR7ZGF0YS5paWR9ICR7ZGF0YS50aXRsZX1gKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlcnI6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlRXJyb3IpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgX2tub3dfZXJyb3IgPSBmYWxzZTtcblxuXHRcdFx0XHRcdGlmIChlcnIuYm9keSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAoZXJyLmJvZHkubWVzc2FnZSAmJiBTdHJpbmcoZXJyLmJvZHkubWVzc2FnZSkubWF0Y2goL0Fub3RoZXIgb3BlbiBtZXJnZSByZXF1ZXN0IGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIHNvdXJjZSBicmFuY2gvKSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0X2tub3dfZXJyb3IgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5L2/55So55qE5YiG5pSv5bey57aT5bu656uL6YGOIFBS77yM54Sh6aCI5Zyo5oSP5q2k6Yyv6Kqk6KiK5oGvYCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmRpcihlcnIpO1xuXG5cdFx0XHRcdFx0aWYgKF9rbm93X2Vycm9yKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhlcnIudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmRpcihlcnIuYm9keSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGDlu7rnq4sgUFIg5aSx5pWXYCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVyci50b1N0cmluZygpKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUucmVkLmRpcihlcnIuYm9keSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGVyclxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZSA9PiBlKVxuXHRcdFx0XHQ7XG5cdFx0fSlcblx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVQdWxsUmVxdWVzdHNHaXRsYWI7XG5cbnR5cGUgSFRUUEVycm9yID0gRXJyb3JcblxuZXhwb3J0IHR5cGUgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVFcnJvciA9IEhUVFBFcnJvciAmIHtcblxuXHRzdGF0dXNDb2RlOiBudW1iZXIsXG5cdHN0YXR1c01lc3NhZ2U6IG51bWJlcixcblxuXHRib2R5OiB7XG5cdFx0bWVzc2FnZTogc3RyaW5nW10sXG5cdH0sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm5cbntcblx0aWQ6IG51bWJlcixcblx0aWlkOiBudW1iZXIsXG5cdHByb2plY3RfaWQ6IG51bWJlcixcblxuXHRzdGF0ZTogc3RyaW5nLFxuXG5cdHRpdGxlOiBzdHJpbmcsXG5cdGRlc2NyaXB0aW9uOiBzdHJpbmcsXG5cblx0Y3JlYXRlZF9hdDogc3RyaW5nLFxuXHR1cGRhdGVkX2F0OiBzdHJpbmcsXG5cblx0dGFyZ2V0X2JyYW5jaDogc3RyaW5nLFxuXHRzb3VyY2VfYnJhbmNoOiBzdHJpbmcsXG5cblx0c291cmNlX3Byb2plY3RfaWQ6IG51bWJlcixcblx0dGFyZ2V0X3Byb2plY3RfaWQ6IG51bWJlcixcblxuXHRsYWJlbHM6IHN0cmluZ1tdLFxuXG5cdHdvcmtfaW5fcHJvZ3Jlc3M6IGJvb2xlYW4sXG5cblx0bWVyZ2Vfc3RhdHVzOiBzdHJpbmcsXG5cdG1lcmdlX2Vycm9yOiBhbnksXG5cblx0c3F1YXNoOiBib29sZWFuLFxuXHRjaGFuZ2VzX2NvdW50OiBudW1iZXIsXG5cblx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoOiBib29sZWFuLFxuXG5cdHdlYl91cmw6IHN0cmluZyxcblxuXHRkaWZmX3JlZnM6IHtcblx0XHRiYXNlX3NoYTogc3RyaW5nLFxuXHRcdGhlYWRfc2hhOiBzdHJpbmcsXG5cdFx0c3RhcnRfc2hhOiBzdHJpbmcsXG5cdH0sXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0OiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybilcbntcblx0bGV0IHtcblx0XHRpZCxcblx0XHRpaWQsXG5cdFx0cHJvamVjdF9pZCxcblxuXHRcdHRpdGxlLFxuXHRcdGRlc2NyaXB0aW9uLFxuXG5cdFx0c3RhdGUsXG5cblx0XHRjcmVhdGVkX2F0LFxuXHRcdHVwZGF0ZWRfYXQsXG5cblx0XHR0YXJnZXRfYnJhbmNoLFxuXHRcdHNvdXJjZV9icmFuY2gsXG5cblx0XHR0YXJnZXRfcHJvamVjdF9pZCxcblx0XHRzb3VyY2VfcHJvamVjdF9pZCxcblxuXHRcdGxhYmVscyxcblx0XHR3b3JrX2luX3Byb2dyZXNzLFxuXG5cdFx0bWVyZ2Vfc3RhdHVzLFxuXHRcdG1lcmdlX2Vycm9yLFxuXG5cdFx0c3F1YXNoLFxuXHRcdGNoYW5nZXNfY291bnQsXG5cblx0XHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2gsXG5cblx0XHR3ZWJfdXJsLFxuXG5cdFx0ZGlmZl9yZWZzLFxuXG5cdH0gPSByZXQ7XG5cblx0Lypcblx0Y29uc29sZS5kaXIocmV0LCB7XG5cdFx0ZGVwdGg6IDUsXG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9KTtcblx0Ki9cblxuXHRyZXR1cm4ge1xuXHRcdGlkLFxuXHRcdGlpZCxcblx0XHRwcm9qZWN0X2lkLFxuXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRzdGF0ZSxcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXHRcdHNvdXJjZV9wcm9qZWN0X2lkLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzcXVhc2gsXG5cdFx0Y2hhbmdlc19jb3VudCxcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwaUdpdGxhYigpXG57XG5cdGNvbnNvbGUuaW5mbyhg6YCj5o6lIGFwaWApO1xuXG5cdGxldCBfZW52ID0gX2dldEVudkdpdGxhYigpO1xuXG5cdHRyeVxuXHR7XG5cdFx0Lypcblx0XHRjb25zdCBhcGkgPSBuZXcgUHJvamVjdHNCdW5kbGUoe1xuXHRcdFx0dG9rZW46IF9lbnYuQUNDRVNTX1RPS0VOLFxuXHRcdH0pO1xuXHRcdCovXG5cdFx0Y29uc3QgYXBpID0gbmV3IEdpdGxhYih7XG5cdFx0XHR0b2tlbjogX2Vudi5BQ0NFU1NfVE9LRU4sXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gYXBpO1xuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihg6YCj5o6lIGFwaSDlpLHmlZdgKTtcblx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBiZWNhdXNlIGdpdGxhYiB3aWxsIGF1dG8gZG8gYGNvbnN0IHBJZCA9IGVuY29kZVVSSUNvbXBvbmVudChwcm9qZWN0SWQpO2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0ZXhwZWN0KGFycikuaGF2ZS5sZW5ndGhPZigyKTtcblxuXHRcdHJldHVybiBhcnIuam9pbignLycpO1xuXHR9XG5cblx0ZXhwZWN0KHByb2plY3RJZCkuYSgnbnVtYmVyJyk7XG5cblx0cmV0dXJuIHByb2plY3RJZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IG51bWJlcik6IG51bWJlclxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IHN0cmluZyk6IHN0cmluZ1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0cmV0dXJuIGFyci5qb2luKCclMkYnKTtcblx0fVxuXG5cdGV4cGVjdChwcm9qZWN0SWQpLmEoJ251bWJlcicpO1xuXG5cdHJldHVybiBwcm9qZWN0SWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0RW52R2l0bGFiKClcbntcblx0bGV0IEFDQ0VTU19UT0tFTjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuR0lUTEFCX0FDQ0VTU19UT0tFTiB8fCAnJztcblx0bGV0IFRPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfVE9LRU4gfHwgJyc7XG5cblx0aWYgKCFBQ0NFU1NfVE9LRU4gfHwgIVRPS0VOKVxuXHR7XG5cdFx0bGV0IGVudiA9IGRvdGVudkNvbmZpZyh7IHBhdGg6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJy5lbnYnKSB9KTtcblxuXHRcdGlmIChlbnYucGFyc2VkKVxuXHRcdHtcblx0XHRcdEFDQ0VTU19UT0tFTiA9IEFDQ0VTU19UT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9BQ0NFU1NfVE9LRU47XG5cblx0XHRcdFRPS0VOID0gVE9LRU4gfHwgZW52LnBhcnNlZC5HSVRMQUJfVE9LRU47XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBmb3IgYXBpLiBDYW4gYmUgY3JlYXRlZCBpbiB5b3VyIHByb2ZpbGUuXG5cdFx0ICogaHR0cHM6Ly9naXRsYWIuY29tL3Byb2ZpbGUvcGVyc29uYWxfYWNjZXNzX3Rva2Vuc1xuXHRcdCAqL1xuXHRcdEFDQ0VTU19UT0tFTixcblx0XHQvKipcblx0XHQgKiB1c2VybmFtZTpwYXNzd29yZEBcblx0XHQgKi9cblx0XHRUT0tFTixcblx0fVxufVxuIl19