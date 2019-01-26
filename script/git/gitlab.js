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
            log_1.default.red.dir(err.body);
            let _know_error = false;
            if (err.body) {
                if (err.body.message.match(/Another open merge request already exists for this source branch/)) {
                    _know_error = true;
                }
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELE1BQU0sR0FBRyxHQUFHLFNBQVMsRUFBRSxDQUFDO1FBRXhCLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRTFELElBQUksWUFBWSxHQUFXLHdCQUF3QixPQUFPLEVBQUUsQ0FBQztRQUM3RCxJQUFJLFlBQVksR0FBVyxRQUFRLENBQUM7UUFFcEMsSUFBSSxLQUFLLEdBQVcsWUFBWSxPQUFPLEdBQUcsQ0FBQztRQUUzQyxhQUFhO1FBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3ZCLElBQUksQ0FBQztZQUVMLE9BQVEsR0FBRyxDQUFDLGFBQTJDLENBQUMsTUFBTSxDQUM3RCxTQUFTLEVBQ1QsWUFBWSxFQUNaLFlBQVksRUFDWixLQUFLLEVBQ0w7Z0JB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QUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3JCO0lBRUQsYUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5QixPQUFPLFNBQVMsQ0FBQztBQUNsQixDQUFDO0FBbkJELDBDQW1CQztBQUVELFNBQWdCLGFBQWE7SUFFNUIsSUFBSSxZQUFZLEdBQVcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxFQUFFLENBQUM7SUFDakUsSUFBSSxLQUFLLEdBQVcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDO0lBRW5ELElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxLQUFLLEVBQzNCO1FBQ0MsSUFBSSxHQUFHLEdBQUcsZUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhGLElBQUksR0FBRyxDQUFDLE1BQU0sRUFDZDtZQUNDLFlBQVksR0FBRyxZQUFZLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztZQUU5RCxLQUFLLEdBQUcsS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQ3pDO0tBQ0Q7SUFFRCxPQUFPO1FBQ047OztXQUdHO1FBQ0gsWUFBWTtRQUNaOztXQUVHO1FBQ0gsS0FBSztLQUNMLENBQUE7QUFDRixDQUFDO0FBNUJELHNDQTRCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvMS8yNi8wMjYuXG4gKi9cblxuaW1wb3J0IHsgUHJvamVjdElkIH0gZnJvbSAnZ2l0bGFiL3R5cGVzL3R5cGVzJztcbmltcG9ydCB7IGN1cnJlbnRCcmFuY2hOYW1lIH0gZnJvbSAnLi4vZ2l0JztcbmltcG9ydCBQcm9qZWN0Q29uZmlnLCB7IG5vdmVsX3Jvb3QgfSBmcm9tICcuLi8uLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmltcG9ydCB7IEdpdGxhYiwgUHJvamVjdHNCdW5kbGUgfSBmcm9tICdnaXRsYWInO1xuaW1wb3J0ICogYXMgQVBJU2VydmljZXMgZnJvbSAnZ2l0bGFiL2Rpc3Qvc2VydmljZXMnO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQdWxsUmVxdWVzdHNHaXRsYWIoKTogQmx1ZWJpcmQ8SUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4+XG57XG5cdC8vIEB0cy1pZ25vcmVcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGDlmJfoqablu7rnq4sgUFJgKTtcblxuXHRcdFx0bGV0IGJyX25hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShub3ZlbF9yb290KTtcblxuXHRcdFx0aWYgKCFicl9uYW1lLm1hdGNoKC9eYXV0b1xcLy8pKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfSDlv73nlaXlu7rnq4sgUFJgKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg55uu5YmN5YiG5pSv54K6ICR7YnJfbmFtZX1gKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYXBpID0gYXBpR2l0bGFiKCk7XG5cblx0XHRcdGxldCBwcm9qZWN0SWQgPSBkZWNvZGVQcm9qZWN0SWQoJ25vdmVsLWdyb3VwL3R4dC1zb3VyY2UnKTtcblxuXHRcdFx0bGV0IHNvdXJjZUJyYW5jaDogc3RyaW5nID0gYGRlbW9ub3ZlbC90eHQtc291cmNlOiR7YnJfbmFtZX1gO1xuXHRcdFx0bGV0IHRhcmdldEJyYW5jaDogc3RyaW5nID0gJ21hc3Rlcic7XG5cblx0XHRcdGxldCB0aXRsZTogc3RyaW5nID0gYGF1dG8gcHIgKCR7YnJfbmFtZX0pYDtcblxuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIChhcGkuTWVyZ2VSZXF1ZXN0cyBhcyBBUElTZXJ2aWNlcy5NZXJnZVJlcXVlc3RzKS5jcmVhdGUoXG5cdFx0XHRcdFx0XHRwcm9qZWN0SWQsXG5cdFx0XHRcdFx0XHRzb3VyY2VCcmFuY2gsXG5cdFx0XHRcdFx0XHR0YXJnZXRCcmFuY2gsXG5cdFx0XHRcdFx0XHR0aXRsZSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmVtb3ZlX3NvdXJjZV9icmFuY2g6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGFsbG93X2NvbGxhYm9yYXRpb246IHRydWUsXG5cdFx0XHRcdFx0XHRcdGFsbG93X21haW50YWluZXJfdG9fcHVzaDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0Lypcblx0XHRcdFx0XHRcdFx0bGFiZWxzOiBbXG5cblx0XHRcdFx0XHRcdFx0XS5qb2luKCcsJyksXG5cdFx0XHRcdFx0XHRcdCovXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fSlcblx0XHRcdFx0LnRhcChmdW5jdGlvbiAocmV0OiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBkYXRhID0gZmlsdGVyR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybihyZXQpO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGDmiJDlip/lu7rnq4sgUFIgIyR7ZGF0YS5pZH0gJHtkYXRhLnRpdGxlfWApO1xuXHRcdFx0XHRcdGNvbnNvbGUuZGlyKGRhdGEpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGVycjogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVFcnJvcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOW7uueriyBQUiDlpLHmlZdgKTtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVyci50b1N0cmluZygpKTtcblx0XHRcdFx0XHRjb25zb2xlLnJlZC5kaXIoZXJyLmJvZHkpO1xuXG5cdFx0XHRcdFx0bGV0IF9rbm93X2Vycm9yID0gZmFsc2U7XG5cblx0XHRcdFx0XHRpZiAoZXJyLmJvZHkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKGVyci5ib2R5Lm1lc3NhZ2UubWF0Y2goL0Fub3RoZXIgb3BlbiBtZXJnZSByZXF1ZXN0IGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIHNvdXJjZSBicmFuY2gvKSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0X2tub3dfZXJyb3IgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBlcnIgYXMgYW55XG5cdFx0XHRcdH0pXG5cdFx0XHRcdDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYjtcblxudHlwZSBIVFRQRXJyb3IgPSBFcnJvclxuXG5leHBvcnQgdHlwZSBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZUVycm9yID0gSFRUUEVycm9yICYge1xuXHRib2R5OiB7XG5cdFx0bWVzc2FnZTogc3RyaW5nLFxuXHR9LFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuXG57XG5cdGlkOiBudW1iZXIsXG5cdHRpdGxlOiBzdHJpbmcsXG5cdGRlc2NyaXB0aW9uOiBzdHJpbmcsXG5cblx0Y3JlYXRlZF9hdDogc3RyaW5nLFxuXHR1cGRhdGVkX2F0OiBzdHJpbmcsXG5cblx0dGFyZ2V0X2JyYW5jaDogc3RyaW5nLFxuXHRzb3VyY2VfYnJhbmNoOiBzdHJpbmcsXG5cblx0bGFiZWxzOiBzdHJpbmdbXSxcblxuXHR3b3JrX2luX3Byb2dyZXNzOiBib29sZWFuLFxuXG5cdG1lcmdlX3N0YXR1czogc3RyaW5nLFxuXHRtZXJnZV9lcnJvcjogYW55LFxuXG5cdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaDogYm9vbGVhbixcblxuXHR3ZWJfdXJsOiBzdHJpbmcsXG5cblx0ZGlmZl9yZWZzOiB7XG5cdFx0YmFzZV9zaGE6IHN0cmluZyxcblx0XHRoZWFkX3NoYTogc3RyaW5nLFxuXHRcdHN0YXJ0X3NoYTogc3RyaW5nLFxuXHR9LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKHJldDogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4pXG57XG5cdGxldCB7XG5cdFx0aWQsXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRjcmVhdGVkX2F0LFxuXHRcdHVwZGF0ZWRfYXQsXG5cblx0XHR0YXJnZXRfYnJhbmNoLFxuXHRcdHNvdXJjZV9icmFuY2gsXG5cblx0XHRsYWJlbHMsXG5cdFx0d29ya19pbl9wcm9ncmVzcyxcblxuXHRcdG1lcmdlX3N0YXR1cyxcblx0XHRtZXJnZV9lcnJvcixcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cblx0fSA9IHJldDtcblxuXHRyZXR1cm4ge1xuXHRcdGlkLFxuXHRcdHRpdGxlLFxuXHRcdGRlc2NyaXB0aW9uLFxuXG5cdFx0Y3JlYXRlZF9hdCxcblx0XHR1cGRhdGVkX2F0LFxuXG5cdFx0dGFyZ2V0X2JyYW5jaCxcblx0XHRzb3VyY2VfYnJhbmNoLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2gsXG5cblx0XHR3ZWJfdXJsLFxuXG5cdFx0ZGlmZl9yZWZzLFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGlHaXRsYWIoKVxue1xuXHRjb25zb2xlLmluZm8oYOmAo+aOpSBhcGlgKTtcblxuXHRsZXQgX2VudiA9IF9nZXRFbnZHaXRsYWIoKTtcblxuXHR0cnlcblx0e1xuXHRcdGNvbnN0IGFwaSA9IG5ldyBQcm9qZWN0c0J1bmRsZSh7XG5cdFx0XHR0b2tlbjogX2Vudi5BQ0NFU1NfVE9LRU4sXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gYXBpO1xuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihg6YCj5o6lIGFwaSDlpLHmlZdgKTtcblx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBiZWNhdXNlIGdpdGxhYiB3aWxsIGF1dG8gZG8gYGNvbnN0IHBJZCA9IGVuY29kZVVSSUNvbXBvbmVudChwcm9qZWN0SWQpO2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0ZXhwZWN0KGFycikuaGF2ZS5sZW5ndGhPZigyKTtcblxuXHRcdHJldHVybiBhcnIuam9pbignLycpO1xuXHR9XG5cblx0ZXhwZWN0KHByb2plY3RJZCkuYSgnbnVtYmVyJyk7XG5cblx0cmV0dXJuIHByb2plY3RJZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRFbnZHaXRsYWIoKVxue1xuXHRsZXQgQUNDRVNTX1RPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfQUNDRVNTX1RPS0VOIHx8ICcnO1xuXHRsZXQgVE9LRU46IHN0cmluZyA9IHByb2Nlc3MuZW52LkdJVExBQl9UT0tFTiB8fCAnJztcblxuXHRpZiAoIUFDQ0VTU19UT0tFTiB8fCAhVE9LRU4pXG5cdHtcblx0XHRsZXQgZW52ID0gZG90ZW52Q29uZmlnKHsgcGF0aDogcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnLmVudicpIH0pO1xuXG5cdFx0aWYgKGVudi5wYXJzZWQpXG5cdFx0e1xuXHRcdFx0QUNDRVNTX1RPS0VOID0gQUNDRVNTX1RPS0VOIHx8IGVudi5wYXJzZWQuR0lUTEFCX0FDQ0VTU19UT0tFTjtcblxuXHRcdFx0VE9LRU4gPSBUT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9UT0tFTjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdC8qKlxuXHRcdCAqIGZvciBhcGkuIENhbiBiZSBjcmVhdGVkIGluIHlvdXIgcHJvZmlsZS5cblx0XHQgKiBodHRwczovL2dpdGxhYi5jb20vcHJvZmlsZS9wZXJzb25hbF9hY2Nlc3NfdG9rZW5zXG5cdFx0ICovXG5cdFx0QUNDRVNTX1RPS0VOLFxuXHRcdC8qKlxuXHRcdCAqIHVzZXJuYW1lOnBhc3N3b3JkQFxuXHRcdCAqL1xuXHRcdFRPS0VOLFxuXHR9XG59XG4iXX0=