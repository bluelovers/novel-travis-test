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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELElBQUksRUFBRSxHQUFHO1lBQ1I7Z0JBQ0MsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFO2FBQ2hCO1lBQ0Q7Z0JBQ0MsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osRUFBRSxFQUFFLFFBQVE7YUFDWjtTQUNELENBQUM7UUFFRixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUUzQixNQUFNLEdBQUcsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUV4QixJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTNDLElBQUksWUFBWSxHQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDckMsSUFBSSxZQUFZLEdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUV6QyxrREFBa0Q7UUFFL0MsSUFBSSxpQkFBaUIsR0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRTNDLElBQUksS0FBSyxHQUFXLFlBQVksT0FBTyxHQUFHLENBQUM7UUFFM0MsYUFBYTtRQUNiLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRTthQUN2QixJQUFJLENBQUM7WUFFTCxPQUFRLEdBQUcsQ0FBQyxhQUEyQyxDQUFDLE1BQU0sQ0FDN0QsU0FBUyxFQUNULFlBQVksRUFDWixZQUFZLEVBQ1osS0FBSyxFQUNMO2dCQUNDLG9CQUFvQixFQUFFLElBQUk7Z0JBQzFCLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLHdCQUF3QixFQUFFLElBQUk7Z0JBQzlCOzs7O2tCQUlFO2dCQUVGLGlCQUFpQjthQUdqQixDQUNELENBQUE7UUFDRixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsVUFBVSxHQUFxQztZQUVuRCxJQUFJLElBQUksR0FBRyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUV0RCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLGtCQUFrQixFQUN6RTtnQkFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDcEQsYUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEI7aUJBRUQ7Z0JBQ0MsYUFBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3JELGFBQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEI7UUFDRixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsVUFBVSxHQUFvQztZQUVwRCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFFeEIsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUNaO2dCQUNDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLGtFQUFrRSxDQUFDLEVBQzFIO29CQUNDLFdBQVcsR0FBRyxJQUFJLENBQUM7b0JBRW5CLGFBQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztpQkFDMUM7YUFDRDtZQUVELG1CQUFtQjtZQUVuQixJQUFJLFdBQVcsRUFDZjtnQkFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QixhQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0QjtpQkFFRDtnQkFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMxQixhQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM5QixhQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUI7WUFFRCxPQUFPLEdBQUcsQ0FBQTtRQUNYLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNiO0lBQ0gsQ0FBQyxDQUFDLENBQ0Y7QUFDRixDQUFDO0FBMUhELDREQTBIQztBQUVELGtCQUFlLHdCQUF3QixDQUFDO0FBd0R4QyxTQUFnQixxQ0FBcUMsQ0FBQyxHQUFxQztJQUUxRixJQUFJLEVBQ0gsRUFBRSxFQUNGLEdBQUcsRUFDSCxVQUFVLEVBRVYsS0FBSyxFQUNMLFdBQVcsRUFFWCxLQUFLLEVBRUwsVUFBVSxFQUNWLFVBQVUsRUFFVixhQUFhLEVBQ2IsYUFBYSxFQUViLGlCQUFpQixFQUNqQixpQkFBaUIsRUFFakIsTUFBTSxFQUNOLGdCQUFnQixFQUVoQixZQUFZLEVBQ1osV0FBVyxFQUVYLE1BQU0sRUFDTixhQUFhLEVBRWIsMkJBQTJCLEVBRTNCLE9BQU8sRUFFUCxTQUFTLEdBRVQsR0FBRyxHQUFHLENBQUM7SUFFUjs7Ozs7TUFLRTtJQUVGLE9BQU87UUFDTixFQUFFO1FBQ0YsR0FBRztRQUNILFVBQVU7UUFFVixLQUFLO1FBQ0wsV0FBVztRQUVYLEtBQUs7UUFFTCxVQUFVO1FBQ1YsVUFBVTtRQUVWLGFBQWE7UUFDYixhQUFhO1FBRWIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUVqQixNQUFNO1FBQ04sZ0JBQWdCO1FBRWhCLFlBQVk7UUFDWixXQUFXO1FBRVgsTUFBTTtRQUNOLGFBQWE7UUFFYiwyQkFBMkI7UUFFM0IsT0FBTztRQUVQLFNBQVM7S0FDVCxDQUFBO0FBQ0YsQ0FBQztBQS9FRCxzRkErRUM7QUFFRCxTQUFnQixTQUFTO0lBRXhCLGFBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkIsSUFBSSxJQUFJLEdBQUcsYUFBYSxFQUFFLENBQUM7SUFFM0IsSUFDQTtRQUNDOzs7O1VBSUU7UUFDRixNQUFNLEdBQUcsR0FBRyxJQUFJLGVBQU0sQ0FBQztZQUN0QixLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxHQUFHLENBQUM7S0FDWDtJQUNELE9BQU8sQ0FBQyxFQUNSO1FBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzQixhQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUN6QjtBQUNGLENBQUM7QUF4QkQsOEJBd0JDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixlQUFlLENBQUMsU0FBb0I7SUFFbkQsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQ2pDO1FBQ0MsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUMzQjtZQUNDLE9BQU8sU0FBUyxDQUFDO1NBQ2pCO1FBRUQsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVwQyxhQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU3QixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDckI7SUFFRCxhQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlCLE9BQU8sU0FBUyxDQUFDO0FBQ2xCLENBQUM7QUFuQkQsMENBbUJDO0FBS0QsU0FBZ0IsZUFBZSxDQUFDLFNBQW9CO0lBRW5ELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUNqQztRQUNDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFDM0I7WUFDQyxPQUFPLFNBQVMsQ0FBQztTQUNqQjtRQUVELElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFcEMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3ZCO0lBRUQsYUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5QixPQUFPLFNBQVMsQ0FBQztBQUNsQixDQUFDO0FBakJELDBDQWlCQztBQUVELFNBQWdCLGFBQWE7SUFFNUIsSUFBSSxZQUFZLEdBQVcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxFQUFFLENBQUM7SUFDakUsSUFBSSxLQUFLLEdBQVcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDO0lBRW5ELElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxLQUFLLEVBQzNCO1FBQ0MsSUFBSSxHQUFHLEdBQUcsZUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhGLElBQUksR0FBRyxDQUFDLE1BQU0sRUFDZDtZQUNDLFlBQVksR0FBRyxZQUFZLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztZQUU5RCxLQUFLLEdBQUcsS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQ3pDO0tBQ0Q7SUFFRCxPQUFPO1FBQ047OztXQUdHO1FBQ0gsWUFBWTtRQUNaOztXQUVHO1FBQ0gsS0FBSztLQUNMLENBQUE7QUFDRixDQUFDO0FBNUJELHNDQTRCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvMS8yNi8wMjYuXG4gKi9cblxuaW1wb3J0IHsgUHJvamVjdElkIH0gZnJvbSAnZ2l0bGFiL3R5cGVzL3R5cGVzJztcbmltcG9ydCB7IGN1cnJlbnRCcmFuY2hOYW1lIH0gZnJvbSAnLi4vZ2l0JztcbmltcG9ydCBQcm9qZWN0Q29uZmlnLCB7IG5vdmVsX3Jvb3QgfSBmcm9tICcuLi8uLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmltcG9ydCB7IEdpdGxhYiwgUHJvamVjdHNCdW5kbGUgfSBmcm9tICdnaXRsYWInO1xuaW1wb3J0ICogYXMgQVBJU2VydmljZXMgZnJvbSAnZ2l0bGFiL2Rpc3Qvc2VydmljZXMnO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQdWxsUmVxdWVzdHNHaXRsYWIoKTogQmx1ZWJpcmQ8SUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4+XG57XG5cdC8vIEB0cy1pZ25vcmVcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5pbmZvKGDlmJfoqablu7rnq4sgUFJgKTtcblxuXHRcdFx0bGV0IGJyX25hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShub3ZlbF9yb290KTtcblxuXHRcdFx0aWYgKCFicl9uYW1lLm1hdGNoKC9eYXV0b1xcLy8pKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGDnm67liY3liIbmlK/ngrogJHticl9uYW1lfSDlv73nlaXlu7rnq4sgUFJgKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuaW5mbyhg55uu5YmN5YiG5pSv54K6ICR7YnJfbmFtZX1gKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IF9wID0gW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWQ6IDEwNTM5MjI3LFxuXHRcdFx0XHRcdGJyOiBgJHticl9uYW1lfWAsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZDogMTA1MzgyNDAsXG5cdFx0XHRcdFx0YnI6IGBtYXN0ZXJgLFxuXHRcdFx0XHR9LFxuXHRcdFx0XTtcblxuXHRcdFx0bGV0IF9pID0gMDtcblx0XHRcdGxldCBfaWogPSBNYXRoLmFicyhfaSAtIDEpO1xuXG5cdFx0XHRjb25zdCBhcGkgPSBhcGlHaXRsYWIoKTtcblxuXHRcdFx0bGV0IHByb2plY3RJZCA9IGRlY29kZVByb2plY3RJZChfcFtfaV0uaWQpO1xuXG5cdFx0XHRsZXQgc291cmNlQnJhbmNoOiBzdHJpbmcgPSBfcFtfaV0uYnI7XG5cdFx0XHRsZXQgdGFyZ2V0QnJhbmNoOiBzdHJpbmcgPSBfcFtfaWpdLmJyO1xuXG4vL1x0XHRcdHNvdXJjZUJyYW5jaCA9IGVuY29kZVByb2plY3RJZChzb3VyY2VCcmFuY2gpO1xuXG5cdFx0XHRsZXQgdGFyZ2V0X3Byb2plY3RfaWQ6IG51bWJlciA9IF9wW19pal0uaWQ7XG5cblx0XHRcdGxldCB0aXRsZTogc3RyaW5nID0gYGF1dG8gcHIgKCR7YnJfbmFtZX0pYDtcblxuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIChhcGkuTWVyZ2VSZXF1ZXN0cyBhcyBBUElTZXJ2aWNlcy5NZXJnZVJlcXVlc3RzKS5jcmVhdGUoXG5cdFx0XHRcdFx0XHRwcm9qZWN0SWQsXG5cdFx0XHRcdFx0XHRzb3VyY2VCcmFuY2gsXG5cdFx0XHRcdFx0XHR0YXJnZXRCcmFuY2gsXG5cdFx0XHRcdFx0XHR0aXRsZSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmVtb3ZlX3NvdXJjZV9icmFuY2g6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGFsbG93X2NvbGxhYm9yYXRpb246IHRydWUsXG5cdFx0XHRcdFx0XHRcdGFsbG93X21haW50YWluZXJfdG9fcHVzaDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0Lypcblx0XHRcdFx0XHRcdFx0bGFiZWxzOiBbXG5cblx0XHRcdFx0XHRcdFx0XS5qb2luKCcsJyksXG5cdFx0XHRcdFx0XHRcdCovXG5cblx0XHRcdFx0XHRcdFx0dGFyZ2V0X3Byb2plY3RfaWQsXG5cblx0XHRcdFx0XHRcdFx0Ly9zcXVhc2g6IHRydWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fSlcblx0XHRcdFx0LnRhcChmdW5jdGlvbiAocmV0OiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBkYXRhID0gZmlsdGVyR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybihyZXQpO1xuXG5cdFx0XHRcdFx0aWYgKCFkYXRhLm1lcmdlX3N0YXR1cyB8fCBTdHJpbmcoZGF0YS5tZXJnZV9zdGF0dXMpID09ICdjYW5ub3RfYmVfbWVyZ2VkJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGDlu7rnq4sgUFIg5aSx5pWXICMke2RhdGEuaWR9ICR7ZGF0YS50aXRsZX1gKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUucmVkLmRpcihkYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg5oiQ5Yqf5bu656uLIFBSICMke2RhdGEuaWR9ICR7ZGF0YS50aXRsZX1gKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlcnI6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlRXJyb3IpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgX2tub3dfZXJyb3IgPSBmYWxzZTtcblxuXHRcdFx0XHRcdGlmIChlcnIuYm9keSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAoZXJyLmJvZHkubWVzc2FnZSAmJiBTdHJpbmcoZXJyLmJvZHkubWVzc2FnZSkubWF0Y2goL0Fub3RoZXIgb3BlbiBtZXJnZSByZXF1ZXN0IGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIHNvdXJjZSBicmFuY2gvKSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0X2tub3dfZXJyb3IgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5L2/55So55qE5YiG5pSv5bey57aT5bu656uL6YGOIFBS77yM54Sh6aCI5Zyo5oSP5q2k6Yyv6Kqk6KiK5oGvYCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmRpcihlcnIpO1xuXG5cdFx0XHRcdFx0aWYgKF9rbm93X2Vycm9yKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhlcnIudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmRpcihlcnIuYm9keSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGDlu7rnq4sgUFIg5aSx5pWXYCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVyci50b1N0cmluZygpKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUucmVkLmRpcihlcnIuYm9keSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGVyclxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZSA9PiBlKVxuXHRcdFx0XHQ7XG5cdFx0fSlcblx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVQdWxsUmVxdWVzdHNHaXRsYWI7XG5cbnR5cGUgSFRUUEVycm9yID0gRXJyb3JcblxuZXhwb3J0IHR5cGUgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVFcnJvciA9IEhUVFBFcnJvciAmIHtcblxuXHRzdGF0dXNDb2RlOiBudW1iZXIsXG5cdHN0YXR1c01lc3NhZ2U6IG51bWJlcixcblxuXHRib2R5OiB7XG5cdFx0bWVzc2FnZTogc3RyaW5nW10sXG5cdH0sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm5cbntcblx0aWQ6IG51bWJlcixcblx0aWlkOiBudW1iZXIsXG5cdHByb2plY3RfaWQ6IG51bWJlcixcblxuXHRzdGF0ZTogc3RyaW5nLFxuXG5cdHRpdGxlOiBzdHJpbmcsXG5cdGRlc2NyaXB0aW9uOiBzdHJpbmcsXG5cblx0Y3JlYXRlZF9hdDogc3RyaW5nLFxuXHR1cGRhdGVkX2F0OiBzdHJpbmcsXG5cblx0dGFyZ2V0X2JyYW5jaDogc3RyaW5nLFxuXHRzb3VyY2VfYnJhbmNoOiBzdHJpbmcsXG5cblx0c291cmNlX3Byb2plY3RfaWQ6IG51bWJlcixcblx0dGFyZ2V0X3Byb2plY3RfaWQ6IG51bWJlcixcblxuXHRsYWJlbHM6IHN0cmluZ1tdLFxuXG5cdHdvcmtfaW5fcHJvZ3Jlc3M6IGJvb2xlYW4sXG5cblx0bWVyZ2Vfc3RhdHVzOiBzdHJpbmcsXG5cdG1lcmdlX2Vycm9yOiBhbnksXG5cblx0c3F1YXNoOiBib29sZWFuLFxuXHRjaGFuZ2VzX2NvdW50OiBudW1iZXIsXG5cblx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoOiBib29sZWFuLFxuXG5cdHdlYl91cmw6IHN0cmluZyxcblxuXHRkaWZmX3JlZnM6IHtcblx0XHRiYXNlX3NoYTogc3RyaW5nLFxuXHRcdGhlYWRfc2hhOiBzdHJpbmcsXG5cdFx0c3RhcnRfc2hhOiBzdHJpbmcsXG5cdH0sXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0OiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybilcbntcblx0bGV0IHtcblx0XHRpZCxcblx0XHRpaWQsXG5cdFx0cHJvamVjdF9pZCxcblxuXHRcdHRpdGxlLFxuXHRcdGRlc2NyaXB0aW9uLFxuXG5cdFx0c3RhdGUsXG5cblx0XHRjcmVhdGVkX2F0LFxuXHRcdHVwZGF0ZWRfYXQsXG5cblx0XHR0YXJnZXRfYnJhbmNoLFxuXHRcdHNvdXJjZV9icmFuY2gsXG5cblx0XHR0YXJnZXRfcHJvamVjdF9pZCxcblx0XHRzb3VyY2VfcHJvamVjdF9pZCxcblxuXHRcdGxhYmVscyxcblx0XHR3b3JrX2luX3Byb2dyZXNzLFxuXG5cdFx0bWVyZ2Vfc3RhdHVzLFxuXHRcdG1lcmdlX2Vycm9yLFxuXG5cdFx0c3F1YXNoLFxuXHRcdGNoYW5nZXNfY291bnQsXG5cblx0XHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2gsXG5cblx0XHR3ZWJfdXJsLFxuXG5cdFx0ZGlmZl9yZWZzLFxuXG5cdH0gPSByZXQ7XG5cblx0Lypcblx0Y29uc29sZS5kaXIocmV0LCB7XG5cdFx0ZGVwdGg6IDUsXG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9KTtcblx0Ki9cblxuXHRyZXR1cm4ge1xuXHRcdGlkLFxuXHRcdGlpZCxcblx0XHRwcm9qZWN0X2lkLFxuXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRzdGF0ZSxcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXHRcdHNvdXJjZV9wcm9qZWN0X2lkLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzcXVhc2gsXG5cdFx0Y2hhbmdlc19jb3VudCxcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwaUdpdGxhYigpXG57XG5cdGNvbnNvbGUuaW5mbyhg6YCj5o6lIGFwaWApO1xuXG5cdGxldCBfZW52ID0gX2dldEVudkdpdGxhYigpO1xuXG5cdHRyeVxuXHR7XG5cdFx0Lypcblx0XHRjb25zdCBhcGkgPSBuZXcgUHJvamVjdHNCdW5kbGUoe1xuXHRcdFx0dG9rZW46IF9lbnYuQUNDRVNTX1RPS0VOLFxuXHRcdH0pO1xuXHRcdCovXG5cdFx0Y29uc3QgYXBpID0gbmV3IEdpdGxhYih7XG5cdFx0XHR0b2tlbjogX2Vudi5BQ0NFU1NfVE9LRU4sXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gYXBpO1xuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihg6YCj5o6lIGFwaSDlpLHmlZdgKTtcblx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBiZWNhdXNlIGdpdGxhYiB3aWxsIGF1dG8gZG8gYGNvbnN0IHBJZCA9IGVuY29kZVVSSUNvbXBvbmVudChwcm9qZWN0SWQpO2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0ZXhwZWN0KGFycikuaGF2ZS5sZW5ndGhPZigyKTtcblxuXHRcdHJldHVybiBhcnIuam9pbignLycpO1xuXHR9XG5cblx0ZXhwZWN0KHByb2plY3RJZCkuYSgnbnVtYmVyJyk7XG5cblx0cmV0dXJuIHByb2plY3RJZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IG51bWJlcik6IG51bWJlclxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IHN0cmluZyk6IHN0cmluZ1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0cmV0dXJuIGFyci5qb2luKCclMkYnKTtcblx0fVxuXG5cdGV4cGVjdChwcm9qZWN0SWQpLmEoJ251bWJlcicpO1xuXG5cdHJldHVybiBwcm9qZWN0SWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0RW52R2l0bGFiKClcbntcblx0bGV0IEFDQ0VTU19UT0tFTjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuR0lUTEFCX0FDQ0VTU19UT0tFTiB8fCAnJztcblx0bGV0IFRPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfVE9LRU4gfHwgJyc7XG5cblx0aWYgKCFBQ0NFU1NfVE9LRU4gfHwgIVRPS0VOKVxuXHR7XG5cdFx0bGV0IGVudiA9IGRvdGVudkNvbmZpZyh7IHBhdGg6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJy5lbnYnKSB9KTtcblxuXHRcdGlmIChlbnYucGFyc2VkKVxuXHRcdHtcblx0XHRcdEFDQ0VTU19UT0tFTiA9IEFDQ0VTU19UT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9BQ0NFU1NfVE9LRU47XG5cblx0XHRcdFRPS0VOID0gVE9LRU4gfHwgZW52LnBhcnNlZC5HSVRMQUJfVE9LRU47XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBmb3IgYXBpLiBDYW4gYmUgY3JlYXRlZCBpbiB5b3VyIHByb2ZpbGUuXG5cdFx0ICogaHR0cHM6Ly9naXRsYWIuY29tL3Byb2ZpbGUvcGVyc29uYWxfYWNjZXNzX3Rva2Vuc1xuXHRcdCAqL1xuXHRcdEFDQ0VTU19UT0tFTixcblx0XHQvKipcblx0XHQgKiB1c2VybmFtZTpwYXNzd29yZEBcblx0XHQgKi9cblx0XHRUT0tFTixcblx0fVxufVxuIl19