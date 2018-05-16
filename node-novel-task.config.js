"use strict";
/**
 * Created by user on 2018/5/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const segment_1 = require("./script/segment");
const path = require("upath2");
let DIST_NOVEL = path.join(__dirname, 'dist_novel');
console.log(`目前設定為 預設值 ${__filename}`);
exports.default = {
    cwd: DIST_NOVEL,
    task: {
        main(data, name) {
            console.log('MAIN', name);
            //console.log(data);
        },
        async novel(data, name) {
            console.log('NOVEL', data.pathMain, data.novelID, data.length);
            if (0 || 0 && data.pathMain == 'cm' && data.novelID == '姫騎士がクラスメート！　〜異世界チートで奴隷化ハーレム〜') {
                await segment_1.doSegmentGlob({
                    pathMain: data.pathMain,
                    novelID: data.novelID,
                    novel_root: DIST_NOVEL,
                })
                    .catch(function (err) {
                    console.error(err.toString());
                });
            }
        },
        file(data, file) {
            //console.log('FILE', data.subpath);
            //console.log(data);
        },
    },
};
