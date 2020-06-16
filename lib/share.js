"use strict";
/**
 * Created by user on 2018/12/6/006.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkShareStatesNotExists = exports.shareStates = exports.EnumShareStates = void 0;
const project_config_1 = require("../project.config");
const log_1 = require("../lib/log");
const fs_extra_1 = require("fs-extra");
const upath2_1 = require("upath2");
var EnumShareStates;
(function (EnumShareStates) {
    EnumShareStates["WAIT_CREATE_GIT"] = ".wait_create_git";
})(EnumShareStates = exports.EnumShareStates || (exports.EnumShareStates = {}));
function shareStates(name) {
    const file = upath2_1.resolve(project_config_1.default.cache_root, name);
    const data = {
        name,
        file,
        exists() {
            return fs_extra_1.pathExistsSync(file);
        },
        ensure() {
            return fs_extra_1.ensureFileSync(file);
        },
        remove() {
            return fs_extra_1.removeSync(file);
        },
    };
    return data;
}
exports.shareStates = shareStates;
function checkShareStatesNotExists(list) {
    let name;
    let bool = list.some(_name => {
        let bool = shareStates(_name).exists();
        if (bool) {
            log_1.default.error(_name, `should not exists`);
            name = _name;
        }
        return bool;
    });
    if (bool) {
        log_1.default.error('[process.exit]', name, `should not exists`);
        process.exit();
    }
    return !bool;
}
exports.checkShareStatesNotExists = checkShareStatesNotExists;
//# sourceMappingURL=share.js.map