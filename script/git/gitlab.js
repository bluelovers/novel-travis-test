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
//# sourceMappingURL=gitlab.js.map