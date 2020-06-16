"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPushUrlGitee = exports.getPushUrl = exports.branchNameToDate = void 0;
const git_1 = require("../git");
const token_1 = require("./token");
const moment = require("moment");
function branchNameToDate(br_name) {
    return moment(br_name.replace(/^.*auto\//, ''), git_1.DATE_FORMAT);
}
exports.branchNameToDate = branchNameToDate;
function getPushUrl(url, login_token) {
    if (login_token && !/@$/.test(login_token)) {
        login_token += '@';
    }
    return `https://${login_token ? login_token : ''}${url}`;
}
exports.getPushUrl = getPushUrl;
function getPushUrlGitee(url, login_token = token_1.GIT_TOKEN) {
    return getPushUrl(url, login_token);
}
exports.getPushUrlGitee = getPushUrlGitee;
//# sourceMappingURL=util.js.map