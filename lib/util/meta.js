"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMdconfMetaByPath = exports.getMdconfMeta = exports.filterIDs = exports.get_idsSync = void 0;
const sort_1 = require("@node-novel/sort");
const fs = require("fs-extra");
const node_novel_info_1 = require("node-novel-info");
const log_1 = require("../log");
const path = require("path");
const FastGlob = require("fast-glob");
const project_config_1 = require("../../project.config");
const util_1 = require("@node-novel/cache-loader/lib/util");
const metaMap = new Map();
function get_idsSync(rootPath) {
    return FastGlob.sync([
        '*',
        '!docs',
        '!.*',
        '!*.raw',
        '!raw',
    ], {
        deep: 1,
        onlyDirectories: true,
        markDirectories: false,
        cwd: rootPath,
    });
}
exports.get_idsSync = get_idsSync;
function filterIDs(rootPath) {
    let memo = get_idsSync(rootPath)
        .sort(function (a, b) {
        if (a.replace(/_out$/, '') === b.replace(/_out$/, '')) {
            if (/_out$/.test(a)) {
                return 1;
            }
            else {
                return -1;
            }
        }
        return sort_1.naturalCompare(a, b);
    })
        .reduce(function (memo, pathMain) {
        let _m = pathMain.match(/^(.+?)(_out)?$/);
        let is_out = !!_m[2];
        let pathMain_base = _m[1];
        memo[pathMain_base] = memo[pathMain_base] || {};
        FastGlob.sync([
            '*/README.md',
        ], {
            cwd: path.join(rootPath, pathMain),
        })
            .sort(util_1.cacheSortCallback)
            .forEach(function (p) {
            let novelID = path.basename(path.dirname(p));
            memo[pathMain_base][novelID] = {
                pathMain,
                novelID,
            };
        });
        if (!Object.keys(memo[pathMain_base]).length) {
            delete memo[pathMain_base];
        }
        return memo;
    }, {});
    let list = [];
    Object.values(memo)
        .forEach(function (ls) {
        Object.values(ls)
            .forEach(function ({ pathMain, novelID, }) {
            list.push({
                pathMain,
                novelID,
            });
        });
    });
    return list;
}
exports.filterIDs = filterIDs;
function getMdconfMeta(pathMain, novelID, reload) {
    let basePath = path.join(project_config_1.default.novel_root, pathMain, novelID);
    return getMdconfMetaByPath(basePath, reload);
}
exports.getMdconfMeta = getMdconfMeta;
function getMdconfMetaByPath(basePath, reload) {
    if (!reload && metaMap.has(basePath)) {
        return metaMap.get(basePath);
    }
    let meta;
    try {
        let data = fs.readFileSync(path.join(basePath, 'README.md'));
        meta = node_novel_info_1.mdconf_parse(data, {
            throw: false,
        });
        meta = node_novel_info_1.chkInfo(meta);
    }
    catch (e) {
        log_1.default.error(e);
        meta = null;
    }
    metaMap.set(basePath, meta);
    return meta;
}
exports.getMdconfMetaByPath = getMdconfMetaByPath;
//# sourceMappingURL=meta.js.map