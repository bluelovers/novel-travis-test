#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yargs = require("yargs");
const segment_1 = require("../script/segment");
const project_config_1 = require("../project.config");
const path = require("upath2");
const Promise = require("bluebird");
const env_bool_1 = require("env-bool");
let { pathMain, novelID, novel_root, runAll } = yargs.argv;
if (pathMain && novelID) {
    Promise.resolve((async () => {
        let dir = path.join(project_config_1.default.cache_root, 'files', pathMain);
        let jsonfile = path.join(dir, novelID + '.json');
        if (!fs.existsSync(jsonfile)) {
            return 0;
        }
        let ls = await fs.readJSON(jsonfile);
        runAll = env_bool_1.default(runAll);
        console.log(`[Segment]`, pathMain, novelID, `runAll: ${runAll}`, ls && ls.length);
        if (!runAll && (!Array.isArray(ls) || !ls.length)) {
            fs.removeSync(jsonfile);
            return 0;
        }
        else {
            console.log(`list:`, ls);
        }
        return segment_1.doSegmentGlob({
            pathMain,
            novelID,
            novel_root,
            files: (!runAll && Array.isArray(ls)) ? ls : null,
            callback(done_list, file, index, length) {
                if ((index % 10) == 0 || ((index + 1) >= length)) {
                    console.log(`[${index}/${length}]`, file);
                    ls = ls.filter(function (v) {
                        return done_list.indexOf(v) == -1;
                    });
                    //					console.log(ls.length);
                    if (ls.length == 0) {
                        fs.removeSync(jsonfile);
                    }
                    else {
                        fs.writeJSONSync(jsonfile, ls, {
                            spaces: '\t',
                        });
                    }
                }
            },
        })
            .then(async function (ret) {
            ls = ls.filter(function (v) {
                return ret.done_list.indexOf(v) == -1;
            });
            console.error(`ls: ${ls.length}`);
            if (ls.length == 0 || 1) {
                fs.removeSync(jsonfile);
            }
            return ret.count.changed;
        })
            .catch(function (e) {
            if (e == segment_1.ERROR_MSG_001) {
                console.warn(segment_1.ERROR_MSG_001);
                fs.removeSync(jsonfile);
                return 0;
            }
            return Promise.reject(e);
        });
    })())
        .then(function (n) {
        process.exit(n || 0);
    });
}
