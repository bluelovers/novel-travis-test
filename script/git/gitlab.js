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
                id: 10538240,
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
            log_1.default.dir(err);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELElBQUksRUFBRSxHQUFHO1lBQ1I7Z0JBQ0MsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFO2FBQ2hCO1lBQ0Q7Z0JBQ0MsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osRUFBRSxFQUFFLFFBQVE7YUFDWjtTQUNELENBQUM7UUFFRixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUUzQixNQUFNLEdBQUcsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUV4QixJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FB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QjtRQUNDLElBQUksR0FBRyxHQUFHLGVBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVoRixJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQ2Q7WUFDQyxZQUFZLEdBQUcsWUFBWSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUM7WUFFOUQsS0FBSyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztTQUN6QztLQUNEO0lBRUQsT0FBTztRQUNOOzs7V0FHRztRQUNILFlBQVk7UUFDWjs7V0FFRztRQUNILEtBQUs7S0FDTCxDQUFBO0FBQ0YsQ0FBQztBQTVCRCxzQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzEvMjYvMDI2LlxuICovXG5cbmltcG9ydCB7IFByb2plY3RJZCB9IGZyb20gJ2dpdGxhYi90eXBlcy90eXBlcyc7XG5pbXBvcnQgeyBjdXJyZW50QnJhbmNoTmFtZSB9IGZyb20gJy4uL2dpdCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZywgeyBub3ZlbF9yb290IH0gZnJvbSAnLi4vLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgY29uZmlnIGFzIGRvdGVudkNvbmZpZyB9IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vLi4vbGliL2xvZyc7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuXG5pbXBvcnQgeyBHaXRsYWIsIFByb2plY3RzQnVuZGxlIH0gZnJvbSAnZ2l0bGFiJztcbmltcG9ydCAqIGFzIEFQSVNlcnZpY2VzIGZyb20gJ2dpdGxhYi9kaXN0L3NlcnZpY2VzJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHVsbFJlcXVlc3RzR2l0bGFiKCk6IEJsdWViaXJkPElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuPlxue1xuXHQvLyBAdHMtaWdub3JlXG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcblx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuaW5mbyhg5ZiX6Kmm5bu656uLIFBSYCk7XG5cblx0XHRcdGxldCBicl9uYW1lID0gY3VycmVudEJyYW5jaE5hbWUobm92ZWxfcm9vdCk7XG5cblx0XHRcdGlmICghYnJfbmFtZS5tYXRjaCgvXmF1dG9cXC8vKSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihg55uu5YmN5YiG5pSv54K6ICR7YnJfbmFtZX0g5b+955Wl5bu656uLIFBSYCk7XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmluZm8oYOebruWJjeWIhuaUr+eCuiAke2JyX25hbWV9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBfcCA9IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlkOiAxMDUzOTIyNyxcblx0XHRcdFx0XHRicjogYCR7YnJfbmFtZX1gLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWQ6IDEwNTM4MjQwLFxuXHRcdFx0XHRcdGJyOiBgbWFzdGVyYCxcblx0XHRcdFx0fSxcblx0XHRcdF07XG5cblx0XHRcdGxldCBfaSA9IDA7XG5cdFx0XHRsZXQgX2lqID0gTWF0aC5hYnMoX2kgLSAxKTtcblxuXHRcdFx0Y29uc3QgYXBpID0gYXBpR2l0bGFiKCk7XG5cblx0XHRcdGxldCBwcm9qZWN0SWQgPSBkZWNvZGVQcm9qZWN0SWQoX3BbX2ldLmlkKTtcblxuXHRcdFx0bGV0IHNvdXJjZUJyYW5jaDogc3RyaW5nID0gX3BbX2ldLmJyO1xuXHRcdFx0bGV0IHRhcmdldEJyYW5jaDogc3RyaW5nID0gX3BbX2lqXS5icjtcblxuLy9cdFx0XHRzb3VyY2VCcmFuY2ggPSBlbmNvZGVQcm9qZWN0SWQoc291cmNlQnJhbmNoKTtcblxuXHRcdFx0bGV0IHRhcmdldF9wcm9qZWN0X2lkOiBudW1iZXIgPSBfcFtfaWpdLmlkO1xuXG5cdFx0XHRsZXQgdGl0bGU6IHN0cmluZyA9IGBhdXRvIHByICgke2JyX25hbWV9KWA7XG5cblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiAoYXBpLk1lcmdlUmVxdWVzdHMgYXMgQVBJU2VydmljZXMuTWVyZ2VSZXF1ZXN0cykuY3JlYXRlKFxuXHRcdFx0XHRcdFx0cHJvamVjdElkLFxuXHRcdFx0XHRcdFx0c291cmNlQnJhbmNoLFxuXHRcdFx0XHRcdFx0dGFyZ2V0QnJhbmNoLFxuXHRcdFx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJlbW92ZV9zb3VyY2VfYnJhbmNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGxvd19jb2xsYWJvcmF0aW9uOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGxvd19tYWludGFpbmVyX3RvX3B1c2g6IHRydWUsXG5cdFx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRcdGxhYmVsczogW1xuXG5cdFx0XHRcdFx0XHRcdF0uam9pbignLCcpLFxuXHRcdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXG5cdFx0XHRcdFx0XHRcdC8vc3F1YXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50YXAoZnVuY3Rpb24gKHJldDogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgZGF0YSA9IGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0KTtcblxuXHRcdFx0XHRcdGlmICghZGF0YS5tZXJnZV9zdGF0dXMgfHwgU3RyaW5nKGRhdGEubWVyZ2Vfc3RhdHVzKSA9PSAnY2Fubm90X2JlX21lcmdlZCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihg5bu656uLIFBSIOWkseaVlyAjJHtkYXRhLmlkfSAke2RhdGEudGl0bGV9YCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnJlZC5kaXIoZGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYOaIkOWKn+W7uueriyBQUiAjJHtkYXRhLmlkfSAke2RhdGEudGl0bGV9YCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmRpcihkYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyOiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZUVycm9yKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IF9rbm93X2Vycm9yID0gZmFsc2U7XG5cblx0XHRcdFx0XHRpZiAoZXJyLmJvZHkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKGVyci5ib2R5Lm1lc3NhZ2UgJiYgU3RyaW5nKGVyci5ib2R5Lm1lc3NhZ2UpLm1hdGNoKC9Bbm90aGVyIG9wZW4gbWVyZ2UgcmVxdWVzdCBhbHJlYWR5IGV4aXN0cyBmb3IgdGhpcyBzb3VyY2UgYnJhbmNoLykpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdF9rbm93X2Vycm9yID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmluZm8oYOacrOasoeS9v+eUqOeahOWIhuaUr+W3sue2k+W7uueri+mBjiBQUu+8jOeEoemgiOWcqOaEj+atpOmMr+iqpOioiuaBr2ApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnNvbGUuZGlyKGVycik7XG5cblx0XHRcdFx0XHRpZiAoX2tub3dfZXJyb3IpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKGVyci50b1N0cmluZygpKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKGVyci5ib2R5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOW7uueriyBQUiDlpLHmlZdgKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5yZWQuZGlyKGVyci5ib2R5KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZXJyXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChlID0+IGUpXG5cdFx0XHRcdDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVB1bGxSZXF1ZXN0c0dpdGxhYjtcblxudHlwZSBIVFRQRXJyb3IgPSBFcnJvclxuXG5leHBvcnQgdHlwZSBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZUVycm9yID0gSFRUUEVycm9yICYge1xuXG5cdHN0YXR1c0NvZGU6IG51bWJlcixcblx0c3RhdHVzTWVzc2FnZTogbnVtYmVyLFxuXG5cdGJvZHk6IHtcblx0XHRtZXNzYWdlOiBzdHJpbmdbXSxcblx0fSxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVyblxue1xuXHRpZDogbnVtYmVyLFxuXHRpaWQ6IG51bWJlcixcblx0cHJvamVjdF9pZDogbnVtYmVyLFxuXG5cdHN0YXRlOiBzdHJpbmcsXG5cblx0dGl0bGU6IHN0cmluZyxcblx0ZGVzY3JpcHRpb246IHN0cmluZyxcblxuXHRjcmVhdGVkX2F0OiBzdHJpbmcsXG5cdHVwZGF0ZWRfYXQ6IHN0cmluZyxcblxuXHR0YXJnZXRfYnJhbmNoOiBzdHJpbmcsXG5cdHNvdXJjZV9icmFuY2g6IHN0cmluZyxcblxuXHRzb3VyY2VfcHJvamVjdF9pZDogbnVtYmVyLFxuXHR0YXJnZXRfcHJvamVjdF9pZDogbnVtYmVyLFxuXG5cdGxhYmVsczogc3RyaW5nW10sXG5cblx0d29ya19pbl9wcm9ncmVzczogYm9vbGVhbixcblxuXHRtZXJnZV9zdGF0dXM6IHN0cmluZyxcblx0bWVyZ2VfZXJyb3I6IGFueSxcblxuXHRzcXVhc2g6IGJvb2xlYW4sXG5cdGNoYW5nZXNfY291bnQ6IG51bWJlcixcblxuXHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2g6IGJvb2xlYW4sXG5cblx0d2ViX3VybDogc3RyaW5nLFxuXG5cdGRpZmZfcmVmczoge1xuXHRcdGJhc2Vfc2hhOiBzdHJpbmcsXG5cdFx0aGVhZF9zaGE6IHN0cmluZyxcblx0XHRzdGFydF9zaGE6IHN0cmluZyxcblx0fSxcblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybihyZXQ6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuKVxue1xuXHRsZXQge1xuXHRcdGlkLFxuXHRcdGlpZCxcblx0XHRwcm9qZWN0X2lkLFxuXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRzdGF0ZSxcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXHRcdHNvdXJjZV9wcm9qZWN0X2lkLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzcXVhc2gsXG5cdFx0Y2hhbmdlc19jb3VudCxcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cblx0fSA9IHJldDtcblxuXHQvKlxuXHRjb25zb2xlLmRpcihyZXQsIHtcblx0XHRkZXB0aDogNSxcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0pO1xuXHQqL1xuXG5cdHJldHVybiB7XG5cdFx0aWQsXG5cdFx0aWlkLFxuXHRcdHByb2plY3RfaWQsXG5cblx0XHR0aXRsZSxcblx0XHRkZXNjcmlwdGlvbixcblxuXHRcdHN0YXRlLFxuXG5cdFx0Y3JlYXRlZF9hdCxcblx0XHR1cGRhdGVkX2F0LFxuXG5cdFx0dGFyZ2V0X2JyYW5jaCxcblx0XHRzb3VyY2VfYnJhbmNoLFxuXG5cdFx0dGFyZ2V0X3Byb2plY3RfaWQsXG5cdFx0c291cmNlX3Byb2plY3RfaWQsXG5cblx0XHRsYWJlbHMsXG5cdFx0d29ya19pbl9wcm9ncmVzcyxcblxuXHRcdG1lcmdlX3N0YXR1cyxcblx0XHRtZXJnZV9lcnJvcixcblxuXHRcdHNxdWFzaCxcblx0XHRjaGFuZ2VzX2NvdW50LFxuXG5cdFx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoLFxuXG5cdFx0d2ViX3VybCxcblxuXHRcdGRpZmZfcmVmcyxcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBpR2l0bGFiKClcbntcblx0Y29uc29sZS5pbmZvKGDpgKPmjqUgYXBpYCk7XG5cblx0bGV0IF9lbnYgPSBfZ2V0RW52R2l0bGFiKCk7XG5cblx0dHJ5XG5cdHtcblx0XHQvKlxuXHRcdGNvbnN0IGFwaSA9IG5ldyBQcm9qZWN0c0J1bmRsZSh7XG5cdFx0XHR0b2tlbjogX2Vudi5BQ0NFU1NfVE9LRU4sXG5cdFx0fSk7XG5cdFx0Ki9cblx0XHRjb25zdCBhcGkgPSBuZXcgR2l0bGFiKHtcblx0XHRcdHRva2VuOiBfZW52LkFDQ0VTU19UT0tFTixcblx0XHR9KTtcblxuXHRcdHJldHVybiBhcGk7XG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDpgKPmjqUgYXBpIOWkseaVl2ApO1xuXHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblx0fVxufVxuXG4vKipcbiAqIGJlY2F1c2UgZ2l0bGFiIHdpbGwgYXV0byBkbyBgY29uc3QgcElkID0gZW5jb2RlVVJJQ29tcG9uZW50KHByb2plY3RJZCk7YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG57XG5cdGlmICh0eXBlb2YgcHJvamVjdElkID09PSAnc3RyaW5nJylcblx0e1xuXHRcdGlmICgvXlxcZCskLy50ZXN0KHByb2plY3RJZCkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIHByb2plY3RJZDtcblx0XHR9XG5cblx0XHRsZXQgYXJyID0gcHJvamVjdElkLnNwbGl0KC8lMkZ8XFwvLyk7XG5cblx0XHRleHBlY3QoYXJyKS5oYXZlLmxlbmd0aE9mKDIpO1xuXG5cdFx0cmV0dXJuIGFyci5qb2luKCcvJyk7XG5cdH1cblxuXHRleHBlY3QocHJvamVjdElkKS5hKCdudW1iZXInKTtcblxuXHRyZXR1cm4gcHJvamVjdElkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogbnVtYmVyKTogbnVtYmVyXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogc3RyaW5nKTogc3RyaW5nXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHJvamVjdElkKHByb2plY3RJZDogUHJvamVjdElkKTogUHJvamVjdElkXG57XG5cdGlmICh0eXBlb2YgcHJvamVjdElkID09PSAnc3RyaW5nJylcblx0e1xuXHRcdGlmICgvXlxcZCskLy50ZXN0KHByb2plY3RJZCkpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIHByb2plY3RJZDtcblx0XHR9XG5cblx0XHRsZXQgYXJyID0gcHJvamVjdElkLnNwbGl0KC8lMkZ8XFwvLyk7XG5cblx0XHRyZXR1cm4gYXJyLmpvaW4oJyUyRicpO1xuXHR9XG5cblx0ZXhwZWN0KHByb2plY3RJZCkuYSgnbnVtYmVyJyk7XG5cblx0cmV0dXJuIHByb2plY3RJZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRFbnZHaXRsYWIoKVxue1xuXHRsZXQgQUNDRVNTX1RPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfQUNDRVNTX1RPS0VOIHx8ICcnO1xuXHRsZXQgVE9LRU46IHN0cmluZyA9IHByb2Nlc3MuZW52LkdJVExBQl9UT0tFTiB8fCAnJztcblxuXHRpZiAoIUFDQ0VTU19UT0tFTiB8fCAhVE9LRU4pXG5cdHtcblx0XHRsZXQgZW52ID0gZG90ZW52Q29uZmlnKHsgcGF0aDogcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnLmVudicpIH0pO1xuXG5cdFx0aWYgKGVudi5wYXJzZWQpXG5cdFx0e1xuXHRcdFx0QUNDRVNTX1RPS0VOID0gQUNDRVNTX1RPS0VOIHx8IGVudi5wYXJzZWQuR0lUTEFCX0FDQ0VTU19UT0tFTjtcblxuXHRcdFx0VE9LRU4gPSBUT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9UT0tFTjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdC8qKlxuXHRcdCAqIGZvciBhcGkuIENhbiBiZSBjcmVhdGVkIGluIHlvdXIgcHJvZmlsZS5cblx0XHQgKiBodHRwczovL2dpdGxhYi5jb20vcHJvZmlsZS9wZXJzb25hbF9hY2Nlc3NfdG9rZW5zXG5cdFx0ICovXG5cdFx0QUNDRVNTX1RPS0VOLFxuXHRcdC8qKlxuXHRcdCAqIHVzZXJuYW1lOnBhc3N3b3JkQFxuXHRcdCAqL1xuXHRcdFRPS0VOLFxuXHR9XG59XG4iXX0=