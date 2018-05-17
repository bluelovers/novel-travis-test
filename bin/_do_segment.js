#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yargs = require("yargs");
const segment_1 = require("../script/segment");
const project_config_1 = require("../project.config");
const path = require("upath2");
let { pathMain, novelID, novel_root } = yargs.argv;
if (pathMain && novelID) {
    (async () => {
        let dir = path.join(project_config_1.default.cache_root, 'files', pathMain);
        let jsonfile = path.join(dir, novelID + '.json');
        if (!fs.existsSync(jsonfile)) {
            return 0;
        }
        let ls = await fs.readJSON(jsonfile);
        if (!Array.isArray(ls) || !ls.length) {
            fs.removeSync(jsonfile);
            return 0;
        }
        return segment_1.doSegmentGlob({
            pathMain,
            novelID,
            novel_root,
            files: Array.isArray(ls) ? ls : null,
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
            if (ls.length == 0) {
                fs.removeSync(jsonfile);
            }
            return ret.count.changed;
        });
    })()
        .then(function (n) {
        process.exit(n || 0);
    });
}
