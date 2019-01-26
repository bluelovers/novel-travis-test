"use strict";
/**
 * Created by user on 2019/1/26/026.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const git_1 = require("../git");
const project_config_1 = require("../../project.config");
const dotenv_1 = require("dotenv");
const path = require("upath2");
const log_1 = require("../../lib/log");
const Bluebird = require("bluebird");
const gitlab_1 = require("gitlab");
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
        const api = apiGitlab();
        let projectId = decodeProjectId('novel-group/txt-source');
        let sourceBranch = `demonovel/txt-source:${br_name}`;
        let targetBranch = 'master';
        let title = `auto pr (${br_name})`;
        // @ts-ignore
        return Bluebird.resolve()
            .then(function () {
            return api.MergeRequests.create(projectId, sourceBranch, targetBranch, title, {
                remove_source_branch: true,
                allow_collaboration: true,
                allow_maintainer_to_push: true,
            });
        })
            .tap(function (ret) {
            let data = filterGitlabMergeRequestsCreateReturn(ret);
            log_1.default.success(`成功建立 PR #${data.id} ${data.title}`);
            log_1.default.dir(data);
        })
            .catch(function (err) {
            log_1.default.error(`建立 PR 失敗`);
            log_1.default.error(err.toString());
            log_1.default.error(err.code, err.status, err.body);
            return err;
        });
    });
}
exports.createPullRequestsGitlab = createPullRequestsGitlab;
exports.default = createPullRequestsGitlab;
function filterGitlabMergeRequestsCreateReturn(ret) {
    let { id, title, description, created_at, updated_at, target_branch, source_branch, labels, work_in_progress, merge_status, merge_error, should_remove_source_branch, web_url, diff_refs, } = ret;
    return {
        id,
        title,
        description,
        created_at,
        updated_at,
        target_branch,
        source_branch,
        labels,
        work_in_progress,
        merge_status,
        merge_error,
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
        const api = new gitlab_1.ProjectsBundle({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELE1BQU0sR0FBRyxHQUFHLFNBQVMsRUFBRSxDQUFDO1FBRXhCLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRTFELElBQUksWUFBWSxHQUFXLHdCQUF3QixPQUFPLEVBQUUsQ0FBQztRQUM3RCxJQUFJLFlBQVksR0FBVyxRQUFRLENBQUM7UUFFcEMsSUFBSSxLQUFLLEdBQVcsWUFBWSxPQUFPLEdBQUcsQ0FBQztRQUUzQyxhQUFhO1FBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3ZCLElBQUksQ0FBQztZQUVMLE9BQVEsR0FBRyxDQUFDLGFBQTJDLENBQUMsTUFBTSxDQUM3RCxTQUFTLEVBQ1QsWUFBWSxFQUNaLFlBQVksRUFDWixLQUFLLEVBQ0w7Z0JB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O0FBRUQsU0FBZ0IsYUFBYTtJQUU1QixJQUFJLFlBQVksR0FBVyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUUsQ0FBQztJQUNqRSxJQUFJLEtBQUssR0FBVyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7SUFFbkQsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLEtBQUssRUFDM0I7UUFDQyxJQUFJLEdBQUcsR0FBRyxlQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFaEYsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUNkO1lBQ0MsWUFBWSxHQUFHLFlBQVksSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO1lBRTlELEtBQUssR0FBRyxLQUFLLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7U0FDekM7S0FDRDtJQUVELE9BQU87UUFDTjs7O1dBR0c7UUFDSCxZQUFZO1FBQ1o7O1dBRUc7UUFDSCxLQUFLO0tBQ0wsQ0FBQTtBQUNGLENBQUM7QUE1QkQsc0NBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS8xLzI2LzAyNi5cbiAqL1xuXG5pbXBvcnQgeyBQcm9qZWN0SWQgfSBmcm9tICdnaXRsYWIvdHlwZXMvdHlwZXMnO1xuaW1wb3J0IHsgY3VycmVudEJyYW5jaE5hbWUgfSBmcm9tICcuLi9naXQnO1xuaW1wb3J0IFByb2plY3RDb25maWcsIHsgbm92ZWxfcm9vdCB9IGZyb20gJy4uLy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IGNvbmZpZyBhcyBkb3RlbnZDb25maWcgfSBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaW1wb3J0IHsgR2l0bGFiLCBQcm9qZWN0c0J1bmRsZSB9IGZyb20gJ2dpdGxhYic7XG5pbXBvcnQgKiBhcyBBUElTZXJ2aWNlcyBmcm9tICdnaXRsYWIvZGlzdC9zZXJ2aWNlcyc7XG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYigpOiBCbHVlYmlyZDxJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybj5cbntcblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRjb25zb2xlLmluZm8oYOWYl+ippuW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgYnJfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKG5vdmVsX3Jvb3QpO1xuXG5cdFx0XHRpZiAoIWJyX25hbWUubWF0Y2goL15hdXRvXFwvLykpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOebruWJjeWIhuaUr+eCuiAke2JyX25hbWV9IOW/veeVpeW7uueriyBQUmApO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5pbmZvKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfWApO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBhcGkgPSBhcGlHaXRsYWIoKTtcblxuXHRcdFx0bGV0IHByb2plY3RJZCA9IGRlY29kZVByb2plY3RJZCgnbm92ZWwtZ3JvdXAvdHh0LXNvdXJjZScpO1xuXG5cdFx0XHRsZXQgc291cmNlQnJhbmNoOiBzdHJpbmcgPSBgZGVtb25vdmVsL3R4dC1zb3VyY2U6JHticl9uYW1lfWA7XG5cdFx0XHRsZXQgdGFyZ2V0QnJhbmNoOiBzdHJpbmcgPSAnbWFzdGVyJztcblxuXHRcdFx0bGV0IHRpdGxlOiBzdHJpbmcgPSBgYXV0byBwciAoJHticl9uYW1lfSlgO1xuXG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gKGFwaS5NZXJnZVJlcXVlc3RzIGFzIEFQSVNlcnZpY2VzLk1lcmdlUmVxdWVzdHMpLmNyZWF0ZShcblx0XHRcdFx0XHRcdHByb2plY3RJZCxcblx0XHRcdFx0XHRcdHNvdXJjZUJyYW5jaCxcblx0XHRcdFx0XHRcdHRhcmdldEJyYW5jaCxcblx0XHRcdFx0XHRcdHRpdGxlLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVfc291cmNlX2JyYW5jaDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfY29sbGFib3JhdGlvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfbWFpbnRhaW5lcl90b19wdXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRsYWJlbHM6IFtcblxuXHRcdFx0XHRcdFx0XHRdLmpvaW4oJywnKSxcblx0XHRcdFx0XHRcdFx0Ki9cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGFwKGZ1bmN0aW9uIChyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGRhdGEgPSBmaWx0ZXJHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKHJldCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueriyBQUiAjJHtkYXRhLmlkfSAke2RhdGEudGl0bGV9YCk7XG5cdFx0XHRcdFx0Y29uc29sZS5kaXIoZGF0YSk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihg5bu656uLIFBSIOWkseaVl2ApO1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyLmNvZGUsIGVyci5zdGF0dXMsIGVyci5ib2R5KTtcblxuXHRcdFx0XHRcdHJldHVybiBlcnIgYXMgYW55XG5cdFx0XHRcdH0pXG5cdFx0XHRcdDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYjtcblxuZXhwb3J0IGludGVyZmFjZSBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVyblxue1xuXHRpZDogbnVtYmVyLFxuXHR0aXRsZTogc3RyaW5nLFxuXHRkZXNjcmlwdGlvbjogc3RyaW5nLFxuXG5cdGNyZWF0ZWRfYXQ6IHN0cmluZyxcblx0dXBkYXRlZF9hdDogc3RyaW5nLFxuXG5cdHRhcmdldF9icmFuY2g6IHN0cmluZyxcblx0c291cmNlX2JyYW5jaDogc3RyaW5nLFxuXG5cdGxhYmVsczogc3RyaW5nW10sXG5cblx0d29ya19pbl9wcm9ncmVzczogYm9vbGVhbixcblxuXHRtZXJnZV9zdGF0dXM6IHN0cmluZyxcblx0bWVyZ2VfZXJyb3I6IGFueSxcblxuXHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2g6IGJvb2xlYW4sXG5cblx0d2ViX3VybDogc3RyaW5nLFxuXG5cdGRpZmZfcmVmczoge1xuXHRcdGJhc2Vfc2hhOiBzdHJpbmcsXG5cdFx0aGVhZF9zaGE6IHN0cmluZyxcblx0XHRzdGFydF9zaGE6IHN0cmluZyxcblx0fSxcblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybihyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxue1xuXHRsZXQge1xuXHRcdGlkLFxuXHRcdHRpdGxlLFxuXHRcdGRlc2NyaXB0aW9uLFxuXG5cdFx0Y3JlYXRlZF9hdCxcblx0XHR1cGRhdGVkX2F0LFxuXG5cdFx0dGFyZ2V0X2JyYW5jaCxcblx0XHRzb3VyY2VfYnJhbmNoLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2gsXG5cblx0XHR3ZWJfdXJsLFxuXG5cdFx0ZGlmZl9yZWZzLFxuXG5cdH0gPSByZXQ7XG5cblx0cmV0dXJuIHtcblx0XHRpZCxcblx0XHR0aXRsZSxcblx0XHRkZXNjcmlwdGlvbixcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdGxhYmVscyxcblx0XHR3b3JrX2luX3Byb2dyZXNzLFxuXG5cdFx0bWVyZ2Vfc3RhdHVzLFxuXHRcdG1lcmdlX2Vycm9yLFxuXG5cdFx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoLFxuXG5cdFx0d2ViX3VybCxcblxuXHRcdGRpZmZfcmVmcyxcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBpR2l0bGFiKClcbntcblx0Y29uc29sZS5pbmZvKGDpgKPmjqUgYXBpYCk7XG5cblx0bGV0IF9lbnYgPSBfZ2V0RW52R2l0bGFiKCk7XG5cblx0dHJ5XG5cdHtcblx0XHRjb25zdCBhcGkgPSBuZXcgUHJvamVjdHNCdW5kbGUoe1xuXHRcdFx0dG9rZW46IF9lbnYuQUNDRVNTX1RPS0VOLFxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGFwaTtcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYOmAo+aOpSBhcGkg5aSx5pWXYCk7XG5cdFx0Y29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuXHR9XG59XG5cbi8qKlxuICogYmVjYXVzZSBnaXRsYWIgd2lsbCBhdXRvIGRvIGBjb25zdCBwSWQgPSBlbmNvZGVVUklDb21wb25lbnQocHJvamVjdElkKTtgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVQcm9qZWN0SWQocHJvamVjdElkOiBQcm9qZWN0SWQpOiBQcm9qZWN0SWRcbntcblx0aWYgKHR5cGVvZiBwcm9qZWN0SWQgPT09ICdzdHJpbmcnKVxuXHR7XG5cdFx0aWYgKC9eXFxkKyQvLnRlc3QocHJvamVjdElkKSlcblx0XHR7XG5cdFx0XHRyZXR1cm4gcHJvamVjdElkO1xuXHRcdH1cblxuXHRcdGxldCBhcnIgPSBwcm9qZWN0SWQuc3BsaXQoLyUyRnxcXC8vKTtcblxuXHRcdGV4cGVjdChhcnIpLmhhdmUubGVuZ3RoT2YoMik7XG5cblx0XHRyZXR1cm4gYXJyLmpvaW4oJy8nKTtcblx0fVxuXG5cdGV4cGVjdChwcm9qZWN0SWQpLmEoJ251bWJlcicpO1xuXG5cdHJldHVybiBwcm9qZWN0SWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0RW52R2l0bGFiKClcbntcblx0bGV0IEFDQ0VTU19UT0tFTjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuR0lUTEFCX0FDQ0VTU19UT0tFTiB8fCAnJztcblx0bGV0IFRPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfVE9LRU4gfHwgJyc7XG5cblx0aWYgKCFBQ0NFU1NfVE9LRU4gfHwgIVRPS0VOKVxuXHR7XG5cdFx0bGV0IGVudiA9IGRvdGVudkNvbmZpZyh7IHBhdGg6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJy5lbnYnKSB9KTtcblxuXHRcdGlmIChlbnYucGFyc2VkKVxuXHRcdHtcblx0XHRcdEFDQ0VTU19UT0tFTiA9IEFDQ0VTU19UT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9BQ0NFU1NfVE9LRU47XG5cblx0XHRcdFRPS0VOID0gVE9LRU4gfHwgZW52LnBhcnNlZC5HSVRMQUJfVE9LRU47XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBmb3IgYXBpLiBDYW4gYmUgY3JlYXRlZCBpbiB5b3VyIHByb2ZpbGUuXG5cdFx0ICogaHR0cHM6Ly9naXRsYWIuY29tL3Byb2ZpbGUvcGVyc29uYWxfYWNjZXNzX3Rva2Vuc1xuXHRcdCAqL1xuXHRcdEFDQ0VTU19UT0tFTixcblx0XHQvKipcblx0XHQgKiB1c2VybmFtZTpwYXNzd29yZEBcblx0XHQgKi9cblx0XHRUT0tFTixcblx0fVxufVxuIl19