#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const segment_1 = require("../script/segment");
let { pathMain, novelID, file, novel_root } = yargs.argv;
if (pathMain && novelID) {
    (async () => {
        if (file) {
            return segment_1.doSegmentGlob({
                pathMain,
                novelID,
                novel_root,
                globPattern: Array.isArray(file) ? file : [file],
            });
        }
        else {
            return segment_1.doSegmentGlob({
                pathMain,
                novelID,
                novel_root,
            });
        }
    })()
        .then(function (r) {
        process.exit(r.count.changed);
    });
}
