"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../project.config");
const path = require("upath2");
const index_1 = require("@node-novel/task/lib/index");
const array_hyper_unique_1 = require("array-hyper-unique");
const log_1 = require("../lib/log");
async function cacheDiffNovelList(data) {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let ls = [];
    if (0 && fs.existsSync(jsonfile)) {
        ls = await fs.readJSON(jsonfile);
    }
    Object.keys(data.list)
        .forEach(function (pathMain) {
        if (pathMain.match(/^\./) || ['docs'].includes(pathMain)) {
            log_1.default.grey('[SKIP (cacheDiffNovelList)]', pathMain, Object.keys(data.list[pathMain]));
            return;
        }
        Object.keys(data.list[pathMain]).forEach(function (novelID) {
            let arr = data.list[pathMain][novelID].filter(function (v) {
                let basename = v.basename || path.basename(v.fullpath);
                let ext = path.extname(v.basename);
                if (ext == '.md' && /readme/i.test(v.fullpath)) {
                    return true;
                }
                return ext == '.txt';
            });
            if (arr.length) {
                log_1.default.ok('[CACHE (cacheDiffNovelList)]', pathMain, novelID, data.list[pathMain][novelID].length, arr.length);
                ls.push({ pathMain, novelID });
            }
            else {
                log_1.default.gray('[SKIP (cacheDiffNovelList)]', pathMain, novelID, data.list[pathMain][novelID].length);
            }
            //console.log(data.list[pathMain][novelID]);
        });
    });
    ls = array_hyper_unique_1.array_unique(ls.filter(v => v));
    fs.outputJSONSync(jsonfile, ls, {
        spaces: '\t',
    });
    return ls;
}
exports.cacheDiffNovelList = cacheDiffNovelList;
async function cacheFileList(data) {
    if (data.pathMain.match(/_out$|^\./) || ['docs'].includes(data.pathMain)) {
        log_1.default.grey('[CACHE (cacheFileList)]', 'SKIP: ', data.pathMain, data.novelID);
        return;
    }
    let dir = path.join(project_config_1.default.cache_root, 'files', data.pathMain);
    let file = path.join(dir, data.novelID + '.json');
    await fs.ensureDir(dir);
    let ls = [];
    if (fs.existsSync(file)) {
        ls = await fs.readJSON(file);
    }
    ls = ls
        .concat(index_1.filterNotDelete(data).map(function (b) {
        return b.subpath;
    }))
        .filter(function (v) {
        let basename = path.basename(v);
        let ext = path.extname(basename);
        if (ext == '.md' && /readme/i.test(basename)) {
            return true;
        }
        return ext == '.txt';
    });
    ls = array_hyper_unique_1.array_unique(ls);
    log_1.default.ok('[CACHE (cacheFileList)]', path.join(data.pathMain, data.novelID + '.json'), ls.length);
    await fs.outputJSON(file, ls, {
        spaces: '\t',
    });
    return ls;
}
exports.cacheFileList = cacheFileList;
