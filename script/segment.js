"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const index_1 = require("../index");
const util_1 = require("../lib/util");
const project_config_1 = require("../project.config");
const fs = require("fs-iconv");
const lib_1 = require("novel-segment/lib");
const Segment_1 = require("novel-segment/lib/Segment");
const FastGlob = require("fast-glob");
const Promise = require("bluebird");
const crlf_normalize_1 = require("crlf-normalize");
const log_1 = require("../lib/log");
const Bluebird = require("bluebird");
const bluebird_1 = require("bluebird");
const conv_1 = require("../lib/conv");
const array_hyper_unique_1 = require("array-hyper-unique");
exports.DIST_NOVEL = project_config_1.default.novel_root;
exports.CACHE_TIMEOUT = 3600;
exports.ERROR_MSG_001 = `沒有搜尋到任何檔案 請檢查搜尋條件`;
exports.CACHE_FILE = path.join(project_config_1.default.cache_root, 'cache.db');
function doSegmentGlob(options) {
    const novel_root = options.novel_root || project_config_1.default.novel_root;
    const segment = options.segment = getSegment(options.segment);
    options.pathMain_out = options.pathMain_out || options.pathMain;
    let CWD_IN = _path(options.pathMain, options.novelID, novel_root);
    let CWD_OUT = _path(options.pathMain_out, options.novelID, novel_root);
    let globPattern = options.globPattern || [
        '**/*.txt',
    ];
    log_1.default.info('[do]', options.pathMain, options.novelID);
    return Promise.resolve(options.files || FastGlob(globPattern, {
        cwd: CWD_IN,
    }))
        .then(function (ls) {
        return _doSegmentGlob(ls, options);
    });
}
exports.doSegmentGlob = doSegmentGlob;
function _doSegmentGlob(ls, options) {
    const novel_root = options.novel_root || project_config_1.default.novel_root;
    const segment = options.segment = getSegment(options.segment);
    options.pathMain_out = options.pathMain_out || options.pathMain;
    let CWD_IN = _path(options.pathMain, options.novelID, novel_root);
    let CWD_OUT = _path(options.pathMain_out, options.novelID, novel_root);
    return Promise
        .resolve(ls)
        .tap(function (ls) {
        if (ls.length == 0) {
            //console.log(CWD_IN);
            return Promise.reject(exports.ERROR_MSG_001);
        }
    })
        .then(async function (ls) {
        let label = `all file ${ls.length}`;
        log_1.default.time(label);
        log_1.default.log(`all file ${ls.length}`);
        let count_changed = 0;
        let done_list = [];
        let rs = await Promise.mapSeries(ls, async function (file, index, length) {
            let label = file;
            //console.time(label);
            //				console.log('[start]', label);
            let fillpath = path.join(CWD_IN, file);
            let fillpath_out = path.join(CWD_OUT, file);
            //				console.log(fillpath);
            //				console.log(fillpath_out);
            if (!fs.pathExistsSync(fillpath)) {
                done_list.push(file);
                if (options.callback) {
                    await options.callback(done_list, file, index, length);
                }
                return {
                    file,
                    changed: false,
                    exists: false,
                };
            }
            else if (!file.match(/\.txt$/i)) {
                done_list.push(file);
                return {
                    file,
                    changed: false,
                    exists: true,
                };
            }
            let text = await fs.loadFile(fillpath, {
                autoDecode: true,
            })
                .then(v => crlf_normalize_1.crlf(v.toString()));
            if (!text.replace(/\s+/g, '')) {
                //console.warn('[skip]', label);
                done_list.push(file);
                if (options.callback) {
                    await options.callback(done_list, file, index, length);
                }
                return {
                    file,
                    changed: false,
                    exists: true,
                };
            }
            let _now = Date.now();
            let ks = await segment.doSegment(text);
            let timeuse = Date.now() - _now;
            let text_new = await segment.stringify(ks);
            let changed = text_new != text;
            if (changed) {
                //					console.warn('[changed]', label);
                await fs.outputFile(fillpath_out, text_new);
                count_changed++;
            }
            if (changed) {
            }
            else {
                //console.log('[done]', label);
            }
            done_list.push(file);
            if (options.callback) {
                await options.callback(done_list, file, index, length);
            }
            ks = null;
            text = undefined;
            text_new = undefined;
            return {
                file,
                changed,
                exists: true,
            };
        });
        log_1.default.timeEnd(label);
        log_1.default[count_changed ? 'ok' : 'debug'](`file changed: ${count_changed}`);
        return {
            ls,
            done_list,
            count: {
                file: ls.length,
                changed: count_changed,
                done: done_list.length,
            },
        };
    });
}
exports._doSegmentGlob = _doSegmentGlob;
function _path(pathMain, novelID, novel_root = project_config_1.default.novel_root) {
    let p;
    try {
        p = path.resolve(novel_root, pathMain, novelID);
    }
    catch (e) {
        log_1.default.dir({
            novel_root,
            pathMain,
            novelID,
        });
        throw e;
    }
    return p;
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
function resetSegmentCache() {
    let cache_file = exports.CACHE_FILE;
    if (fs.existsSync(cache_file)) {
        log_1.default.red(`[Segment] reset cache`);
        fs.removeSync(cache_file);
    }
}
exports.resetSegmentCache = resetSegmentCache;
function createSegment(useCache = true) {
    const segment = new Segment_1.default({
        autoCjk: true,
        optionsDoSegment: {
            convertSynonym: true,
        },
    });
    let cache_file = exports.CACHE_FILE;
    let options = {
        /**
         * 開啟 all_mod 才會在自動載入時包含 ZhtSynonymOptimizer
         */
        all_mod: true,
    };
    log_1.default.time(`讀取模組與字典`);
    /**
     * 使用緩存的字典檔範例
     */
    if (useCache && fs.existsSync(cache_file)) {
        //console.log(`發現 cache.db`);
        let st = fs.statSync(cache_file);
        let md = (Date.now() - st.mtimeMs) / 1000;
        //console.log(`距離上次緩存已過 ${md}s`);
        if (md < exports.CACHE_TIMEOUT) {
            //console.log(st, md);
            //console.log(`開始載入緩存字典`);
            let data = JSON.parse(fs.readFileSync(cache_file).toString());
            lib_1.useDefault(segment, {
                ...options,
                nodict: true,
            });
            segment.DICT = data.DICT;
            segment.inited = true;
            cache_file = null;
            data = undefined;
        }
    }
    if (!segment.inited) {
        //console.log(`重新載入分析字典`);
        segment.autoInit(options);
        // 簡轉繁專用
        //segment.loadSynonymDict('zht.synonym.txt');
    }
    let db_dict = segment.getDictDatabase('TABLE', true);
    db_dict.TABLE = segment.DICT['TABLE'];
    db_dict.TABLE2 = segment.DICT['TABLE2'];
    db_dict.options.autoCjk = true;
    //console.log('主字典總數', db_dict.size());
    log_1.default.timeEnd(`讀取模組與字典`);
    if (useCache && cache_file) {
        //console.log(`緩存字典於 cache.db`);
        fs.outputFileSync(cache_file, JSON.stringify({
            DICT: segment.DICT,
        }));
    }
    util_1.freeGC();
    return segment;
}
exports.createSegment = createSegment;
function getDictMain(segment) {
    return segment.getDictDatabase('TABLE');
}
exports.getDictMain = getDictMain;
function runSegment() {
    let _cache_file_segment = path.join(project_config_1.default.cache_root, '.segment');
    let _cache_segment;
    let _s_ver = String(require("novel-segment").version || '1');
    let _d_ver = String(require("segment-dict").version || '1');
    if (fs.existsSync(_cache_file_segment)) {
        try {
            _cache_segment = fs.readJSONSync(_cache_file_segment);
        }
        catch (e) {
        }
    }
    // @ts-ignore
    _cache_segment = _cache_segment || {};
    _cache_segment.list = _cache_segment.list || {};
    {
        let { last_s_ver, last_d_ver, s_ver, d_ver } = _cache_segment;
        log_1.default.debug({
            _s_ver,
            _d_ver,
            s_ver,
            d_ver,
        });
        if (s_ver != _s_ver || d_ver != _d_ver) {
            resetSegmentCache();
        }
    }
    const startTime = Date.now();
    const MAX_SCRIPT_TIMEOUT = 20 * 60 * 1000;
    let cancellablePromise = Bluebird
        .mapSeries(FastGlob([
        '*/*.json',
    ], {
        cwd: path.join(project_config_1.default.cache_root, 'files'),
    }), async function (id) {
        let [pathMain, novelID] = id.split(/[\\\/]/);
        novelID = path.basename(novelID, '.json');
        if ((Date.now() - startTime) > MAX_SCRIPT_TIMEOUT) {
            return Bluebird.reject(new bluebird_1.CancellationError(`任務已取消 本次將不會執行 ${pathMain}, ${novelID}`));
        }
        let np = _path(pathMain, novelID);
        if (!fs.existsSync(np)) {
            log_1.default.error(pathMain, novelID);
            await fs.remove(path.join(project_config_1.default.cache_root, 'files', id));
            return -1;
        }
        let bin = path.join(project_config_1.default.project_root, 'bin/_do_segment.js');
        let _run_all = false;
        _cache_segment.list[novelID] = _cache_segment.list[novelID] || {};
        let _current_data = _cache_segment.list[novelID][novelID] = _cache_segment.list[novelID][novelID] || {};
        let _handle_list = [];
        {
            let dir = path.join(project_config_1.default.cache_root, 'files', pathMain);
            let jsonfile = path.join(dir, novelID + '.json');
            await fs.readJSON(jsonfile)
                .then(function (ls) {
                _handle_list.push(...ls);
            })
                .catch(e => null);
        }
        if (_current_data.d_ver != _d_ver || _current_data.s_ver != _s_ver) {
            log_1.default.debug({
                pathMain,
                novelID,
                s_ver: _current_data.s_ver,
                d_ver: _current_data.d_ver,
            });
            _run_all = true;
        }
        let cp = index_1.crossSpawnSync('node', [
            '--max-old-space-size=2048',
            //'--expose-gc',
            bin,
            '--pathMain',
            pathMain,
            '--novelID',
            novelID,
            '--runAll',
            String(_run_all),
        ], {
            stdio: 'inherit',
            cwd: exports.DIST_NOVEL,
        });
        if (cp.status > 0) {
            index_1.crossSpawnSync('git', [
                'commit',
                '-a',
                '-m',
                `[Segment] ${pathMain} ${novelID}`,
            ], {
                stdio: 'inherit',
                cwd: exports.DIST_NOVEL,
            });
            await fs.outputJSON(_cache_file_segment, _cache_segment, {
                spaces: "\t",
            });
        }
        {
            let dir = path.join(project_config_1.default.cache_root, 'files', pathMain);
            let jsonfile = path.join(dir, novelID + '.json');
            let jsonfile_done = jsonfile + '.done';
            await fs.readJSON(jsonfile_done)
                .then(async function (ls) {
                let CWD_IN = _path(pathMain, novelID);
                let cjk_changed = false;
                if (!fs.pathExistsSync(CWD_IN)) {
                    return;
                }
                ls = (ls || [])
                    .concat(_handle_list);
                ls = array_hyper_unique_1.array_unique_overwrite(ls);
                if (!ls.length || !ls) {
                    return;
                }
                return Bluebird
                    .mapSeries(ls, async function (file) {
                    if (path.extname(file) == '.txt') {
                        let fullpath = path.join(CWD_IN, file);
                        return fs.loadFile(fullpath, {
                            autoDecode: true,
                        })
                            .then(function (buf) {
                            if (buf && buf.length) {
                                let txt_old = String(buf);
                                let txt_new = conv_1.do_cn2tw_min(txt_old)
                                    .replace(/^\s*\n/, '')
                                    .replace(/(?<=\n)\s*\n\s*$/, '');
                                if (txt_old != txt_new && txt_new) {
                                    cjk_changed = true;
                                    return fs.writeFile(fullpath, txt_new)
                                        .then(function () {
                                        log_1.default.success(`[cjk-conv]`, file);
                                        return fullpath;
                                    });
                                }
                                return null;
                            }
                            return Promise.reject(buf);
                        })
                            .catch(e => {
                            log_1.default.error(e.message);
                            return null;
                        });
                    }
                })
                    .mapSeries(function (fullpath) {
                    fullpath && index_1.crossSpawnSync('git', [
                        'add',
                        fullpath,
                    ], {
                        stdio: 'inherit',
                        cwd: CWD_IN,
                    });
                    return fullpath;
                })
                    .tap(function () {
                    if (cjk_changed) {
                        index_1.crossSpawnSync('git', [
                            'commit',
                            '-m',
                            `[cjk-conv] ${pathMain} ${novelID}`,
                        ], {
                            stdio: 'inherit',
                            cwd: CWD_IN,
                        });
                    }
                });
            })
                .catch(e => {
                log_1.default.error(e.message);
            });
        }
        _current_data.last_s_ver = _current_data.s_ver;
        _current_data.last_d_ver = _current_data.d_ver;
        _current_data.s_ver = _s_ver;
        _current_data.d_ver = _d_ver;
        return cp.status;
    })
        .then(() => true)
        .catch(bluebird_1.CancellationError, (e) => {
        log_1.default.error(e.message);
        return false;
    })
        .tap(async function () {
        _cache_segment.last_s_ver = _cache_segment.s_ver;
        _cache_segment.last_d_ver = _cache_segment.d_ver;
        _cache_segment.s_ver = _s_ver;
        _cache_segment.d_ver = _d_ver;
        await fs.outputJSON(_cache_file_segment, _cache_segment, {
            spaces: "\t",
        });
    });
    return cancellablePromise
        .catch(bluebird_1.CancellationError, (e) => {
        return log_1.default.error(e.message);
    });
}
exports.runSegment = runSegment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtCQUFnQztBQUNoQyxvQ0FBMEM7QUFDMUMsc0NBQXFDO0FBQ3JDLHNEQUFzRTtBQUN0RSwrQkFBZ0M7QUFDaEMsMkNBQWtFO0FBQ2xFLHVEQUFnRDtBQUVoRCxzQ0FBdUM7QUFDdkMsb0NBQXFDO0FBQ3JDLG1EQUFzQztBQUN0QyxvQ0FBaUM7QUFDakMscUNBQXNDO0FBR3RDLHVDQUEyRDtBQUUzRCxzQ0FBMkM7QUFDM0MsMkRBQTREO0FBRWpELFFBQUEsVUFBVSxHQUFHLHdCQUFhLENBQUMsVUFBVSxDQUFDO0FBRXRDLFFBQUEsYUFBYSxHQUFHLElBQUksQ0FBQztBQUluQixRQUFBLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUVwQyxRQUFBLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBb0IxRSxTQUFnQixhQUFhLENBQUMsT0FBaUI7SUFFOUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSx3QkFBYSxDQUFDLFVBQVUsQ0FBQztJQUVsRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFOUQsT0FBTyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFaEUsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNsRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRXZFLElB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SyxHQUFHLE1BQU0sQ0FBQztRQUU5QixNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO1lBQ3hELE1BQU0sRUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQ0Y7SUFFRCxPQUFPLGtCQUFrQjtTQUN2QixLQUFLLENBQUMsNEJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUUvQixPQUFPLGFBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXhTRCxnQ0F3U0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTYvMDE2LlxuICovXG5cbmltcG9ydCBwYXRoID0gcmVxdWlyZShcInVwYXRoMlwiKTtcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgZnJlZUdDIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcsIHsgTUFYX1NDUklQVF9USU1FT1VUIH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtaWNvbnYnKTtcbmltcG9ydCB7IHVzZURlZmF1bHQsIGdldERlZmF1bHRNb2RMaXN0IH0gZnJvbSAnbm92ZWwtc2VnbWVudC9saWInO1xuaW1wb3J0IFNlZ21lbnQgZnJvbSAnbm92ZWwtc2VnbWVudC9saWIvU2VnbWVudCc7XG5pbXBvcnQgVGFibGVEaWN0IGZyb20gJ25vdmVsLXNlZ21lbnQvbGliL3RhYmxlL2RpY3QnO1xuaW1wb3J0IEZhc3RHbG9iID0gcmVxdWlyZSgnZmFzdC1nbG9iJyk7XG5pbXBvcnQgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgeyBjcmxmIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IEJsdWViaXJkQ2FuY2VsbGF0aW9uIGZyb20gJ2JsdWViaXJkLWNhbmNlbGxhdGlvbic7XG5pbXBvcnQgeyBDYW5jZWxsYXRpb25FcnJvciwgVGltZW91dEVycm9yIH0gZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgdHcyY25fbWluLCBjbjJ0d19taW4sIHRhYmxlQ24yVHdEZWJ1ZywgdGFibGVUdzJDbkRlYnVnIH0gZnJvbSAnY2prLWNvbnYvbGliL3poL2NvbnZlcnQvbWluJztcbmltcG9ydCB7IGRvX2NuMnR3X21pbiB9IGZyb20gJy4uL2xpYi9jb252JztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZV9vdmVyd3JpdGUgfSBmcm9tICdhcnJheS1oeXBlci11bmlxdWUnO1xuXG5leHBvcnQgbGV0IERJU1RfTk9WRUwgPSBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG5cbmV4cG9ydCBsZXQgQ0FDSEVfVElNRU9VVCA9IDM2MDA7XG5cbmV4cG9ydCBsZXQgX3NlZ21lbnRPYmplY3Q6IFNlZ21lbnQ7XG5cbmV4cG9ydCBjb25zdCBFUlJPUl9NU0dfMDAxID0gYOaykuacieaQnOWwi+WIsOS7u+S9leaqlOahiCDoq4vmqqLmn6XmkJzlsIvmop3ku7ZgO1xuXG5leHBvcnQgY29uc3QgQ0FDSEVfRklMRSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdjYWNoZS5kYicpO1xuXG5leHBvcnQgdHlwZSBJT3B0aW9ucyA9IHtcblx0cGF0aE1haW46IHN0cmluZyxcblx0cGF0aE1haW5fb3V0Pzogc3RyaW5nLFxuXHRub3ZlbElEOiBzdHJpbmcsXG5cblx0c2VnbWVudD86IFNlZ21lbnQsXG5cblx0bm92ZWxfcm9vdD86IHN0cmluZyxcblxuXHRnbG9iUGF0dGVybj86IHN0cmluZ1tdLFxuXG5cdGZpbGVzPzogc3RyaW5nW10sXG5cblx0aGlkZUxvZz86IGJvb2xlYW4sXG5cblx0Y2FsbGJhY2s/KGRvbmVfbGlzdDogc3RyaW5nW10sIGZpbGU6IHN0cmluZywgaW5kZXg6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRvU2VnbWVudEdsb2Iob3B0aW9uczogSU9wdGlvbnMpXG57XG5cdGNvbnN0IG5vdmVsX3Jvb3QgPSBvcHRpb25zLm5vdmVsX3Jvb3QgfHwgUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5cdGNvbnN0IHNlZ21lbnQgPSBvcHRpb25zLnNlZ21lbnQgPSBnZXRTZWdtZW50KG9wdGlvbnMuc2VnbWVudCk7XG5cblx0b3B0aW9ucy5wYXRoTWFpbl9vdXQgPSBvcHRpb25zLnBhdGhNYWluX291dCB8fCBvcHRpb25zLnBhdGhNYWluO1xuXG5cdGxldCBDV0RfSU4gPSBfcGF0aChvcHRpb25zLnBhdGhNYWluLCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXHRsZXQgQ1dEX09VVCA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW5fb3V0LCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXG5cdGxldCBnbG9iUGF0dGVybiA9IG9wdGlvbnMuZ2xvYlBhdHRlcm4gfHwgW1xuXHRcdCcqKi8qLnR4dCcsXG5cdF07XG5cblx0Y29uc29sZS5pbmZvKCdbZG9dJywgb3B0aW9ucy5wYXRoTWFpbiwgb3B0aW9ucy5ub3ZlbElEKTtcblxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9wdGlvbnMuZmlsZXMgfHwgRmFzdEdsb2IoZ2xvYlBhdHRlcm4sIHtcblx0XHRcdGN3ZDogQ1dEX0lOLFxuXHRcdFx0Ly9hYnNvbHV0ZTogdHJ1ZSxcblx0XHR9KSBhcyBhbnkgYXMgUHJvbWlzZTxzdHJpbmdbXT4pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdHtcblx0XHRcdHJldHVybiBfZG9TZWdtZW50R2xvYihscywgb3B0aW9ucyk7XG5cdFx0fSlcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZG9TZWdtZW50R2xvYihsczogc3RyaW5nW10sIG9wdGlvbnM6IElPcHRpb25zKVxue1xuXHRjb25zdCBub3ZlbF9yb290ID0gb3B0aW9ucy5ub3ZlbF9yb290IHx8IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuXHRjb25zdCBzZWdtZW50ID0gb3B0aW9ucy5zZWdtZW50ID0gZ2V0U2VnbWVudChvcHRpb25zLnNlZ21lbnQpO1xuXG5cdG9wdGlvbnMucGF0aE1haW5fb3V0ID0gb3B0aW9ucy5wYXRoTWFpbl9vdXQgfHwgb3B0aW9ucy5wYXRoTWFpbjtcblxuXHRsZXQgQ1dEX0lOID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbiwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblx0bGV0IENXRF9PVVQgPSBfcGF0aChvcHRpb25zLnBhdGhNYWluX291dCwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblxuXHRyZXR1cm4gUHJvbWlzZVxuXHRcdC5yZXNvbHZlKGxzKVxuXHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdHtcblx0XHRcdGlmIChscy5sZW5ndGggPT0gMClcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhDV0RfSU4pO1xuXG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlamVjdChFUlJPUl9NU0dfMDAxKTtcblx0XHRcdH1cblx0XHR9KVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRsZXQgbGFiZWwgPSBgYWxsIGZpbGUgJHtscy5sZW5ndGh9YDtcblx0XHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cblx0XHRcdGNvbnNvbGUubG9nKGBhbGwgZmlsZSAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0bGV0IGNvdW50X2NoYW5nZWQgPSAwO1xuXG5cdFx0XHRsZXQgZG9uZV9saXN0ID0gW10gYXMgc3RyaW5nW107XG5cblx0XHRcdGxldCBycyA9IGF3YWl0IFByb21pc2UubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZmlsZSwgaW5kZXgsIGxlbmd0aClcblx0XHRcdHtcblx0XHRcdFx0bGV0IGxhYmVsID0gZmlsZTtcblxuXHRcdFx0XHQvL2NvbnNvbGUudGltZShsYWJlbCk7XG5cbi8vXHRcdFx0XHRjb25zb2xlLmxvZygnW3N0YXJ0XScsIGxhYmVsKTtcblxuXHRcdFx0XHRsZXQgZmlsbHBhdGggPSBwYXRoLmpvaW4oQ1dEX0lOLCBmaWxlKTtcblx0XHRcdFx0bGV0IGZpbGxwYXRoX291dCA9IHBhdGguam9pbihDV0RfT1VULCBmaWxlKTtcblxuLy9cdFx0XHRcdGNvbnNvbGUubG9nKGZpbGxwYXRoKTtcbi8vXHRcdFx0XHRjb25zb2xlLmxvZyhmaWxscGF0aF9vdXQpO1xuXG5cdFx0XHRcdGlmICghZnMucGF0aEV4aXN0c1N5bmMoZmlsbHBhdGgpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0XHRpZiAob3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRhd2FpdCBvcHRpb25zLmNhbGxiYWNrKGRvbmVfbGlzdCwgZmlsZSwgaW5kZXgsIGxlbmd0aCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRjaGFuZ2VkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGV4aXN0czogZmFsc2UsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICghZmlsZS5tYXRjaCgvXFwudHh0JC9pKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRjaGFuZ2VkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGV4aXN0czogdHJ1ZSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHRleHQgPSBhd2FpdCBmcy5sb2FkRmlsZShmaWxscGF0aCwge1xuXHRcdFx0XHRcdGF1dG9EZWNvZGU6IHRydWUsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbih2ID0+IGNybGYodi50b1N0cmluZygpKSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdGlmICghdGV4dC5yZXBsYWNlKC9cXHMrL2csICcnKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vY29uc29sZS53YXJuKCdbc2tpcF0nLCBsYWJlbCk7XG5cblx0XHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmNhbGxiYWNrKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGF3YWl0IG9wdGlvbnMuY2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdGNoYW5nZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXhpc3RzOiB0cnVlLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgX25vdyA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0bGV0IGtzID0gYXdhaXQgc2VnbWVudC5kb1NlZ21lbnQodGV4dCk7XG5cblx0XHRcdFx0bGV0IHRpbWV1c2UgPSBEYXRlLm5vdygpIC0gX25vdztcblxuXHRcdFx0XHRsZXQgdGV4dF9uZXcgPSBhd2FpdCBzZWdtZW50LnN0cmluZ2lmeShrcyk7XG5cblx0XHRcdFx0bGV0IGNoYW5nZWQgPSB0ZXh0X25ldyAhPSB0ZXh0O1xuXG5cdFx0XHRcdGlmIChjaGFuZ2VkKVxuXHRcdFx0XHR7XG4vL1x0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1tjaGFuZ2VkXScsIGxhYmVsKTtcblxuXHRcdFx0XHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZmlsbHBhdGhfb3V0LCB0ZXh0X25ldyk7XG5cblx0XHRcdFx0XHRjb3VudF9jaGFuZ2VkKys7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY2hhbmdlZClcblx0XHRcdFx0e1xuXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW2RvbmVdJywgbGFiZWwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0aWYgKG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBvcHRpb25zLmNhbGxiYWNrKGRvbmVfbGlzdCwgZmlsZSwgaW5kZXgsIGxlbmd0aCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRrcyA9IG51bGw7XG5cblx0XHRcdFx0dGV4dCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0dGV4dF9uZXcgPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdGNoYW5nZWQsXG5cdFx0XHRcdFx0ZXhpc3RzOiB0cnVlLFxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cblx0XHRcdGNvbnNvbGVbY291bnRfY2hhbmdlZCA/ICdvaycgOiAnZGVidWcnXShgZmlsZSBjaGFuZ2VkOiAke2NvdW50X2NoYW5nZWR9YCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGxzLFxuXHRcdFx0XHRkb25lX2xpc3QsXG5cdFx0XHRcdGNvdW50OiB7XG5cdFx0XHRcdFx0ZmlsZTogbHMubGVuZ3RoLFxuXHRcdFx0XHRcdGNoYW5nZWQ6IGNvdW50X2NoYW5nZWQsXG5cdFx0XHRcdFx0ZG9uZTogZG9uZV9saXN0Lmxlbmd0aCxcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9wYXRoKHBhdGhNYWluLCBub3ZlbElELCBub3ZlbF9yb290ID0gUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KTogc3RyaW5nXG57XG5cdGxldCBwOiBzdHJpbmc7XG5cblx0dHJ5XG5cdHtcblx0XHRwID0gcGF0aC5yZXNvbHZlKG5vdmVsX3Jvb3QsIHBhdGhNYWluLCBub3ZlbElEKVxuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0bm92ZWxfcm9vdCxcblx0XHRcdHBhdGhNYWluLFxuXHRcdFx0bm92ZWxJRCxcblx0XHR9KTtcblxuXHRcdHRocm93IGU7XG5cdH1cblxuXHRyZXR1cm4gcDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlZ21lbnQoc2VnbWVudD86IFNlZ21lbnQpXG57XG5cdGlmICghc2VnbWVudClcblx0e1xuXHRcdGlmICghX3NlZ21lbnRPYmplY3QpXG5cdFx0e1xuXHRcdFx0c2VnbWVudCA9IF9zZWdtZW50T2JqZWN0ID0gY3JlYXRlU2VnbWVudCgpO1xuXG5cdFx0XHRsZXQgZGJfZGljdCA9IGdldERpY3RNYWluKHNlZ21lbnQpO1xuXHRcdH1cblxuXHRcdHNlZ21lbnQgPSBfc2VnbWVudE9iamVjdDtcblx0fVxuXG5cdHJldHVybiBzZWdtZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTZWdtZW50Q2FjaGUoKVxue1xuXHRsZXQgY2FjaGVfZmlsZSA9IENBQ0hFX0ZJTEU7XG5cblx0aWYgKGZzLmV4aXN0c1N5bmMoY2FjaGVfZmlsZSkpXG5cdHtcblx0XHRjb25zb2xlLnJlZChgW1NlZ21lbnRdIHJlc2V0IGNhY2hlYCk7XG5cdFx0ZnMucmVtb3ZlU3luYyhjYWNoZV9maWxlKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VnbWVudCh1c2VDYWNoZTogYm9vbGVhbiA9IHRydWUpXG57XG5cdGNvbnN0IHNlZ21lbnQgPSBuZXcgU2VnbWVudCh7XG5cdFx0YXV0b0NqazogdHJ1ZSxcblxuXHRcdG9wdGlvbnNEb1NlZ21lbnQ6IHtcblxuXHRcdFx0Y29udmVydFN5bm9ueW06IHRydWUsXG5cblx0XHR9LFxuXHR9KTtcblxuXHRsZXQgY2FjaGVfZmlsZSA9IENBQ0hFX0ZJTEU7XG5cblx0bGV0IG9wdGlvbnMgPSB7XG5cdFx0LyoqXG5cdFx0ICog6ZaL5ZWfIGFsbF9tb2Qg5omN5pyD5Zyo6Ieq5YuV6LyJ5YWl5pmC5YyF5ZCrIFpodFN5bm9ueW1PcHRpbWl6ZXJcblx0XHQgKi9cblx0XHRhbGxfbW9kOiB0cnVlLFxuXHR9O1xuXG5cdGNvbnNvbGUudGltZShg6K6A5Y+W5qih57WE6IiH5a2X5YW4YCk7XG5cblx0LyoqXG5cdCAqIOS9v+eUqOe3qeWtmOeahOWtl+WFuOaqlOevhOS+i1xuXHQgKi9cblx0aWYgKHVzZUNhY2hlICYmIGZzLmV4aXN0c1N5bmMoY2FjaGVfZmlsZSkpXG5cdHtcblx0XHQvL2NvbnNvbGUubG9nKGDnmbznj74gY2FjaGUuZGJgKTtcblxuXHRcdGxldCBzdCA9IGZzLnN0YXRTeW5jKGNhY2hlX2ZpbGUpO1xuXG5cdFx0bGV0IG1kID0gKERhdGUubm93KCkgLSBzdC5tdGltZU1zKSAvIDEwMDA7XG5cblx0XHQvL2NvbnNvbGUubG9nKGDot53pm6LkuIrmrKHnt6nlrZjlt7LpgY4gJHttZH1zYCk7XG5cblx0XHRpZiAobWQgPCBDQUNIRV9USU1FT1VUKVxuXHRcdHtcblx0XHRcdC8vY29uc29sZS5sb2coc3QsIG1kKTtcblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhg6ZaL5aeL6LyJ5YWl57ep5a2Y5a2X5YW4YCk7XG5cblx0XHRcdGxldCBkYXRhID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY2FjaGVfZmlsZSkudG9TdHJpbmcoKSk7XG5cblx0XHRcdHVzZURlZmF1bHQoc2VnbWVudCwge1xuXHRcdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0XHRub2RpY3Q6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0c2VnbWVudC5ESUNUID0gZGF0YS5ESUNUO1xuXG5cdFx0XHRzZWdtZW50LmluaXRlZCA9IHRydWU7XG5cblx0XHRcdGNhY2hlX2ZpbGUgPSBudWxsO1xuXHRcdFx0ZGF0YSA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH1cblxuXHRpZiAoIXNlZ21lbnQuaW5pdGVkKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhg6YeN5paw6LyJ5YWl5YiG5p6Q5a2X5YW4YCk7XG5cdFx0c2VnbWVudC5hdXRvSW5pdChvcHRpb25zKTtcblxuXHRcdC8vIOewoei9iee5geWwiOeUqFxuXHRcdC8vc2VnbWVudC5sb2FkU3lub255bURpY3QoJ3podC5zeW5vbnltLnR4dCcpO1xuXHR9XG5cblx0bGV0IGRiX2RpY3QgPSBzZWdtZW50LmdldERpY3REYXRhYmFzZSgnVEFCTEUnLCB0cnVlKTtcblx0ZGJfZGljdC5UQUJMRSA9IHNlZ21lbnQuRElDVFsnVEFCTEUnXTtcblx0ZGJfZGljdC5UQUJMRTIgPSBzZWdtZW50LkRJQ1RbJ1RBQkxFMiddO1xuXG5cdGRiX2RpY3Qub3B0aW9ucy5hdXRvQ2prID0gdHJ1ZTtcblxuXHQvL2NvbnNvbGUubG9nKCfkuLvlrZflhbjnuL3mlbgnLCBkYl9kaWN0LnNpemUoKSk7XG5cblx0Y29uc29sZS50aW1lRW5kKGDoroDlj5bmqKHntYToiIflrZflhbhgKTtcblxuXHRpZiAodXNlQ2FjaGUgJiYgY2FjaGVfZmlsZSlcblx0e1xuXHRcdC8vY29uc29sZS5sb2coYOe3qeWtmOWtl+WFuOaWvCBjYWNoZS5kYmApO1xuXG5cdFx0ZnMub3V0cHV0RmlsZVN5bmMoY2FjaGVfZmlsZSwgSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0RElDVDogc2VnbWVudC5ESUNULFxuXHRcdH0pKTtcblx0fVxuXG5cdGZyZWVHQygpO1xuXG5cdHJldHVybiBzZWdtZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGljdE1haW4oc2VnbWVudDogU2VnbWVudClcbntcblx0cmV0dXJuIHNlZ21lbnQuZ2V0RGljdERhdGFiYXNlKCdUQUJMRScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcnVuU2VnbWVudCgpXG57XG5cdGxldCBfY2FjaGVfZmlsZV9zZWdtZW50ID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJy5zZWdtZW50Jyk7XG5cblx0bGV0IF9jYWNoZV9zZWdtZW50OiB7XG5cblx0XHRzX3Zlcj86IHN0cmluZyxcblx0XHRkX3Zlcj86IHN0cmluZyxcblxuXHRcdGxhc3Rfc192ZXI/OiBzdHJpbmcsXG5cdFx0bGFzdF9kX3Zlcj86IHN0cmluZyxcblxuXHRcdGxpc3Q6IHtcblx0XHRcdFtrOiBzdHJpbmddOiB7XG5cdFx0XHRcdFtrOiBzdHJpbmddOiB7XG5cdFx0XHRcdFx0c192ZXI/OiBzdHJpbmcsXG5cdFx0XHRcdFx0ZF92ZXI/OiBzdHJpbmcsXG5cblx0XHRcdFx0XHRsYXN0X3NfdmVyPzogc3RyaW5nLFxuXHRcdFx0XHRcdGxhc3RfZF92ZXI/OiBzdHJpbmcsXG5cdFx0XHRcdH0sXG5cdFx0XHR9XG5cdFx0fSxcblx0fTtcblxuXHRsZXQgX3NfdmVyOiBzdHJpbmcgPSBTdHJpbmcocmVxdWlyZShcIm5vdmVsLXNlZ21lbnRcIikudmVyc2lvbiB8fCAnMScpO1xuXHRsZXQgX2RfdmVyOiBzdHJpbmcgPSBTdHJpbmcocmVxdWlyZShcInNlZ21lbnQtZGljdFwiKS52ZXJzaW9uIHx8ICcxJyk7XG5cblx0aWYgKGZzLmV4aXN0c1N5bmMoX2NhY2hlX2ZpbGVfc2VnbWVudCkpXG5cdHtcblx0XHR0cnlcblx0XHR7XG5cdFx0XHRfY2FjaGVfc2VnbWVudCA9IGZzLnJlYWRKU09OU3luYyhfY2FjaGVfZmlsZV9zZWdtZW50KTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXHR9XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRfY2FjaGVfc2VnbWVudCA9IF9jYWNoZV9zZWdtZW50IHx8IHt9O1xuXHRfY2FjaGVfc2VnbWVudC5saXN0ID0gX2NhY2hlX3NlZ21lbnQubGlzdCB8fCB7fTtcblxuXHR7XG5cdFx0bGV0IHsgbGFzdF9zX3ZlciwgbGFzdF9kX3Zlciwgc192ZXIsIGRfdmVyIH0gPSBfY2FjaGVfc2VnbWVudDtcblx0XHRjb25zb2xlLmRlYnVnKHtcblx0XHRcdF9zX3Zlcixcblx0XHRcdF9kX3ZlcixcblxuXHRcdFx0c192ZXIsXG5cdFx0XHRkX3Zlcixcblx0XHR9KTtcblxuXHRcdGlmIChzX3ZlciAhPSBfc192ZXIgfHwgZF92ZXIgIT0gX2RfdmVyKVxuXHRcdHtcblx0XHRcdHJlc2V0U2VnbWVudENhY2hlKCk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblx0Y29uc3QgTUFYX1NDUklQVF9USU1FT1VUID0gMjAgKiA2MCAqIDEwMDA7XG5cblx0bGV0IGNhbmNlbGxhYmxlUHJvbWlzZSA9IEJsdWViaXJkXG5cdFx0Lm1hcFNlcmllcyhGYXN0R2xvYihbXG5cdFx0XHQnKi8qLmpzb24nLFxuXHRcdF0sIHtcblx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJyksXG5cdFx0fSksIGFzeW5jIGZ1bmN0aW9uIChpZDogc3RyaW5nKVxuXHRcdHtcblx0XHRcdGxldCBbcGF0aE1haW4sIG5vdmVsSURdID0gaWQuc3BsaXQoL1tcXFxcXFwvXS8pO1xuXHRcdFx0bm92ZWxJRCA9IHBhdGguYmFzZW5hbWUobm92ZWxJRCwgJy5qc29uJyk7XG5cblx0XHRcdGlmICgoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgPiBNQVhfU0NSSVBUX1RJTUVPVVQpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IENhbmNlbGxhdGlvbkVycm9yKGDku7vli5nlt7Llj5bmtogg5pys5qyh5bCH5LiN5pyD5Z+36KGMICR7cGF0aE1haW59LCAke25vdmVsSUR9YCkpXG5cdFx0XHR9XG5cblx0XHRcdGxldCBucCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0aWYgKCFmcy5leGlzdHNTeW5jKG5wKSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycsIGlkKSk7XG5cblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgYmluID0gcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnYmluL19kb19zZWdtZW50LmpzJyk7XG5cblx0XHRcdGxldCBfcnVuX2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdFx0XHRfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdID0gX2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXSB8fCB7fTtcblxuXHRcdFx0bGV0IF9jdXJyZW50X2RhdGEgPSBfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdW25vdmVsSURdID0gX2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXVtub3ZlbElEXSB8fCB7fTtcblxuXHRcdFx0bGV0IF9oYW5kbGVfbGlzdDogc3RyaW5nW10gPSBbXTtcblxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZGlyID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJywgcGF0aE1haW4pO1xuXHRcdFx0XHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oZGlyLCBub3ZlbElEICsgJy5qc29uJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGUpXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdF9oYW5kbGVfbGlzdC5wdXNoKC4uLmxzKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChlID0+IG51bGwpXG5cdFx0XHRcdDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9jdXJyZW50X2RhdGEuZF92ZXIgIT0gX2RfdmVyIHx8IF9jdXJyZW50X2RhdGEuc192ZXIgIT0gX3NfdmVyKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmRlYnVnKHtcblx0XHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdHNfdmVyOiBfY3VycmVudF9kYXRhLnNfdmVyLFxuXHRcdFx0XHRcdGRfdmVyOiBfY3VycmVudF9kYXRhLmRfdmVyLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfcnVuX2FsbCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdub2RlJywgW1xuXHRcdFx0XHQnLS1tYXgtb2xkLXNwYWNlLXNpemU9MjA0OCcsXG5cdFx0XHRcdC8vJy0tZXhwb3NlLWdjJyxcblx0XHRcdFx0YmluLFxuXHRcdFx0XHQnLS1wYXRoTWFpbicsXG5cdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHQnLS1ub3ZlbElEJyxcblx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0Jy0tcnVuQWxsJyxcblx0XHRcdFx0U3RyaW5nKF9ydW5fYWxsKSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBESVNUX05PVkVMLFxuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChjcC5zdGF0dXMgPiAwKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW1NlZ21lbnRdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRjd2Q6IERJU1RfTk9WRUwsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGF3YWl0IGZzLm91dHB1dEpTT04oX2NhY2hlX2ZpbGVfc2VnbWVudCwgX2NhY2hlX3NlZ21lbnQsIHtcblx0XHRcdFx0XHRzcGFjZXM6IFwiXFx0XCIsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkaXIgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnLCBwYXRoTWFpbik7XG5cdFx0XHRcdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihkaXIsIG5vdmVsSUQgKyAnLmpzb24nKTtcblx0XHRcdFx0bGV0IGpzb25maWxlX2RvbmUgPSBqc29uZmlsZSArICcuZG9uZSc7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGVfZG9uZSlcblx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHM6IHN0cmluZ1tdKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBDV0RfSU4gPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdFx0XHRsZXQgY2prX2NoYW5nZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRcdFx0XHRcdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhDV0RfSU4pKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGxzID0gKGxzIHx8IFtdKVxuXHRcdFx0XHRcdFx0XHQuY29uY2F0KF9oYW5kbGVfbGlzdClcblx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0bHMgPSBhcnJheV91bmlxdWVfb3ZlcndyaXRlKGxzKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFscy5sZW5ndGggfHwgIWxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiBCbHVlYmlyZFxuXHRcdFx0XHRcdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZmlsZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChwYXRoLmV4dG5hbWUoZmlsZSkgPT0gJy50eHQnKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBmdWxscGF0aCA9IHBhdGguam9pbihDV0RfSU4sIGZpbGUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnMubG9hZEZpbGUoZnVsbHBhdGgsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXV0b0RlY29kZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGJ1Zilcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChidWYgJiYgYnVmLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgdHh0X29sZCA9IFN0cmluZyhidWYpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9uZXcgPSBkb19jbjJ0d19taW4odHh0X29sZClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL15cXHMqXFxuLywgJycpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8oPzw9XFxuKVxccypcXG5cXHMqJC8sICcnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodHh0X29sZCAhPSB0eHRfbmV3ICYmIHR4dF9uZXcpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNqa19jaGFuZ2VkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnMud3JpdGVGaWxlKGZ1bGxwYXRoLCB0eHRfbmV3KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGBbY2prLWNvbnZdYCwgZmlsZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBmdWxscGF0aDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoYnVmKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0Lm1hcFNlcmllcyhmdW5jdGlvbiAoZnVsbHBhdGgpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRmdWxscGF0aCAmJiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRmdWxscGF0aCxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVsbHBhdGhcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNqa19jaGFuZ2VkKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRgW2Nqay1jb252XSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXHRcdFx0fVxuXG5cdFx0XHRfY3VycmVudF9kYXRhLmxhc3Rfc192ZXIgPSBfY3VycmVudF9kYXRhLnNfdmVyO1xuXHRcdFx0X2N1cnJlbnRfZGF0YS5sYXN0X2RfdmVyID0gX2N1cnJlbnRfZGF0YS5kX3ZlcjtcblxuXHRcdFx0X2N1cnJlbnRfZGF0YS5zX3ZlciA9IF9zX3Zlcjtcblx0XHRcdF9jdXJyZW50X2RhdGEuZF92ZXIgPSBfZF92ZXI7XG5cblx0XHRcdHJldHVybiBjcC5zdGF0dXM7XG5cdFx0fSlcblx0XHQudGhlbigoKSA9PiB0cnVlKVxuXHRcdC5jYXRjaChDYW5jZWxsYXRpb25FcnJvciwgKGU6IENhbmNlbGxhdGlvbkVycm9yKSA9PiB7XG5cblx0XHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pXG5cdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxhc3Rfc192ZXIgPSBfY2FjaGVfc2VnbWVudC5zX3Zlcjtcblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxhc3RfZF92ZXIgPSBfY2FjaGVfc2VnbWVudC5kX3ZlcjtcblxuXHRcdFx0X2NhY2hlX3NlZ21lbnQuc192ZXIgPSBfc192ZXI7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5kX3ZlciA9IF9kX3ZlcjtcblxuXHRcdFx0YXdhaXQgZnMub3V0cHV0SlNPTihfY2FjaGVfZmlsZV9zZWdtZW50LCBfY2FjaGVfc2VnbWVudCwge1xuXHRcdFx0XHRzcGFjZXM6IFwiXFx0XCIsXG5cdFx0XHR9KTtcblx0XHR9KVxuXHQ7XG5cblx0cmV0dXJuIGNhbmNlbGxhYmxlUHJvbWlzZVxuXHRcdC5jYXRjaChDYW5jZWxsYXRpb25FcnJvciwgKGUpID0+IHtcblxuXHRcdFx0cmV0dXJuIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblxuXHRcdH0pO1xufVxuIl19