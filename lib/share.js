"use strict";
/**
 * Created by user on 2018/12/6/006.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const project_config_1 = require("../project.config");
const path = require("upath2");
const fs = require("fs-extra");
const log_1 = require("../lib/log");
var EnumShareStates;
(function (EnumShareStates) {
    EnumShareStates["WAIT_CREATE_GIT"] = ".wait_create_git";
})(EnumShareStates = exports.EnumShareStates || (exports.EnumShareStates = {}));
function shareStates(name) {
    const file = path.resolve(project_config_1.default.cache_root, name);
    const data = {
        name,
        file,
        exists() {
            return fs.pathExistsSync(file);
        },
        ensure() {
            return fs.ensureFileSync(file);
        },
        remove() {
            return fs.removeSync(file);
        },
    };
    return data;
}
exports.shareStates = shareStates;
function checkShareStatesNotExists(list) {
    let bool = list.some(name => {
        let bool = shareStates(name).exists();
        log_1.default.error(name, `should not exists`);
        return bool;
    });
    return !bool;
}
exports.checkShareStatesNotExists = checkShareStatesNotExists;
