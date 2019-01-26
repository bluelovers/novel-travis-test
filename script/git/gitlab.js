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
        let _p = [
            {
                id: 10539227,
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
                log_1.default.error(`建立 PR 失敗 #${data.id} ${data.title}`);
                log_1.default.red.dir(data);
            }
            else {
                log_1.default.success(`成功建立 PR #${data.id} ${data.title}`);
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
        const api = new gitlab_1.Gitlab({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELElBQUksRUFBRSxHQUFHO1lBQ1I7Z0JBQ0MsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFO2FBQ2hCO1lBQ0Q7Z0JBQ0MsZUFBZTtnQkFDZixFQUFFLEVBQUUsUUFBUTtnQkFDWixFQUFFLEVBQUUsUUFBUTthQUNaO1NBQ0QsQ0FBQztRQUVGLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRTNCLE1BQU0sR0FBRyxHQUFHLFNBQVMsRUFBRSxDQUFDO1FBRXhCLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENB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R0FBRyxlQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFaEYsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUNkO1lBQ0MsWUFBWSxHQUFHLFlBQVksSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO1lBRTlELEtBQUssR0FBRyxLQUFLLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7U0FDekM7S0FDRDtJQUVELE9BQU87UUFDTjs7O1dBR0c7UUFDSCxZQUFZO1FBQ1o7O1dBRUc7UUFDSCxLQUFLO0tBQ0wsQ0FBQTtBQUNGLENBQUM7QUE1QkQsc0NBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS8xLzI2LzAyNi5cbiAqL1xuXG5pbXBvcnQgeyBQcm9qZWN0SWQgfSBmcm9tICdnaXRsYWIvdHlwZXMvdHlwZXMnO1xuaW1wb3J0IHsgY3VycmVudEJyYW5jaE5hbWUgfSBmcm9tICcuLi9naXQnO1xuaW1wb3J0IFByb2plY3RDb25maWcsIHsgbm92ZWxfcm9vdCB9IGZyb20gJy4uLy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCB7IGNvbmZpZyBhcyBkb3RlbnZDb25maWcgfSBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaW1wb3J0IHsgR2l0bGFiLCBQcm9qZWN0c0J1bmRsZSB9IGZyb20gJ2dpdGxhYic7XG5pbXBvcnQgKiBhcyBBUElTZXJ2aWNlcyBmcm9tICdnaXRsYWIvZGlzdC9zZXJ2aWNlcyc7XG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYigpOiBCbHVlYmlyZDxJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybj5cbntcblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRjb25zb2xlLmluZm8oYOWYl+ippuW7uueriyBQUmApO1xuXG5cdFx0XHRsZXQgYnJfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKG5vdmVsX3Jvb3QpO1xuXG5cdFx0XHRpZiAoIWJyX25hbWUubWF0Y2goL15hdXRvXFwvLykpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOebruWJjeWIhuaUr+eCuiAke2JyX25hbWV9IOW/veeVpeW7uueriyBQUmApO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5pbmZvKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfWApO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgX3AgPSBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZDogMTA1MzkyMjcsXG5cdFx0XHRcdFx0YnI6IGAke2JyX25hbWV9YCxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vaWQ6IDEwNTM4MjQwLFxuXHRcdFx0XHRcdGlkOiAxMDU0ODU5MSxcblx0XHRcdFx0XHRicjogYG1hc3RlcmAsXG5cdFx0XHRcdH0sXG5cdFx0XHRdO1xuXG5cdFx0XHRsZXQgX2kgPSAwO1xuXHRcdFx0bGV0IF9paiA9IE1hdGguYWJzKF9pIC0gMSk7XG5cblx0XHRcdGNvbnN0IGFwaSA9IGFwaUdpdGxhYigpO1xuXG5cdFx0XHRsZXQgcHJvamVjdElkID0gZGVjb2RlUHJvamVjdElkKF9wW19pXS5pZCk7XG5cblx0XHRcdGxldCBzb3VyY2VCcmFuY2g6IHN0cmluZyA9IF9wW19pXS5icjtcblx0XHRcdGxldCB0YXJnZXRCcmFuY2g6IHN0cmluZyA9IF9wW19pal0uYnI7XG5cbi8vXHRcdFx0c291cmNlQnJhbmNoID0gZW5jb2RlUHJvamVjdElkKHNvdXJjZUJyYW5jaCk7XG5cblx0XHRcdGxldCB0YXJnZXRfcHJvamVjdF9pZDogbnVtYmVyID0gX3BbX2lqXS5pZDtcblxuXHRcdFx0bGV0IHRpdGxlOiBzdHJpbmcgPSBgYXV0byBwciAoJHticl9uYW1lfSlgO1xuXG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gKGFwaS5NZXJnZVJlcXVlc3RzIGFzIEFQSVNlcnZpY2VzLk1lcmdlUmVxdWVzdHMpLmNyZWF0ZShcblx0XHRcdFx0XHRcdHByb2plY3RJZCxcblx0XHRcdFx0XHRcdHNvdXJjZUJyYW5jaCxcblx0XHRcdFx0XHRcdHRhcmdldEJyYW5jaCxcblx0XHRcdFx0XHRcdHRpdGxlLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVfc291cmNlX2JyYW5jaDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfY29sbGFib3JhdGlvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dfbWFpbnRhaW5lcl90b19wdXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRsYWJlbHM6IFtcblxuXHRcdFx0XHRcdFx0XHRdLmpvaW4oJywnKSxcblx0XHRcdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdFx0XHR0YXJnZXRfcHJvamVjdF9pZCxcblxuXHRcdFx0XHRcdFx0XHQvL3NxdWFzaDogdHJ1ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGFwKGZ1bmN0aW9uIChyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGRhdGEgPSBmaWx0ZXJHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKHJldCk7XG5cblx0XHRcdFx0XHRpZiAoIWRhdGEubWVyZ2Vfc3RhdHVzIHx8IFN0cmluZyhkYXRhLm1lcmdlX3N0YXR1cykgPT0gJ2Nhbm5vdF9iZV9tZXJnZWQnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOW7uueriyBQUiDlpLHmlZcgIyR7ZGF0YS5pZH0gJHtkYXRhLnRpdGxlfWApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5yZWQuZGlyKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGDmiJDlip/lu7rnq4sgUFIgIyR7ZGF0YS5pZH0gJHtkYXRhLnRpdGxlfWApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoZGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGVycjogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVFcnJvcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBfa25vd19lcnJvciA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0aWYgKGVyci5ib2R5KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmIChlcnIuYm9keS5tZXNzYWdlICYmIFN0cmluZyhlcnIuYm9keS5tZXNzYWdlKS5tYXRjaCgvQW5vdGhlciBvcGVuIG1lcmdlIHJlcXVlc3QgYWxyZWFkeSBleGlzdHMgZm9yIHRoaXMgc291cmNlIGJyYW5jaC8pKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRfa25vd19lcnJvciA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKGDmnKzmrKHkvb/nlKjnmoTliIbmlK/lt7LntpPlu7rnq4vpgY4gUFLvvIznhKHpoIjlnKjmhI/mraTpjK/oqqToqIrmga9gKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvL2NvbnNvbGUuZGlyKGVycik7XG5cblx0XHRcdFx0XHRpZiAoX2tub3dfZXJyb3IpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKGVyci50b1N0cmluZygpKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKGVyci5ib2R5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOW7uueriyBQUiDlpLHmlZdgKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5yZWQuZGlyKGVyci5ib2R5KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZXJyXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChlID0+IGUpXG5cdFx0XHRcdDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYjtcblxudHlwZSBIVFRQRXJyb3IgPSBFcnJvclxuXG5leHBvcnQgdHlwZSBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZUVycm9yID0gSFRUUEVycm9yICYge1xuXG5cdHN0YXR1c0NvZGU6IG51bWJlcixcblx0c3RhdHVzTWVzc2FnZTogbnVtYmVyLFxuXG5cdGJvZHk6IHtcblx0XHRtZXNzYWdlOiBzdHJpbmdbXSxcblx0fSxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVyblxue1xuXHRpZDogbnVtYmVyLFxuXHRpaWQ6IG51bWJlcixcblx0cHJvamVjdF9pZDogbnVtYmVyLFxuXG5cdHN0YXRlOiBzdHJpbmcsXG5cblx0dGl0bGU6IHN0cmluZyxcblx0ZGVzY3JpcHRpb246IHN0cmluZyxcblxuXHRjcmVhdGVkX2F0OiBzdHJpbmcsXG5cdHVwZGF0ZWRfYXQ6IHN0cmluZyxcblxuXHR0YXJnZXRfYnJhbmNoOiBzdHJpbmcsXG5cdHNvdXJjZV9icmFuY2g6IHN0cmluZyxcblxuXHRzb3VyY2VfcHJvamVjdF9pZDogbnVtYmVyLFxuXHR0YXJnZXRfcHJvamVjdF9pZDogbnVtYmVyLFxuXG5cdGxhYmVsczogc3RyaW5nW10sXG5cblx0d29ya19pbl9wcm9ncmVzczogYm9vbGVhbixcblxuXHRtZXJnZV9zdGF0dXM6IHN0cmluZyxcblx0bWVyZ2VfZXJyb3I6IGFueSxcblxuXHRzcXVhc2g6IGJvb2xlYW4sXG5cdGNoYW5nZXNfY291bnQ6IG51bWJlcixcblxuXHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2g6IGJvb2xlYW4sXG5cblx0d2ViX3VybDogc3RyaW5nLFxuXG5cdGRpZmZfcmVmczoge1xuXHRcdGJhc2Vfc2hhOiBzdHJpbmcsXG5cdFx0aGVhZF9zaGE6IHN0cmluZyxcblx0XHRzdGFydF9zaGE6IHN0cmluZyxcblx0fSxcblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybihyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxue1xuXHRsZXQge1xuXHRcdGlkLFxuXHRcdGlpZCxcblx0XHRwcm9qZWN0X2lkLFxuXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRzdGF0ZSxcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXHRcdHNvdXJjZV9wcm9qZWN0X2lkLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzcXVhc2gsXG5cdFx0Y2hhbmdlc19jb3VudCxcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cblx0fSA9IHJldDtcblxuXHQvKlxuXHRjb25zb2xlLmRpcihyZXQsIHtcblx0XHRkZXB0aDogNSxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXHQqL1xuXG5cdHJldHVybiB7XG5cdFx0aWQsXG5cdFx0aWlkLFxuXHRcdHByb2plY3RfaWQsXG5cblx0XHR0aXRsZSxcblx0XHRkZXNjcmlwdGlvbixcblxuXHRcdHN0YXRlLFxuXG5cdFx0Y3JlYXRlZF9hdCxcblx0XHR1cGRhdGVkX2F0LFxuXG5cdFx0dGFyZ2V0X2JyYW5jaCxcblx0XHRzb3VyY2VfYnJhbmNoLFxuXG5cdFx0dGFyZ2V0X3Byb2plY3RfaWQsXG5cdFx0c291cmNlX3Byb2plY3RfaWQsXG5cblx0XHRsYWJlbHMsXG5cdFx0d29ya19pbl9wcm9ncmVzcyxcblxuXHRcdG1lcmdlX3N0YXR1cyxcblx0XHRtZXJnZV9lcnJvcixcblxuXHRcdHNxdWFzaCxcblx0XHRjaGFuZ2VzX2NvdW50LFxuXG5cdFx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoLFxuXG5cdFx0d2ViX3VybCxcblxuXHRcdGRpZmZfcmVmcyxcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBpR2l0bGFiKClcbntcblx0Y29uc29sZS5pbmZvKGDpgKPmjqUgYXBpYCk7XG5cblx0bGV0IF9lbnYgPSBfZ2V0RW52R2l0bGFiKCk7XG5cblx0dHJ5XG5cdHtcblx0XHQvKlxuXHRcdGNvbnN0IGFwaSA9IG5ldyBQcm9qZWN0c0J1bmRsZSh7XG5cdFx0XHR0b2tlbjogX2Vudi5BQ0NFU1NfVE9LRU4sXG5cdFx0fSk7XG5cdFx0Ki9cblx0XHRjb25zdCBhcGkgPSBuZXcgR2l0bGFiKHtcblx0XHRcdHRva2VuOiBfZW52LkFDQ0VTU19UT0tFTixcblx0XHR9KTtcblxuXHRcdHJldHVybiBhcGk7XG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDpgKPmjqUgYXBpIOWkseaVl2ApO1xuXHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblx0fVxufVxuXG4vKipcbiAqIGJlY2F1c2UgZ2l0bGFiIHdpbGwgYXV0byBkbyBgY29uc3QgcElkID0gZW5jb2RlVVJJQ29tcG9uZW50KHByb2plY3RJZCk7YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG57XG5cdGlmICh0eXBlb2YgcHJvamVjdElkID09PSAnc3RyaW5nJylcblx0e1xuXHRcdGlmICgvXlxcZCskLy50ZXN0KHByb2plY3RJZCkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIHByb2plY3RJZDtcblx0XHR9XG5cblx0XHRsZXQgYXJyID0gcHJvamVjdElkLnNwbGl0KC8lMkZ8XFwvLyk7XG5cblx0XHRleHBlY3QoYXJyKS5oYXZlLmxlbmd0aE9mKDIpO1xuXG5cdFx0cmV0dXJuIGFyci5qb2luKCcvJyk7XG5cdH1cblxuXHRleHBlY3QocHJvamVjdElkKS5hKCdudW1iZXInKTtcblxuXHRyZXR1cm4gcHJvamVjdElkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogbnVtYmVyKTogbnVtYmVyXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogc3RyaW5nKTogc3RyaW5nXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG57XG5cdGlmICh0eXBlb2YgcHJvamVjdElkID09PSAnc3RyaW5nJylcblx0e1xuXHRcdGlmICgvXlxcZCskLy50ZXN0KHByb2plY3RJZCkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIHByb2plY3RJZDtcblx0XHR9XG5cblx0XHRsZXQgYXJyID0gcHJvamVjdElkLnNwbGl0KC8lMkZ8XFwvLyk7XG5cblx0XHRyZXR1cm4gYXJyLmpvaW4oJyUyRicpO1xuXHR9XG5cblx0ZXhwZWN0KHByb2plY3RJZCkuYSgnbnVtYmVyJyk7XG5cblx0cmV0dXJuIHByb2plY3RJZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRFbnZHaXRsYWIoKVxue1xuXHRsZXQgQUNDRVNTX1RPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfQUNDRVNTX1RPS0VOIHx8ICcnO1xuXHRsZXQgVE9LRU46IHN0cmluZyA9IHByb2Nlc3MuZW52LkdJVExBQl9UT0tFTiB8fCAnJztcblxuXHRpZiAoIUFDQ0VTU19UT0tFTiB8fCAhVE9LRU4pXG5cdHtcblx0XHRsZXQgZW52ID0gZG90ZW52Q29uZmlnKHsgcGF0aDogcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnLmVudicpIH0pO1xuXG5cdFx0aWYgKGVudi5wYXJzZWQpXG5cdFx0e1xuXHRcdFx0QUNDRVNTX1RPS0VOID0gQUNDRVNTX1RPS0VOIHx8IGVudi5wYXJzZWQuR0lUTEFCX0FDQ0VTU19UT0tFTjtcblxuXHRcdFx0VE9LRU4gPSBUT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9UT0tFTjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdC8qKlxuXHRcdCAqIGZvciBhcGkuIENhbiBiZSBjcmVhdGVkIGluIHlvdXIgcHJvZmlsZS5cblx0XHQgKiBodHRwczovL2dpdGxhYi5jb20vcHJvZmlsZS9wZXJzb25hbF9hY2Nlc3NfdG9rZW5zXG5cdFx0ICovXG5cdFx0QUNDRVNTX1RPS0VOLFxuXHRcdC8qKlxuXHRcdCAqIHVzZXJuYW1lOnBhc3N3b3JkQFxuXHRcdCAqL1xuXHRcdFRPS0VOLFxuXHR9XG59XG4iXX0=