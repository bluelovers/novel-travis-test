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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0bGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0bGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxnQ0FBMkM7QUFDM0MseURBQWlFO0FBQ2pFLG1DQUFnRDtBQUNoRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLHFDQUFzQztBQUV0QyxtQ0FBZ0Q7QUFFaEQsK0JBQThCO0FBRTlCLFNBQWdCLHdCQUF3QjtJQUV2QyxhQUFhO0lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFO1NBQ3ZCLElBQUksQ0FBQyxLQUFLO1FBRVYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QixJQUFJLE9BQU8sR0FBRyx1QkFBaUIsQ0FBQywyQkFBVSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQzdCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLE9BQU8sVUFBVSxDQUFDLENBQUM7WUFFMUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUVELElBQUksRUFBRSxHQUFHO1lBQ1I7Z0JBQ0MsZUFBZTtnQkFDZixFQUFFLEVBQUUsUUFBUTtnQkFDWixFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUU7YUFDaEI7WUFDRDtnQkFDQyxlQUFlO2dCQUNmLEVBQUUsRUFBRSxRQUFRO2dCQUNaLEVBQUUsRUFBRSxRQUFRO2FBQ1o7U0FDRCxDQUFDO1FBRUYsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFM0IsTUFBTSxHQUFHLEdBQUcsU0FBUyxFQUFFLENBQUM7UUFFeEIsSUFBSSxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUUzQyxJQUFJLFlBQVksR0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3JDLElBQUksWUFBWSxHQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFekMsa0RBQWtEO1FBRS9DLElBQUksaUJBQWlCLEdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUUzQyxJQUFJLEtBQUssR0FBVyxZQUFZLE9BQU8sR0FBRyxDQUFDO1FBRTNDLGFBQWE7UUFDYixPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUU7YUFDdkIsSUFBSSxDQUFDO1lBRUwsT0FBUSxHQUFHLENBQUMsYUFBMkMsQ0FBQyxNQUFNLENBQzdELFNBQVMsRUFDVCxZQUFZLEVBQ1osWUFBWSxFQUNaLEtBQUssRUFDTDtnQkFDQyxvQkFBb0IsRUFBRSxJQUFJO2dCQUMxQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix3QkFBd0IsRUFBRSxJQUFJO2dCQUM5Qjs7OztrQkFJRTtnQkFFRixpQkFBaUI7YUFHakIsQ0FDRCxDQUFBO1FBQ0YsQ0FBQyxDQUFDO2FBQ0QsR0FBRyxDQUFDLFVBQVUsR0FBcUM7WUFFbkQsSUFBSSxJQUFJLEdBQUcscUNBQXFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxrQkFBa0IsRUFDekU7Z0JBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3JELGFBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3RCO2lCQUVEO2dCQUNDLGFBQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RCxhQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xCO1FBQ0YsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLFVBQVUsR0FBb0M7WUFFcEQsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBRXhCLElBQUksR0FBRyxDQUFDLElBQUksRUFDWjtnQkFDQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxFQUMxSDtvQkFDQyxXQUFXLEdBQUcsSUFBSSxDQUFDO29CQUVuQixhQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7aUJBQzFDO2FBQ0Q7WUFFRCxtQkFBbUI7WUFFbkIsSUFBSSxXQUFXLEVBQ2Y7Z0JBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDN0IsYUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEI7aUJBRUQ7Z0JBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDMUIsYUFBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDOUIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzFCO1lBRUQsT0FBTyxHQUFHLENBQUE7UUFDWCxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDYjtJQUNILENBQUMsQ0FBQyxDQUNGO0FBQ0YsQ0FBQztBQTVIRCw0REE0SEM7QUFFRCxrQkFBZSx3QkFBd0IsQ0FBQztBQXdEeEMsU0FBZ0IscUNBQXFDLENBQUMsR0FBcUM7SUFFMUYsSUFBSSxFQUNILEVBQUUsRUFDRixHQUFHLEVBQ0gsVUFBVSxFQUVWLEtBQUssRUFDTCxXQUFXLEVBRVgsS0FBSyxFQUVMLFVBQVUsRUFDVixVQUFVLEVBRVYsYUFBYSxFQUNiLGFBQWEsRUFFYixpQkFBaUIsRUFDakIsaUJBQWlCLEVBRWpCLE1BQU0sRUFDTixnQkFBZ0IsRUFFaEIsWUFBWSxFQUNaLFdBQVcsRUFFWCxNQUFNLEVBQ04sYUFBYSxFQUViLDJCQUEyQixFQUUzQixPQUFPLEVBRVAsU0FBUyxHQUVULEdBQUcsR0FBRyxDQUFDO0lBRVI7Ozs7O01BS0U7SUFFRixPQUFPO1FBQ04sRUFBRTtRQUNGLEdBQUc7UUFDSCxVQUFVO1FBRVYsS0FBSztRQUNMLFdBQVc7UUFFWCxLQUFLO1FBRUwsVUFBVTtRQUNWLFVBQVU7UUFFVixhQUFhO1FBQ2IsYUFBYTtRQUViLGlCQUFpQjtRQUNqQixpQkFBaUI7UUFFakIsTUFBTTtRQUNOLGdCQUFnQjtRQUVoQixZQUFZO1FBQ1osV0FBVztRQUVYLE1BQU07UUFDTixhQUFhO1FBRWIsMkJBQTJCO1FBRTNCLE9BQU87UUFFUCxTQUFTO0tBQ1QsQ0FBQTtBQUNGLENBQUM7QUEvRUQsc0ZBK0VDO0FBRUQsU0FBZ0IsU0FBUztJQUV4QixhQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXZCLElBQUksSUFBSSxHQUFHLGFBQWEsRUFBRSxDQUFDO0lBRTNCLElBQ0E7UUFDQzs7OztVQUlFO1FBQ0YsTUFBTSxHQUFHLEdBQUcsSUFBSSxlQUFNLENBQUM7WUFDdEIsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZO1NBQ3hCLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxDQUFDO0tBQ1g7SUFDRCxPQUFPLENBQUMsRUFDUjtRQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0IsYUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDekI7QUFDRixDQUFDO0FBeEJELDhCQXdCQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLFNBQW9CO0lBRW5ELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUNqQztRQUNDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFDM0I7WUFDQyxPQUFPLFNBQVMsQ0FBQztTQUNqQjtRQUVELElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFcEMsYUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFN0IsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3JCO0lBRUQsYUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5QixPQUFPLFNBQVMsQ0FBQztBQUNsQixDQUFDO0FBbkJELDBDQW1CQztBQUtELFNBQWdCLGVBQWUsQ0FBQyxTQUFvQjtJQUVuRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFDakM7UUFDQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQzNCO1lBQ0MsT0FBTyxTQUFTLENBQUM7U0FDakI7UUFFRCxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXBDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN2QjtJQUVELGFBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFOUIsT0FBTyxTQUFTLENBQUM7QUFDbEIsQ0FBQztBQWpCRCwwQ0FpQkM7QUFFRCxTQUFnQixhQUFhO0lBRTVCLElBQUksWUFBWSxHQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRSxDQUFDO0lBQ2pFLElBQUksS0FBSyxHQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztJQUVuRCxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsS0FBSyxFQUMzQjtRQUNDLElBQUksR0FBRyxHQUFHLGVBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVoRixJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQ2Q7WUFDQyxZQUFZLEdBQUcsWUFBWSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUM7WUFFOUQsS0FBSyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztTQUN6QztLQUNEO0lBRUQsT0FBTztRQUNOOzs7V0FHRztRQUNILFlBQVk7UUFDWjs7V0FFRztRQUNILEtBQUs7S0FDTCxDQUFBO0FBQ0YsQ0FBQztBQTVCRCxzQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzEvMjYvMDI2LlxuICovXG5cbmltcG9ydCB7IFByb2plY3RJZCB9IGZyb20gJ2dpdGxhYi90eXBlcy90eXBlcyc7XG5pbXBvcnQgeyBjdXJyZW50QnJhbmNoTmFtZSB9IGZyb20gJy4uL2dpdCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZywgeyBub3ZlbF9yb290IH0gZnJvbSAnLi4vLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgY29uZmlnIGFzIGRvdGVudkNvbmZpZyB9IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vLi4vbGliL2xvZyc7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuXG5pbXBvcnQgeyBHaXRsYWIsIFByb2plY3RzQnVuZGxlIH0gZnJvbSAnZ2l0bGFiJztcbmltcG9ydCAqIGFzIEFQSVNlcnZpY2VzIGZyb20gJ2dpdGxhYi9kaXN0L3NlcnZpY2VzJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHVsbFJlcXVlc3RzR2l0bGFiKCk6IEJsdWViaXJkPElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlUmV0dXJuPlxue1xuXHQvLyBAdHMtaWdub3JlXG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcblx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuaW5mbyhg5ZiX6Kmm5bu656uLIFBSYCk7XG5cblx0XHRcdGxldCBicl9uYW1lID0gY3VycmVudEJyYW5jaE5hbWUobm92ZWxfcm9vdCk7XG5cblx0XHRcdGlmICghYnJfbmFtZS5tYXRjaCgvXmF1dG9cXC8vKSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihg55uu5YmN5YiG5pSv54K6ICR7YnJfbmFtZX0g5b+955Wl5bu656uLIFBSYCk7XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmluZm8oYOebruWJjeWIhuaUr+eCuiAke2JyX25hbWV9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBfcCA9IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vaWQ6IDEwNTM5MjI3LFxuXHRcdFx0XHRcdGlkOiAxMDU1MzQ5NCxcblx0XHRcdFx0XHRicjogYCR7YnJfbmFtZX1gLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9pZDogMTA1MzgyNDAsXG5cdFx0XHRcdFx0aWQ6IDEwNTQ4NTkxLFxuXHRcdFx0XHRcdGJyOiBgbWFzdGVyYCxcblx0XHRcdFx0fSxcblx0XHRcdF07XG5cblx0XHRcdGxldCBfaSA9IDA7XG5cdFx0XHRsZXQgX2lqID0gTWF0aC5hYnMoX2kgLSAxKTtcblxuXHRcdFx0Y29uc3QgYXBpID0gYXBpR2l0bGFiKCk7XG5cblx0XHRcdGxldCBwcm9qZWN0SWQgPSBkZWNvZGVQcm9qZWN0SWQoX3BbX2ldLmlkKTtcblxuXHRcdFx0bGV0IHNvdXJjZUJyYW5jaDogc3RyaW5nID0gX3BbX2ldLmJyO1xuXHRcdFx0bGV0IHRhcmdldEJyYW5jaDogc3RyaW5nID0gX3BbX2lqXS5icjtcblxuLy9cdFx0XHRzb3VyY2VCcmFuY2ggPSBlbmNvZGVQcm9qZWN0SWQoc291cmNlQnJhbmNoKTtcblxuXHRcdFx0bGV0IHRhcmdldF9wcm9qZWN0X2lkOiBudW1iZXIgPSBfcFtfaWpdLmlkO1xuXG5cdFx0XHRsZXQgdGl0bGU6IHN0cmluZyA9IGBhdXRvIHByICgke2JyX25hbWV9KWA7XG5cblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiAoYXBpLk1lcmdlUmVxdWVzdHMgYXMgQVBJU2VydmljZXMuTWVyZ2VSZXF1ZXN0cykuY3JlYXRlKFxuXHRcdFx0XHRcdFx0cHJvamVjdElkLFxuXHRcdFx0XHRcdFx0c291cmNlQnJhbmNoLFxuXHRcdFx0XHRcdFx0dGFyZ2V0QnJhbmNoLFxuXHRcdFx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJlbW92ZV9zb3VyY2VfYnJhbmNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGxvd19jb2xsYWJvcmF0aW9uOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGxvd19tYWludGFpbmVyX3RvX3B1c2g6IHRydWUsXG5cdFx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRcdGxhYmVsczogW1xuXG5cdFx0XHRcdFx0XHRcdF0uam9pbignLCcpLFxuXHRcdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXG5cdFx0XHRcdFx0XHRcdC8vc3F1YXNoOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50YXAoZnVuY3Rpb24gKHJldDogSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4pXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgZGF0YSA9IGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0KTtcblxuXHRcdFx0XHRcdGlmICghZGF0YS5tZXJnZV9zdGF0dXMgfHwgU3RyaW5nKGRhdGEubWVyZ2Vfc3RhdHVzKSA9PSAnY2Fubm90X2JlX21lcmdlZCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihg5bu656uLIFBSIOWkseaVlyAjJHtkYXRhLmlpZH0gJHtkYXRhLnRpdGxlfWApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5yZWQuZGlyKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGDmiJDlip/lu7rnq4sgUFIgIyR7ZGF0YS5paWR9ICR7ZGF0YS50aXRsZX1gKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlcnI6IElHaXRsYWJNZXJnZVJlcXVlc3RzQ3JlYXRlRXJyb3IpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgX2tub3dfZXJyb3IgPSBmYWxzZTtcblxuXHRcdFx0XHRcdGlmIChlcnIuYm9keSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAoZXJyLmJvZHkubWVzc2FnZSAmJiBTdHJpbmcoZXJyLmJvZHkubWVzc2FnZSkubWF0Y2goL0Fub3RoZXIgb3BlbiBtZXJnZSByZXF1ZXN0IGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIHNvdXJjZSBicmFuY2gvKSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0X2tub3dfZXJyb3IgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhg5pys5qyh5L2/55So55qE5YiG5pSv5bey57aT5bu656uL6YGOIFBS77yM54Sh6aCI5Zyo5oSP5q2k6Yyv6Kqk6KiK5oGvYCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmRpcihlcnIpO1xuXG5cdFx0XHRcdFx0aWYgKF9rbm93X2Vycm9yKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhlcnIudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmRpcihlcnIuYm9keSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGDlu7rnq4sgUFIg5aSx5pWXYCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVyci50b1N0cmluZygpKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUucmVkLmRpcihlcnIuYm9keSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGVyclxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZSA9PiBlKVxuXHRcdFx0XHQ7XG5cdFx0fSlcblx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVQdWxsUmVxdWVzdHNHaXRsYWI7XG5cbnR5cGUgSFRUUEVycm9yID0gRXJyb3JcblxuZXhwb3J0IHR5cGUgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVFcnJvciA9IEhUVFBFcnJvciAmIHtcblxuXHRzdGF0dXNDb2RlOiBudW1iZXIsXG5cdHN0YXR1c01lc3NhZ2U6IG51bWJlcixcblxuXHRib2R5OiB7XG5cdFx0bWVzc2FnZTogc3RyaW5nW10sXG5cdH0sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm5cbntcblx0aWQ6IG51bWJlcixcblx0aWlkOiBudW1iZXIsXG5cdHByb2plY3RfaWQ6IG51bWJlcixcblxuXHRzdGF0ZTogc3RyaW5nLFxuXG5cdHRpdGxlOiBzdHJpbmcsXG5cdGRlc2NyaXB0aW9uOiBzdHJpbmcsXG5cblx0Y3JlYXRlZF9hdDogc3RyaW5nLFxuXHR1cGRhdGVkX2F0OiBzdHJpbmcsXG5cblx0dGFyZ2V0X2JyYW5jaDogc3RyaW5nLFxuXHRzb3VyY2VfYnJhbmNoOiBzdHJpbmcsXG5cblx0c291cmNlX3Byb2plY3RfaWQ6IG51bWJlcixcblx0dGFyZ2V0X3Byb2plY3RfaWQ6IG51bWJlcixcblxuXHRsYWJlbHM6IHN0cmluZ1tdLFxuXG5cdHdvcmtfaW5fcHJvZ3Jlc3M6IGJvb2xlYW4sXG5cblx0bWVyZ2Vfc3RhdHVzOiBzdHJpbmcsXG5cdG1lcmdlX2Vycm9yOiBhbnksXG5cblx0c3F1YXNoOiBib29sZWFuLFxuXHRjaGFuZ2VzX2NvdW50OiBudW1iZXIsXG5cblx0c2hvdWxkX3JlbW92ZV9zb3VyY2VfYnJhbmNoOiBib29sZWFuLFxuXG5cdHdlYl91cmw6IHN0cmluZyxcblxuXHRkaWZmX3JlZnM6IHtcblx0XHRiYXNlX3NoYTogc3RyaW5nLFxuXHRcdGhlYWRfc2hhOiBzdHJpbmcsXG5cdFx0c3RhcnRfc2hhOiBzdHJpbmcsXG5cdH0sXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckdpdGxhYk1lcmdlUmVxdWVzdHNDcmVhdGVSZXR1cm4ocmV0OiBJR2l0bGFiTWVyZ2VSZXF1ZXN0c0NyZWF0ZVJldHVybilcbntcblx0bGV0IHtcblx0XHRpZCxcblx0XHRpaWQsXG5cdFx0cHJvamVjdF9pZCxcblxuXHRcdHRpdGxlLFxuXHRcdGRlc2NyaXB0aW9uLFxuXG5cdFx0c3RhdGUsXG5cblx0XHRjcmVhdGVkX2F0LFxuXHRcdHVwZGF0ZWRfYXQsXG5cblx0XHR0YXJnZXRfYnJhbmNoLFxuXHRcdHNvdXJjZV9icmFuY2gsXG5cblx0XHR0YXJnZXRfcHJvamVjdF9pZCxcblx0XHRzb3VyY2VfcHJvamVjdF9pZCxcblxuXHRcdGxhYmVscyxcblx0XHR3b3JrX2luX3Byb2dyZXNzLFxuXG5cdFx0bWVyZ2Vfc3RhdHVzLFxuXHRcdG1lcmdlX2Vycm9yLFxuXG5cdFx0c3F1YXNoLFxuXHRcdGNoYW5nZXNfY291bnQsXG5cblx0XHRzaG91bGRfcmVtb3ZlX3NvdXJjZV9icmFuY2gsXG5cblx0XHR3ZWJfdXJsLFxuXG5cdFx0ZGlmZl9yZWZzLFxuXG5cdH0gPSByZXQ7XG5cblx0Lypcblx0Y29uc29sZS5kaXIocmV0LCB7XG5cdFx0ZGVwdGg6IDUsXG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9KTtcblx0Ki9cblxuXHRyZXR1cm4ge1xuXHRcdGlkLFxuXHRcdGlpZCxcblx0XHRwcm9qZWN0X2lkLFxuXG5cdFx0dGl0bGUsXG5cdFx0ZGVzY3JpcHRpb24sXG5cblx0XHRzdGF0ZSxcblxuXHRcdGNyZWF0ZWRfYXQsXG5cdFx0dXBkYXRlZF9hdCxcblxuXHRcdHRhcmdldF9icmFuY2gsXG5cdFx0c291cmNlX2JyYW5jaCxcblxuXHRcdHRhcmdldF9wcm9qZWN0X2lkLFxuXHRcdHNvdXJjZV9wcm9qZWN0X2lkLFxuXG5cdFx0bGFiZWxzLFxuXHRcdHdvcmtfaW5fcHJvZ3Jlc3MsXG5cblx0XHRtZXJnZV9zdGF0dXMsXG5cdFx0bWVyZ2VfZXJyb3IsXG5cblx0XHRzcXVhc2gsXG5cdFx0Y2hhbmdlc19jb3VudCxcblxuXHRcdHNob3VsZF9yZW1vdmVfc291cmNlX2JyYW5jaCxcblxuXHRcdHdlYl91cmwsXG5cblx0XHRkaWZmX3JlZnMsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwaUdpdGxhYigpXG57XG5cdGNvbnNvbGUuaW5mbyhg6YCj5o6lIGFwaWApO1xuXG5cdGxldCBfZW52ID0gX2dldEVudkdpdGxhYigpO1xuXG5cdHRyeVxuXHR7XG5cdFx0Lypcblx0XHRjb25zdCBhcGkgPSBuZXcgUHJvamVjdHNCdW5kbGUoe1xuXHRcdFx0dG9rZW46IF9lbnYuQUNDRVNTX1RPS0VOLFxuXHRcdH0pO1xuXHRcdCovXG5cdFx0Y29uc3QgYXBpID0gbmV3IEdpdGxhYih7XG5cdFx0XHR0b2tlbjogX2Vudi5BQ0NFU1NfVE9LRU4sXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gYXBpO1xuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihg6YCj5o6lIGFwaSDlpLHmlZdgKTtcblx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBiZWNhdXNlIGdpdGxhYiB3aWxsIGF1dG8gZG8gYGNvbnN0IHBJZCA9IGVuY29kZVVSSUNvbXBvbmVudChwcm9qZWN0SWQpO2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0ZXhwZWN0KGFycikuaGF2ZS5sZW5ndGhPZigyKTtcblxuXHRcdHJldHVybiBhcnIuam9pbignLycpO1xuXHR9XG5cblx0ZXhwZWN0KHByb2plY3RJZCkuYSgnbnVtYmVyJyk7XG5cblx0cmV0dXJuIHByb2plY3RJZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IG51bWJlcik6IG51bWJlclxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IHN0cmluZyk6IHN0cmluZ1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVByb2plY3RJZChwcm9qZWN0SWQ6IFByb2plY3RJZCk6IFByb2plY3RJZFxue1xuXHRpZiAodHlwZW9mIHByb2plY3RJZCA9PT0gJ3N0cmluZycpXG5cdHtcblx0XHRpZiAoL15cXGQrJC8udGVzdChwcm9qZWN0SWQpKVxuXHRcdHtcblx0XHRcdHJldHVybiBwcm9qZWN0SWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGFyciA9IHByb2plY3RJZC5zcGxpdCgvJTJGfFxcLy8pO1xuXG5cdFx0cmV0dXJuIGFyci5qb2luKCclMkYnKTtcblx0fVxuXG5cdGV4cGVjdChwcm9qZWN0SWQpLmEoJ251bWJlcicpO1xuXG5cdHJldHVybiBwcm9qZWN0SWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0RW52R2l0bGFiKClcbntcblx0bGV0IEFDQ0VTU19UT0tFTjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuR0lUTEFCX0FDQ0VTU19UT0tFTiB8fCAnJztcblx0bGV0IFRPS0VOOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5HSVRMQUJfVE9LRU4gfHwgJyc7XG5cblx0aWYgKCFBQ0NFU1NfVE9LRU4gfHwgIVRPS0VOKVxuXHR7XG5cdFx0bGV0IGVudiA9IGRvdGVudkNvbmZpZyh7IHBhdGg6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJy5lbnYnKSB9KTtcblxuXHRcdGlmIChlbnYucGFyc2VkKVxuXHRcdHtcblx0XHRcdEFDQ0VTU19UT0tFTiA9IEFDQ0VTU19UT0tFTiB8fCBlbnYucGFyc2VkLkdJVExBQl9BQ0NFU1NfVE9LRU47XG5cblx0XHRcdFRPS0VOID0gVE9LRU4gfHwgZW52LnBhcnNlZC5HSVRMQUJfVE9LRU47XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBmb3IgYXBpLiBDYW4gYmUgY3JlYXRlZCBpbiB5b3VyIHByb2ZpbGUuXG5cdFx0ICogaHR0cHM6Ly9naXRsYWIuY29tL3Byb2ZpbGUvcGVyc29uYWxfYWNjZXNzX3Rva2Vuc1xuXHRcdCAqL1xuXHRcdEFDQ0VTU19UT0tFTixcblx0XHQvKipcblx0XHQgKiB1c2VybmFtZTpwYXNzd29yZEBcblx0XHQgKi9cblx0XHRUT0tFTixcblx0fVxufVxuIl19