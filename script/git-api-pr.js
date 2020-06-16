"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPullRequests = void 0;
/**
 * Created by user on 2019/1/26/026.
 */
const gitlab_1 = require("./git/gitlab");
Object.defineProperty(exports, "createPullRequests", { enumerable: true, get: function () { return gitlab_1.createPullRequestsGitlab; } });
exports.default = gitlab_1.createPullRequestsGitlab;
//# sourceMappingURL=git-api-pr.js.map