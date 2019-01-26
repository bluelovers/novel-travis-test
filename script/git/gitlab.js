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
            let _know_error = false;
            if (err.body) {
                if (err.body.message && String(err.body.message).match(/Another open merge request already exists for this source branch/)) {
                    _know_error = true;
                    log_1.default.info(`本次使用的分支已經建立過 PR，無須在意此錯誤訊息`);
                }
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELE1BQU0sR0FBRyxHQUFHLFNBQVMsRUFBRSxDQUFDO1FBRXhCLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRTFELElBQUksWUFBWSxHQUFXLHdCQUF3QixPQUFPLEVBQUUsQ0FBQztRQUM3RCxJQUFJLFlBQVksR0FBVyxRQUFRLENBQUM7UUFFcEMsSUFBSSxLQUFLLEdBQVcsWUFBWSxPQUFPLEdBQUcsQ0FBQztRQUUzQyxhQUFhO1FBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3ZCLElBQUksQ0FBQztZQUVMLE9BQVEsR0FBRyxDQUFDLGFBQTJDLENBQUMsTUFBTSxDQUM3RCxTQUFTLEVBQ1QsWUFBWSxFQUNaLFlBQVksRUFDWixLQUFLLEVBQ0w7Z0JB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O1FBQ1o7O1dBRUc7UUFDSCxLQUFLO0tBQ0wsQ0FBQTtBQUNGLENBQUM7QUE1QkQsc0NBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS8xLzI2LzAyNi5cbiAqL1xuXG5pbXBvcnQgeyBQcm9qZWN0SWQgfSBmcm9tICdnaXRsYWIvdHlwZXMvdHlwZXMnO1xuaW1wb3J0IHsgY3VycmVudEJyYW5jaE5hbWUgfSBmcm9tICcuLi9naXQnO1xuaW1wb3J0IFByb2plY3RDb25maWcsIHsgbm92ZWxfcm9vdCB9IGZyb20gJy4uLy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IGNvbmZpZyBhcyBkb3RlbnZDb25maWcgfSBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaW1wb3J0IHsgR2l0bGFiLCBQcm9qZWN0c0J1bmRsZSB9IGZyb20gJ2dpdGxhYic7XG5pbXBvcnQgKiBhcyBBUElTZXJ2aWNlcyBmcm9tICdnaXRsYWIvZGlzdC9zZXJ2aWNlcyc7XG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYigpOiBCbHVlYmlyZDxJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybj5cbntcblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRjb25zb2xlLmluZm8oYOWYl+ippuW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgYnJfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKG5vdmVsX3Jvb3QpO1xuXG5cdFx0XHRpZiAoIWJyX25hbWUubWF0Y2goL15hdXRvXFwvLykpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOebruWJjeWIhuaUr+eCuiAke2JyX25hbWV9IOW/veeVpeW7uueriyBQUmApO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5pbmZvKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfWApO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBhcGkgPSBhcGlHaXRsYWIoKTtcblxuXHRcdFx0bGV0IHByb2plY3RJZCA9IGRlY29kZVByb2plY3RJZCgnbm92ZWwtZ3JvdXAvdHh0LXNvdXJjZScpO1xuXG5cdFx0XHRsZXQgc291cmNlQnJhbmNoOiBzdHJpbmcgPSBgZGVtb25vdmVsL3R4dC1zb3VyY2U6JHticl9uYW1lfWA7XG5cdFx0XHRsZXQgdGFyZ2V0QnJhbmNoOiBzdHJpbmcgPSAnbWFzdGVyJztcblxuXHRcdFx0bGV0IHRpdGxlOiBzdHJpbmcgPSBgYXV0byBwciAoJHticl9uYW1lfSlgO1xuXG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gKGFwaS5NZXJnZVJlcXVlc3RzIGFzIEFQSVNlcnZpY2VzLk1lcmdlUmVxdWVzdHMpLmNyZWF0ZShcblx0XHRcdFx0XHRcdHByb2plY3RJZCxcblx0XHRcdFx0XHRcdHNvdXJjZUJyYW5jaCxcblx0XHRcdFx0XHRcdHRhcmdldEJyYW5jaCxcblx0XHRcdFx0XHRcdHRpdGxlLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVfc291cmNlX2JyYW5jaDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfY29sbGFib3JhdGlvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfbWFpbnRhaW5lcl90b19wdXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRsYWJlbHM6IFtcblxuXHRcdFx0XHRcdFx0XHRdLmpvaW4oJywnKSxcblx0XHRcdFx0XHRcdFx0Ki9cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGFwKGZ1bmN0aW9uIChyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGRhdGEgPSBmaWx0ZXJHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKHJldCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueriyBQUiAjJHtkYXRhLmlkfSAke2RhdGEudGl0bGV9YCk7XG5cdFx0XHRcdFx0Y29uc29sZS5kaXIoZGF0YSk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyOiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZUVycm9yKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IF9rbm93X2Vycm9yID0gZmFsc2U7XG5cblx0XHRcdFx0XHRpZiAoZXJyLmJvZHkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKGVyci5ib2R5Lm1lc3NhZ2UgJiYgU3RyaW5nKGVyci5ib2R5Lm1lc3NhZ2UpLm1hdGNoKC9Bbm90aGVyIG9wZW4gbWVyZ2UgcmVxdWVzdCBhbHJlYWR5IGV4aXN0cyBmb3IgdGhpcyBzb3VyY2UgYnJhbmNoLykpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdF9rbm93X2Vycm9yID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmluZm8oYOacrOasoeS9v+eUqOeahOWIhuaUr+W3sue2k+W7uueri+mBjiBQUu+8jOeEoemgiOWcqOaEj+atpOmMr+iqpOioiuaBr2ApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChfa25vd19lcnJvcilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmluZm8oZXJyLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoZXJyLmJvZHkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihg5bu656uLIFBSIOWkseaVl2ApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnJlZC5kaXIoZXJyLmJvZHkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBlcnJcblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKGUgPT4gZSlcblx0XHRcdFx0O1xuXHRcdH0pXG5cdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUHVsbFJlcXVlc3RzR2l0bGFiO1xuXG50eXBlIEhUVFBFcnJvciA9IEVycm9yXG5cbmV4cG9ydCB0eXBlIElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlRXJyb3IgPSBIVFRQRXJyb3IgJiB7XG5cdGJvZHk6IHtcblx0XHRtZXNzYWdlOiBzdHJpbmcsXG5cdH0sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm5cbntcblx0aWQ6IG51bWJlcixcblx0dGl0bGU6IHN0cmluZyxcblx0ZGVzY3JpcHRpb246IHN0cmluZyxcblxuXHRjcmVhdGVkX2F0OiBzdHJpbmcsXG5cdHVwZGF0ZWRfYXQ6IHN0cmluZyxcblxuXHR0YXJnZXRfYnJhbmNoOiBzdHJpbmcsXG5cdHNvdXJjZV9icmFuY2g6IHN0cmluZyxcblxuXHRsYWJlbHM6IHN0cmluZ1tdLFxuXG5cdHdvcmtfaW5fcHJvZ3Jlc3M6IGJvb2xlYW4sXG5cblx0bWVyZ2Vfc3RhdHVzOiBzdHJpbmcsXG5cdG1lcmdlX2Vycm9yOiBhbnksXG5cblx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoOiBib29sZWFuLFxuXG5cdHdlYl91cmw6IHN0cmluZyxcblxuXHRkaWZmX3JlZnM6IHtcblx0XHRiYXNlX3NoYTogc3RyaW5nLFxuXHRcdGhlYWRfc2hhOiBzdHJpbmcsXG5cdFx0c3RhcnRfc2hhOiBzdHJpbmcsXG5cdH0sXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0OiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybilcbntcblx0bGV0IHtcblx0XHRpZCxcblx0XHR0aXRsZSxcblx0XHRkZXNjcmlwdGlvbixcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdGxhYmVscyxcblx0XHR3b3JrX2luX3Byb2dyZXNzLFxuXG5cdFx0bWVyZ2Vfc3RhdHVzLFxuXHRcdG1lcmdlX2Vycm9yLFxuXG5cdFx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoLFxuXG5cdFx0d2ViX3VybCxcblxuXHRcdGRpZmZfcmVmcyxcblxuXHR9ID0gcmV0O1xuXG5cdHJldHVybiB7XG5cdFx0aWQsXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRjcmVhdGVkX2F0LFxuXHRcdHVwZGF0ZWRfYXQsXG5cblx0XHR0YXJnZXRfYnJhbmNoLFxuXHRcdHNvdXJjZV9icmFuY2gsXG5cblx0XHRsYWJlbHMsXG5cdFx0d29ya19pbl9wcm9ncmVzcyxcblxuXHRcdG1lcmdlX3N0YXR1cyxcblx0XHRtZXJnZV9lcnJvcixcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwaUdpdGxhYigpXG57XG5cdGNvbnNvbGUuaW5mbyhg6YCj5o6lIGFwaWApO1xuXG5cdGxldCBfZW52ID0gX2dldEVudkdpdGxhYigpO1xuXG5cdHRyeVxuXHR7XG5cdFx0Y29uc3QgYXBpID0gbmV3IFByb2plY3RzQnVuZGxlKHtcblx0XHRcdHRva2VuOiBfZW52LkFDQ0VTU19UT0tFTixcblx0XHR9KTtcblxuXHRcdHJldHVybiBhcGk7XG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDpgKPmjqUgYXBpIOWkseaVl2ApO1xuXHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblx0fVxufVxuXG4vKipcbiAqIGJlY2F1c2UgZ2l0bGFiIHdpbGwgYXV0byBkbyBgY29uc3QgcElkID0gZW5jb2RlVVJJQ29tcG9uZW50KHByb2plY3RJZCk7YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG57XG5cdGlmICh0eXBlb2YgcHJvamVjdElkID09PSAnc3RyaW5nJylcblx0e1xuXHRcdGlmICgvXlxcZCskLy50ZXN0KHByb2plY3RJZCkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIHByb2plY3RJZDtcblx0XHR9XG5cblx0XHRsZXQgYXJyID0gcHJvamVjdElkLnNwbGl0KC8lMkZ8XFwvLyk7XG5cblx0XHRleHBlY3QoYXJyKS5oYXZlLmxlbmd0aE9mKDIpO1xuXG5cdFx0cmV0dXJuIGFyci5qb2luKCcvJyk7XG5cdH1cblxuXHRleHBlY3QocHJvamVjdElkKS5hKCdudW1iZXInKTtcblxuXHRyZXR1cm4gcHJvamVjdElkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2dldEVudkdpdGxhYigpXG57XG5cdGxldCBBQ0NFU1NfVE9LRU46IHN0cmluZyA9IHByb2Nlc3MuZW52LkdJVExBQl9BQ0NFU1NfVE9LRU4gfHwgJyc7XG5cdGxldCBUT0tFTjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuR0lUTEFCX1RPS0VOIHx8ICcnO1xuXG5cdGlmICghQUNDRVNTX1RPS0VOIHx8ICFUT0tFTilcblx0e1xuXHRcdGxldCBlbnYgPSBkb3RlbnZDb25maWcoeyBwYXRoOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5wcm9qZWN0X3Jvb3QsICcuZW52JykgfSk7XG5cblx0XHRpZiAoZW52LnBhcnNlZClcblx0XHR7XG5cdFx0XHRBQ0NFU1NfVE9LRU4gPSBBQ0NFU1NfVE9LRU4gfHwgZW52LnBhcnNlZC5HSVRMQUJfQUNDRVNTX1RPS0VOO1xuXG5cdFx0XHRUT0tFTiA9IFRPS0VOIHx8IGVudi5wYXJzZWQuR0lUTEFCX1RPS0VOO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB7XG5cdFx0LyoqXG5cdFx0ICogZm9yIGFwaS4gQ2FuIGJlIGNyZWF0ZWQgaW4geW91ciBwcm9maWxlLlxuXHRcdCAqIGh0dHBzOi8vZ2l0bGFiLmNvbS9wcm9maWxlL3BlcnNvbmFsX2FjY2Vzc190b2tlbnNcblx0XHQgKi9cblx0XHRBQ0NFU1NfVE9LRU4sXG5cdFx0LyoqXG5cdFx0ICogdXNlcm5hbWU6cGFzc3dvcmRAXG5cdFx0ICovXG5cdFx0VE9LRU4sXG5cdH1cbn1cbiJdfQ==