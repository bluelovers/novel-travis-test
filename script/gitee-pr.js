"use strict";
/**
 * Created by user on 2018/5/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const gitee_api_token_1 = require("gitee-api-token");
const client_oauth2_request_1 = require("client-oauth2-request");
const git_1 = require("./git");
const project_config_1 = require("../project.config");
const dotenv_1 = require("dotenv");
const path = require("upath2");
const log_1 = require("../lib/log");
async function createPullRequests() {
    log_1.default.info(`嘗試建立 PR`);
    let GITEE_ACCESS_TOKEN = process.env.GITEE_ACCESS_TOKEN || '';
    let GITEE_CLIENT_ID = process.env.GITEE_CLIENT_ID || '';
    let GITEE_CLIENT_SECRET = process.env.GITEE_CLIENT_SECRET || '';
    let GITEE_TOKEN1 = process.env.GITEE_TOKEN1 || '';
    let GITEE_TOKEN2 = process.env.GITEE_TOKEN2 || '';
    if (!GITEE_ACCESS_TOKEN || !GITEE_CLIENT_ID || !GITEE_CLIENT_SECRET) {
        let env = dotenv_1.config({ path: path.join(project_config_1.default.project_root, '.env') });
        if (env.parsed) {
            GITEE_ACCESS_TOKEN = GITEE_ACCESS_TOKEN || env.parsed.GITEE_ACCESS_TOKEN;
            GITEE_CLIENT_ID = GITEE_CLIENT_ID || env.parsed.GITEE_CLIENT_ID;
            GITEE_CLIENT_SECRET = GITEE_CLIENT_SECRET || env.parsed.GITEE_CLIENT_SECRET;
            GITEE_TOKEN1 = GITEE_TOKEN1 || env.parsed.GITEE_TOKEN1;
            GITEE_TOKEN2 = GITEE_TOKEN2 || env.parsed.GITEE_TOKEN2;
        }
    }
    let token = await gitee_api_token_1.default({
        //access_token: GITEE_ACCESS_TOKEN,
        username: GITEE_TOKEN1,
        password: GITEE_TOKEN2,
        clientId: GITEE_CLIENT_ID,
        clientSecret: GITEE_CLIENT_SECRET,
        scopes: 'pull_requests',
    }).catch(function (err) {
        log_1.default.error(err);
    });
    if (!token) {
        log_1.default.error(`無法取得 token`);
        return;
    }
    else {
        log_1.default.info(`已取得 token`);
    }
    let rq = new client_oauth2_request_1.default(token, {
        apiRoot: 'https://gitee.com/api/'
    });
    let br_name = git_1.currentBranchName(project_config_1.novel_root);
    if (!br_name.match(/^auto\//)) {
        log_1.default.error(`目前分支為 ${br_name} 忽略建立 PR`);
        return;
    }
    else {
        log_1.default.info(`目前分支為 ${br_name}`);
    }
    await rq
        .fetchSign('/v5/repos/bluelovers/novel/pulls', {
        method: 'POST',
        body: {
            title: br_name,
            head: `demogitee:${br_name}`,
            base: 'master',
            body: 'auto pr',
        },
    })
        .tap(function (ret) {
        log_1.default.success(`成功建立 PR #${ret.number} ${ret.title}`);
        //console.dir(ret);
    })
        .catch(function (err) {
        log_1.default.error(err.toString());
        log_1.default.error(err.code, err.status, err.body);
    });
}
exports.createPullRequests = createPullRequests;
exports.default = createPullRequests;
