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
async function createPullRequests() {
    console.log(`嘗試建立 PR`);
    let GITEE_ACCESS_TOKEN = process.env.GITEE_ACCESS_TOKEN || '';
    let GITEE_CLIENT_ID = process.env.GITEE_CLIENT_ID || '';
    let GITEE_CLIENT_SECRET = process.env.GITEE_CLIENT_SECRET || '';
    if (!GITEE_ACCESS_TOKEN || !GITEE_CLIENT_ID || !GITEE_CLIENT_SECRET) {
        let env = dotenv_1.config({ path: path.join(project_config_1.default.project_root, '.env') });
        if (env.parsed) {
            GITEE_ACCESS_TOKEN = GITEE_ACCESS_TOKEN || env.parsed.GITEE_ACCESS_TOKEN;
            GITEE_CLIENT_ID = GITEE_CLIENT_ID || env.parsed.GITEE_CLIENT_ID;
            GITEE_CLIENT_SECRET = GITEE_CLIENT_SECRET || env.parsed.GITEE_CLIENT_SECRET;
        }
    }
    let token = await gitee_api_token_1.default({
        access_token: GITEE_ACCESS_TOKEN,
        clientId: GITEE_CLIENT_ID,
        clientSecret: GITEE_CLIENT_SECRET,
        scopes: 'pull_requests',
    }).catch(function (err) {
        console.error(err);
    });
    if (!token) {
        console.error(`無法取得 token`);
        return;
    }
    let rq = new client_oauth2_request_1.default(token, {
        apiRoot: 'https://gitee.com/api/'
    });
    let br_name = git_1.currentBranchName(project_config_1.novel_root);
    if (!br_name.match(/^auto\//)) {
        console.error(`目前分支為 ${br_name} 忽略建立 PR`);
        return;
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
        .then(function (ret) {
        console.log(`成功建立 PR`);
        console.dir(ret);
    })
        .catch(function (err) {
        console.error(err.toString());
        console.error(err.code, err.status, err.body);
    });
}
exports.createPullRequests = createPullRequests;
exports.default = createPullRequests;
