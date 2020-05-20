"use strict";
/**
 * Created by user on 2019/1/26/026.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports._getEnvGitlab = exports.encodeProjectId = exports.decodeProjectId = exports.apiGitlab = exports.filterGitlabMergeRequestsCreateReturn = exports.createPullRequestsGitlab = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsaURBQWlEO0FBQ2pELGdDQUEyQztBQUMzQyx5REFBaUU7QUFDakUsbUNBQWdEO0FBQ2hELCtCQUFnQztBQUNoQyx1Q0FBb0M7QUFDcEMscUNBQXNDO0FBRXRDLG1DQUFnRDtBQUNoRCxzREFBc0Q7QUFDdEQsK0JBQThCO0FBSTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELElBQUksRUFBRSxHQUFHO1lBQ1I7Z0JBQ0MsZUFBZTtnQkFDZixFQUFFLEVBQUUsUUFBUTtnQkFDWixFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUU7YUFDaEI7WUFDRDtnQkFDQyxlQUFlO2dCQUNmLEVBQUUsRUFBRSxRQUFRO2dCQUNaLEVBQUUsRUFBRSxRQUFRO2FBQ1o7U0FDRCxDQUFDO1FBRUYsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFM0IsTUFBTSxHQUFHLEdBQUcsU0FBUyxFQUFFLENBQUM7UUFFeEIsSUFBSSxTQUFT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WSxJQUFJLENBQUMsS0FBSyxFQUMzQjtRQUNDLElBQUksR0FBRyxHQUFHLGVBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVoRixJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQ2Q7WUFDQyxZQUFZLEdBQUcsWUFBWSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUM7WUFFOUQsS0FBSyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztTQUN6QztLQUNEO0lBRUQsT0FBTztRQUNOOzs7V0FHRztRQUNILFlBQVk7UUFDWjs7V0FFRztRQUNILEtBQUs7S0FDTCxDQUFBO0FBQ0YsQ0FBQztBQTVCRCxzQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzEvMjYvMDI2LlxuICovXG5cbi8vaW1wb3J0IHsgUHJvamVjdElkIH0gZnJvbSAnZ2l0bGFiL3R5cGVzL3R5cGVzJztcbmltcG9ydCB7IGN1cnJlbnRCcmFuY2hOYW1lIH0gZnJvbSAnLi4vZ2l0JztcbmltcG9ydCBQcm9qZWN0Q29uZmlnLCB7IG5vdmVsX3Jvb3QgfSBmcm9tICcuLi8uLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmltcG9ydCBHaXRsYWIsIHsgUHJvamVjdHNCdW5kbGUgfSBmcm9tICdnaXRsYWInO1xuLy9pbXBvcnQgKiBhcyBBUElTZXJ2aWNlcyBmcm9tICdnaXRsYWIvZGlzdC9zZXJ2aWNlcyc7XG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcblxudHlwZSBQcm9qZWN0SWQgPSBzdHJpbmcgfCBudW1iZXI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQdWxsUmVxdWVzdHNHaXRsYWIoKTogQmx1ZWJpcmQ8SUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4+XG57XG5cdC8vIEB0cy1pZ25vcmVcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGDlmJfoqablu7rnq4sgUFJgKTtcblxuXHRcdFx0bGV0IGJyX25hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShub3ZlbF9yb290KTtcblxuXHRcdFx0aWYgKCFicl9uYW1lLm1hdGNoKC9eYXV0b1xcLy8pKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfSDlv73nlaXlu7rnq4sgUFJgKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg55uu5YmN5YiG5pSv54K6ICR7YnJfbmFtZX1gKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IF9wID0gW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9pZDogMTA1MzkyMjcsXG5cdFx0XHRcdFx0aWQ6IDEwNTUzNDk0LFxuXHRcdFx0XHRcdGJyOiBgJHticl9uYW1lfWAsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2lkOiAxMDUzODI0MCxcblx0XHRcdFx0XHRpZDogMTA1NDg1OTEsXG5cdFx0XHRcdFx0YnI6IGBtYXN0ZXJgLFxuXHRcdFx0XHR9LFxuXHRcdFx0XTtcblxuXHRcdFx0bGV0IF9pID0gMDtcblx0XHRcdGxldCBfaWogPSBNYXRoLmFicyhfaSAtIDEpO1xuXG5cdFx0XHRjb25zdCBhcGkgPSBhcGlHaXRsYWIoKTtcblxuXHRcdFx0bGV0IHByb2plY3RJZCA9IGRlY29kZVByb2plY3RJZChfcFtfaV0uaWQpO1xuXG5cdFx0XHRsZXQgc291cmNlQnJhbmNoOiBzdHJpbmcgPSBfcFtfaV0uYnI7XG5cdFx0XHRsZXQgdGFyZ2V0QnJhbmNoOiBzdHJpbmcgPSBfcFtfaWpdLmJyO1xuXG4vL1x0XHRcdHNvdXJjZUJyYW5jaCA9IGVuY29kZVByb2plY3RJZChzb3VyY2VCcmFuY2gpO1xuXG5cdFx0XHRsZXQgdGFyZ2V0X3Byb2plY3RfaWQ6IG51bWJlciA9IF9wW19pal0uaWQ7XG5cblx0XHRcdGxldCB0aXRsZTogc3RyaW5nID0gYGF1dG8gcHIgKCR7YnJfbmFtZX0pYDtcblxuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIGFwaS5NZXJnZVJlcXVlc3RzLmNyZWF0ZShcblx0XHRcdFx0XHRcdHByb2plY3RJZCxcblx0XHRcdFx0XHRcdHNvdXJjZUJyYW5jaCxcblx0XHRcdFx0XHRcdHRhcmdldEJyYW5jaCxcblx0XHRcdFx0XHRcdHRpdGxlLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVfc291cmNlX2JyYW5jaDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfY29sbGFib3JhdGlvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfbWFpbnRhaW5lcl90b19wdXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRsYWJlbHM6IFtcblxuXHRcdFx0XHRcdFx0XHRdLmpvaW4oJywnKSxcblx0XHRcdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdFx0XHR0YXJnZXRfcHJvamVjdF9pZCxcblxuXHRcdFx0XHRcdFx0XHQvL3NxdWFzaDogdHJ1ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGFwKGZ1bmN0aW9uIChyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGRhdGEgPSBmaWx0ZXJHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKHJldCk7XG5cblx0XHRcdFx0XHRpZiAoIWRhdGEubWVyZ2Vfc3RhdHVzIHx8IFN0cmluZyhkYXRhLm1lcmdlX3N0YXR1cykgPT0gJ2Nhbm5vdF9iZV9tZXJnZWQnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOW7uueriyBQUiDlpLHmlZcgIyR7ZGF0YS5paWR9ICR7ZGF0YS50aXRsZX1gKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUucmVkLmRpcihkYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg5oiQ5Yqf5bu656uLIFBSICMke2RhdGEuaWlkfSAke2RhdGEudGl0bGV9YCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmRpcihkYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyOiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZUVycm9yKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IF9rbm93X2Vycm9yID0gZmFsc2U7XG5cblx0XHRcdFx0XHRpZiAoZXJyLmJvZHkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKGVyci5ib2R5Lm1lc3NhZ2UgJiYgU3RyaW5nKGVyci5ib2R5Lm1lc3NhZ2UpLm1hdGNoKC9Bbm90aGVyIG9wZW4gbWVyZ2UgcmVxdWVzdCBhbHJlYWR5IGV4aXN0cyBmb3IgdGhpcyBzb3VyY2UgYnJhbmNoLykpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdF9rbm93X2Vycm9yID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmluZm8oYOacrOasoeS9v+eUqOeahOWIhuaUr+W3sue2k+W7uueri+mBjiBQUu+8jOeEoemgiOWcqOaEj+atpOmMr+iqpOioiuaBr2ApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vY29uc29sZS5kaXIoZXJyKTtcblxuXHRcdFx0XHRcdGlmIChfa25vd19lcnJvcilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmluZm8oZXJyLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoZXJyLmJvZHkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihg5bu656uLIFBSIOWkseaVl2ApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnJlZC5kaXIoZXJyLmJvZHkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBlcnJcblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKGUgPT4gZSlcblx0XHRcdFx0O1xuXHRcdH0pXG5cdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUHVsbFJlcXVlc3RzR2l0bGFiO1xuXG50eXBlIEhUVFBFcnJvciA9IEVycm9yXG5cbmV4cG9ydCB0eXBlIElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlRXJyb3IgPSBIVFRQRXJyb3IgJiB7XG5cblx0c3RhdHVzQ29kZTogbnVtYmVyLFxuXHRzdGF0dXNNZXNzYWdlOiBudW1iZXIsXG5cblx0Ym9keToge1xuXHRcdG1lc3NhZ2U6IHN0cmluZ1tdLFxuXHR9LFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuXG57XG5cdGlkOiBudW1iZXIsXG5cdGlpZDogbnVtYmVyLFxuXHRwcm9qZWN0X2lkOiBudW1iZXIsXG5cblx0c3RhdGU6IHN0cmluZyxcblxuXHR0aXRsZTogc3RyaW5nLFxuXHRkZXNjcmlwdGlvbjogc3RyaW5nLFxuXG5cdGNyZWF0ZWRfYXQ6IHN0cmluZyxcblx0dXBkYXRlZF9hdDogc3RyaW5nLFxuXG5cdHRhcmdldF9icmFuY2g6IHN0cmluZyxcblx0c291cmNlX2JyYW5jaDogc3RyaW5nLFxuXG5cdHNvdXJjZV9wcm9qZWN0X2lkOiBudW1iZXIsXG5cdHRhcmdldF9wcm9qZWN0X2lkOiBudW1iZXIsXG5cblx0bGFiZWxzOiBzdHJpbmdbXSxcblxuXHR3b3JrX2luX3Byb2dyZXNzOiBib29sZWFuLFxuXG5cdG1lcmdlX3N0YXR1czogc3RyaW5nLFxuXHRtZXJnZV9lcnJvcjogYW55LFxuXG5cdHNxdWFzaDogYm9vbGVhbixcblx0Y2hhbmdlc19jb3VudDogbnVtYmVyLFxuXG5cdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaDogYm9vbGVhbixcblxuXHR3ZWJfdXJsOiBzdHJpbmcsXG5cblx0ZGlmZl9yZWZzOiB7XG5cdFx0YmFzZV9zaGE6IHN0cmluZyxcblx0XHRoZWFkX3NoYTogc3RyaW5nLFxuXHRcdHN0YXJ0X3NoYTogc3RyaW5nLFxuXHR9LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKHJldDogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4pXG57XG5cdGxldCB7XG5cdFx0aWQsXG5cdFx0aWlkLFxuXHRcdHByb2plY3RfaWQsXG5cblx0XHR0aXRsZSxcblx0XHRkZXNjcmlwdGlvbixcblxuXHRcdHN0YXRlLFxuXG5cdFx0Y3JlYXRlZF9hdCxcblx0XHR1cGRhdGVkX2F0LFxuXG5cdFx0dGFyZ2V0X2JyYW5jaCxcblx0XHRzb3VyY2VfYnJhbmNoLFxuXG5cdFx0dGFyZ2V0X3Byb2plY3RfaWQsXG5cdFx0c291cmNlX3Byb2plY3RfaWQsXG5cblx0XHRsYWJlbHMsXG5cdFx0d29ya19pbl9wcm9ncmVzcyxcblxuXHRcdG1lcmdlX3N0YXR1cyxcblx0XHRtZXJnZV9lcnJvcixcblxuXHRcdHNxdWFzaCxcblx0XHRjaGFuZ2VzX2NvdW50LFxuXG5cdFx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoLFxuXG5cdFx0d2ViX3VybCxcblxuXHRcdGRpZmZfcmVmcyxcblxuXHR9ID0gcmV0O1xuXG5cdC8qXG5cdGNvbnNvbGUuZGlyKHJldCwge1xuXHRcdGRlcHRoOiA1LFxuXHRcdGNvbG9yczogdHJ1ZSxcblx0fSk7XG5cdCovXG5cblx0cmV0dXJuIHtcblx0XHRpZCxcblx0XHRpaWQsXG5cdFx0cHJvamVjdF9pZCxcblxuXHRcdHRpdGxlLFxuXHRcdGRlc2NyaXB0aW9uLFxuXG5cdFx0c3RhdGUsXG5cblx0XHRjcmVhdGVkX2F0LFxuXHRcdHVwZGF0ZWRfYXQsXG5cblx0XHR0YXJnZXRfYnJhbmNoLFxuXHRcdHNvdXJjZV9icmFuY2gsXG5cblx0XHR0YXJnZXRfcHJvamVjdF9pZCxcblx0XHRzb3VyY2VfcHJvamVjdF9pZCxcblxuXHRcdGxhYmVscyxcblx0XHR3b3JrX2luX3Byb2dyZXNzLFxuXG5cdFx0bWVyZ2Vfc3RhdHVzLFxuXHRcdG1lcmdlX2Vycm9yLFxuXG5cdFx0c3F1YXNoLFxuXHRcdGNoYW5nZXNfY291bnQsXG5cblx0XHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2gsXG5cblx0XHR3ZWJfdXJsLFxuXG5cdFx0ZGlmZl9yZWZzLFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGlHaXRsYWIoKVxue1xuXHRjb25zb2xlLmluZm8oYOmAo+aOpSBhcGlgKTtcblxuXHRsZXQgX2VudiA9IF9nZXRFbnZHaXRsYWIoKTtcblxuXHR0cnlcblx0e1xuXHRcdC8qXG5cdFx0Y29uc3QgYXBpID0gbmV3IFByb2plY3RzQnVuZGxlKHtcblx0XHRcdHRva2VuOiBfZW52LkFDQ0VTU19UT0tFTixcblx0XHR9KTtcblx0XHQqL1xuXHRcdGNvbnN0IGFwaSA9IG5ldyBHaXRsYWIoe1xuXHRcdFx0dG9rZW46IF9lbnYuQUNDRVNTX1RPS0VOLFxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGFwaTtcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYOmAo+aOpSBhcGkg5aSx5pWXYCk7XG5cdFx0Y29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuXHR9XG59XG5cbi8qKlxuICogYmVjYXVzZSBnaXRsYWIgd2lsbCBhdXRvIGRvIGBjb25zdCBwSWQgPSBlbmNvZGVVUklDb21wb25lbnQocHJvamVjdElkKTtgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVQcm9qZWN0SWQocHJvamVjdElkOiBQcm9qZWN0SWQpOiBQcm9qZWN0SWRcbntcblx0aWYgKHR5cGVvZiBwcm9qZWN0SWQgPT09ICdzdHJpbmcnKVxuXHR7XG5cdFx0aWYgKC9eXFxkKyQvLnRlc3QocHJvamVjdElkKSlcblx0XHR7XG5cdFx0XHRyZXR1cm4gcHJvamVjdElkO1xuXHRcdH1cblxuXHRcdGxldCBhcnIgPSBwcm9qZWN0SWQuc3BsaXQoLyUyRnxcXC8vKTtcblxuXHRcdGV4cGVjdChhcnIpLmhhdmUubGVuZ3RoT2YoMik7XG5cblx0XHRyZXR1cm4gYXJyLmpvaW4oJy8nKTtcblx0fVxuXG5cdGV4cGVjdChwcm9qZWN0SWQpLmEoJ251bWJlcicpO1xuXG5cdHJldHVybiBwcm9qZWN0SWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQcm9qZWN0SWQocHJvamVjdElkOiBudW1iZXIpOiBudW1iZXJcbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQcm9qZWN0SWQocHJvamVjdElkOiBzdHJpbmcpOiBzdHJpbmdcbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQcm9qZWN0SWQocHJvamVjdElkOiBQcm9qZWN0SWQpOiBQcm9qZWN0SWRcbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQcm9qZWN0SWQocHJvamVjdElkOiBQcm9qZWN0SWQpOiBQcm9qZWN0SWRcbntcblx0aWYgKHR5cGVvZiBwcm9qZWN0SWQgPT09ICdzdHJpbmcnKVxuXHR7XG5cdFx0aWYgKC9eXFxkKyQvLnRlc3QocHJvamVjdElkKSlcblx0XHR7XG5cdFx0XHRyZXR1cm4gcHJvamVjdElkO1xuXHRcdH1cblxuXHRcdGxldCBhcnIgPSBwcm9qZWN0SWQuc3BsaXQoLyUyRnxcXC8vKTtcblxuXHRcdHJldHVybiBhcnIuam9pbignJTJGJyk7XG5cdH1cblxuXHRleHBlY3QocHJvamVjdElkKS5hKCdudW1iZXInKTtcblxuXHRyZXR1cm4gcHJvamVjdElkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2dldEVudkdpdGxhYigpXG57XG5cdGxldCBBQ0NFU1NfVE9LRU46IHN0cmluZyA9IHByb2Nlc3MuZW52LkdJVExBQl9BQ0NFU1NfVE9LRU4gfHwgJyc7XG5cdGxldCBUT0tFTjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuR0lUTEFCX1RPS0VOIHx8ICcnO1xuXG5cdGlmICghQUNDRVNTX1RPS0VOIHx8ICFUT0tFTilcblx0e1xuXHRcdGxldCBlbnYgPSBkb3RlbnZDb25maWcoeyBwYXRoOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5wcm9qZWN0X3Jvb3QsICcuZW52JykgfSk7XG5cblx0XHRpZiAoZW52LnBhcnNlZClcblx0XHR7XG5cdFx0XHRBQ0NFU1NfVE9LRU4gPSBBQ0NFU1NfVE9LRU4gfHwgZW52LnBhcnNlZC5HSVRMQUJfQUNDRVNTX1RPS0VOO1xuXG5cdFx0XHRUT0tFTiA9IFRPS0VOIHx8IGVudi5wYXJzZWQuR0lUTEFCX1RPS0VOO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB7XG5cdFx0LyoqXG5cdFx0ICogZm9yIGFwaS4gQ2FuIGJlIGNyZWF0ZWQgaW4geW91ciBwcm9maWxlLlxuXHRcdCAqIGh0dHBzOi8vZ2l0bGFiLmNvbS9wcm9maWxlL3BlcnNvbmFsX2FjY2Vzc190b2tlbnNcblx0XHQgKi9cblx0XHRBQ0NFU1NfVE9LRU4sXG5cdFx0LyoqXG5cdFx0ICogdXNlcm5hbWU6cGFzc3dvcmRAXG5cdFx0ICovXG5cdFx0VE9LRU4sXG5cdH1cbn1cbiJdfQ==