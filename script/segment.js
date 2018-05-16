"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const project_config_1 = require("../project.config");
const fs = require("fs-extra");
const lib_1 = require("novel-segment/lib");
const Segment_1 = require("novel-segment/lib/Segment");
const FastGlob = require("fast-glob");
const Promise = require("bluebird");
const crlf_normalize_1 = require("crlf-normalize");
exports.CACHE_TIMEOUT = 3600;
function doSegmentGlob(options) {
    const novel_root = options.novel_root || project_config_1.default.novel_root;
    const segment = options.segment = getSegment(options.segment);
    options.pathMain_out = options.pathMain_out || options.pathMain;
    let CWD_IN = _path(options.pathMain, options.novelID, novel_root);
    let CWD_OUT = _path(options.pathMain_out, options.novelID, novel_root);
    let globPattern = options.globPattern || [
        '**/*.txt',
    ];
    return Promise
        .resolve(FastGlob(globPattern, {
        cwd: CWD_IN,
    }))
        .tap(function (ls) {
        if (ls.length == 0) {
            console.log(CWD_IN);
            return Promise.reject(`沒有搜尋到任何檔案 請檢查搜尋條件`);
        }
    })
        .then(async function (ls) {
        let label = `all file ${ls.length}`;
        console.time(label);
        console.log(`all file ${ls.length}`);
        let count_changed = 0;
        let rs = await Promise.map(ls, async function (file) {
            let label = file;
            //console.time(label);
            console.log('[start]', label);
            let text = await fs.readFile(path.join(CWD_IN, file));
            text = crlf_normalize_1.crlf(text.toString());
            if (!text.replace(/\s+/g, '')) {
                console.warn('[skip]', label);
                return {
                    file,
                    changed: false,
                    exists: true,
                };
            }
            let _now = Date.now();
            let ks = await segment.doSegment(text);
            let timeuse = Date.now() - _now;
            let text_new = segment.stringify(ks);
            let changed = text_new != text;
            if (changed) {
                console.warn('[changed]', label);
                await fs.outputFile(path.join(CWD_OUT, file), text_new);
                count_changed++;
            }
            if (changed) {
            }
            else {
                console.log('[done]', label);
            }
            ks = null;
            return {
                file,
                changed,
            };
        }, { concurrency: 2 });
        console.timeEnd(label);
        console.log(`file changed: ${count_changed}`);
        return {
            ls,
            count: {
                file: ls.length,
                changed: count_changed,
            },
        };
    });
}
exports.doSegmentGlob = doSegmentGlob;
function _path(pathMain, novelID, novel_root = project_config_1.default.novel_root) {
    return path.resolve(novel_root, pathMain, novelID);
}
exports._path = _path;
function getSegment(segment) {
    if (!segment) {
        if (!exports._segmentObject) {
            segment = exports._segmentObject = createSegment();
            let db_dict = getDictMain(segment);
        }
        segment = exports._segmentObject;
    }
    return segment;
}
exports.getSegment = getSegment;
function createSegment(useCache = true) {
    const segment = new Segment_1.default({
        autoCjk: true,
        optionsDoSegment: {
            convertSynonym: true,
        },
    });
    let cache_file = path.join(project_config_1.default.cache_root, 'cache.db');
    let options = {
        /**
         * 開啟 all_mod 才會在自動載入時包含 ZhtSynonymOptimizer
         */
        all_mod: true,
    };
    console.time(`讀取模組與字典`);
    /**
     * 使用緩存的字典檔範例
     */
    if (useCache && fs.existsSync(cache_file)) {
        console.log(`發現 cache.db`);
        let st = fs.statSync(cache_file);
        let md = (Date.now() - st.mtimeMs) / 1000;
        console.log(`距離上次緩存已過 ${md}s`);
        if (md < exports.CACHE_TIMEOUT) {
            //console.log(st, md);
            console.log(`開始載入緩存字典`);
            let data = JSON.parse(fs.readFileSync(cache_file).toString());
            lib_1.useDefault(segment, Object.assign({}, options, { nodict: true }));
            segment.DICT = data.DICT;
            segment.inited = true;
            cache_file = null;
        }
    }
    if (!segment.inited) {
        console.log(`重新載入分析字典`);
        segment.autoInit(options);
        // 簡轉繁專用
        //segment.loadSynonymDict('zht.synonym.txt');
    }
    let db_dict = segment.getDictDatabase('TABLE', true);
    db_dict.TABLE = segment.DICT['TABLE'];
    db_dict.TABLE2 = segment.DICT['TABLE2'];
    db_dict.options.autoCjk = true;
    console.log('主字典總數', db_dict.size());
    console.timeEnd(`讀取模組與字典`);
    if (useCache && cache_file) {
        console.log(`緩存字典於 cache.db`);
        fs.outputFileSync(cache_file, JSON.stringify({
            DICT: segment.DICT,
        }));
    }
    return segment;
}
exports.createSegment = createSegment;
function getDictMain(segment) {
    return segment.getDictDatabase('TABLE');
}
exports.getDictMain = getDictMain;
