"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../project.config");
const path = require("upath2");
const index_1 = require("@node-novel/task/lib/index");
const arrayUniq = require("arr-unique");
async function cacheDiffNovelList(data) {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let ls = [];
    if (0 && fs.existsSync(jsonfile)) {
        ls = await fs.readJSON(jsonfile);
    }
    Object.keys(data.list)
        .forEach(function (pathMain) {
        if (pathMain.match(/^\./) || ['docs'].includes(pathMain)) {
            console.log('[SKIP (cacheDiffNovelList)]', pathMain, Object.keys(data.list[pathMain]));
            return;
        }
        Object.keys(data.list[pathMain]).forEach(function (novelID) {
            console.log('[CACHE (cacheDiffNovelList)]', pathMain, novelID, data.list[pathMain][novelID].length);
            ls.push({ pathMain, novelID });
            //console.log(data.list[pathMain][novelID]);
        });
    });
    ls = arrayUniq(ls.filter(v => v));
    fs.outputJSONSync(jsonfile, ls, {
        spaces: '\t',
    });
    return ls;
}
exports.cacheDiffNovelList = cacheDiffNovelList;
async function cacheFileList(data) {
    if (data.pathMain.match(/_out$|^\./) || ['docs'].includes(data.pathMain)) {
        console.log('[CACHE (cacheFileList)]', 'SKIP: ', data.pathMain, data.novelID);
        return;
    }
    let dir = path.join(project_config_1.default.cache_root, 'files', data.pathMain);
    let file = path.join(dir, data.novelID + '.json');
    await fs.ensureDir(dir);
    let ls = [];
    if (fs.existsSync(file)) {
        ls = await fs.readJSON(file);
    }
    ls = ls.concat(index_1.filterNotDelete(data).map(function (b) {
        return b.subpath;
    }));
    ls = arrayUniq(ls);
    console.log('[CACHE (cacheFileList)]', path.join(data.pathMain, data.novelID + '.json'), ls.length);
    await fs.outputJSON(file, ls, {
        spaces: '\t',
    });
    return ls;
}
exports.cacheFileList = cacheFileList;
