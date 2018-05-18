"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../project.config");
const path = require("upath2");
const index_1 = require("@node-novel/task/lib/index");
const arrayUniq = require("arr-unique");
async function cacheDiffNovelList(data) {
    let jsonfile = path.join(project_config_1.default.cache_root, 'diff-novel.json');
    let ls;
    if (fs.existsSync(jsonfile)) {
        ls = await fs.readJSON(jsonfile);
    }
    Object.keys(data)
        .forEach(function (pathMain) {
        Object.keys(data[pathMain]).forEach(function (novelID) {
            ls.push({ pathMain, novelID });
        });
    });
    ls = arrayUniq(ls.filter(v => v));
    fs.outputJSONSync(path.join(project_config_1.default.cache_root, 'diff-novel.json'), ls, {
        spaces: '\t',
    });
    return ls;
}
exports.cacheDiffNovelList = cacheDiffNovelList;
async function cacheFileList(data) {
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
    console.log('[CACHE]', path.join(data.pathMain, data.novelID + '.json'), ls.length);
    await fs.outputJSON(file, ls, {
        spaces: '\t',
    });
    return ls;
}
exports.cacheFileList = cacheFileList;
