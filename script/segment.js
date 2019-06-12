"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const index_1 = require("../index");
const util_1 = require("../lib/util");
const project_config_1 = require("../project.config");
const fs = require("fs-extra");
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
            let text = await fs.readFile(fillpath)
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
                        return await fs.readFile(fullpath)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtCQUFnQztBQUNoQyxvQ0FBMEM7QUFDMUMsc0NBQXFDO0FBQ3JDLHNEQUFzRTtBQUN0RSwrQkFBZ0M7QUFDaEMsMkNBQWtFO0FBQ2xFLHVEQUFnRDtBQUVoRCxzQ0FBdUM7QUFDdkMsb0NBQXFDO0FBQ3JDLG1EQUFzQztBQUN0QyxvQ0FBaUM7QUFDakMscUNBQXNDO0FBR3RDLHVDQUEyRDtBQUczRCxzQ0FBMkM7QUFDM0MsMkRBQTREO0FBRWpELFFBQUEsVUFBVSxHQUFHLHdCQUFhLENBQUMsVUFBVSxDQUFDO0FBRXRDLFFBQUEsYUFBYSxHQUFHLElBQUksQ0FBQztBQUluQixRQUFBLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUVwQyxRQUFBLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBb0IxRSxTQUFnQixhQUFhLENBQUMsT0FBaUI7SUFFOUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSx3QkFBYSxDQUFDLFVBQVUsQ0FBQztJQUVsRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFOUQsT0FBTyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFaEUsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNsRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRXZFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLElBQUk7UUFDeEMsVUFBVTtLQUNWLENBQUM7SUFFRixhQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV4RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFO1FBQzVELEdBQUcsRUFBRSxNQUFNO0tBRVgsQ0FBNkIsQ0FBQztTQUM5QixJQUFJLENBQUMsVUFBVSxFQUFFO1FBRWpCLE9BQU8sY0FBYyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwQyxDQUFDLENBQUMsQ0FDRDtBQUNILENBQUM7QUExQkQsc0NBMEJDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLEVBQVksRUFBRSxPQUFpQjtJQUU3RCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLHdCQUFhLENBQUMsVUFBVSxDQUFDO0lBRWxFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU5RCxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUVoRSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFdkUsT0FBTyxPQUFPO1NBQ1osT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUNYLEdBQUcsQ0FBQyxVQUFVLEVBQUU7UUFFaEIsSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDbEI7WUFDQyxzQkFBc0I7WUFFdEIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLHFCQUFhLENBQUMsQ0FBQztTQUNyQztJQUNGLENBQUMsQ0FBQztTQUNELElBQUksQ0FBQyxLQUFLLFdBQVcsRUFBRTtRQUV2QixJQUFJLEtBQUssR0FBRyxZQUFZLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQyxhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXBCLGFBQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVyQyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFFdEIsSUFBSSxTQUFTLEdBQUcsRUFBYyxDQUFDO1FBRS9CLElBQUksRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxXQUFXLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTTtZQUV2RSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7WUFFakIsc0JBQXNCO1lBRTFCLG9DQUFvQztZQUVoQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVoRCw0QkFBNEI7WUFDNUIsZ0NBQWdDO1lBRTVCLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUNoQztnQkFDQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVyQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQ3BCO29CQUNDLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDdkQ7Z0JBRUQsT0FBTztvQkFDTixJQUFJO29CQUNKLE9BQU8sRUFBRSxLQUFLO29CQUNkLE1BQU0sRUFBRSxLQUFLO2lCQUNiLENBQUM7YUFDRjtpQkFDSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFDL0I7Z0JBQ0MsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFckIsT0FBTztvQkFDTixJQUFJO29CQUNKLE9BQU8sRUFBRSxLQUFLO29CQUNkLE1BQU0sRUFBRSxJQUFJO2lCQUNaLENBQUM7YUFDRjtZQUVELElBQUksSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7aUJBQ3BDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHFCQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FDOUI7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQzdCO2dCQUNDLGdDQUFnQztnQkFFaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFckIsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUNwQjtvQkFDQyxNQUFNLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ3ZEO2dCQUVELE9BQU87b0JBQ04sSUFBSTtvQkFDSixPQUFPLEVBQUUsS0FBSztvQkFDZCxNQUFNLEVBQUUsSUFBSTtpQkFDWixDQUFDO2FBQ0Y7WUFFRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFdEIsSUFBSSxFQUFFLEdBQUcsTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFaEMsSUFBSSxRQUFRLEdBQUcsTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTNDLElBQUksT0FBTyxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUM7WUFFL0IsSUFBSSxPQUFPLEVBQ1g7Z0JBQ0osd0NBQXdDO2dCQUVuQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUU1QyxhQUFhLEVBQUUsQ0FBQzthQUNoQjtZQUVELElBQUksT0FBTyxFQUNYO2FBRUM7aUJBRUQ7Z0JBQ0MsK0JBQStCO2FBQy9CO1lBRUQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVyQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQ3BCO2dCQUNDLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN2RDtZQUVELEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFVixJQUFJLEdBQUcsU0FBUyxDQUFDO1lBQ2pCLFFBQVEsR0FBRyxTQUFTLENBQUM7WUFFckIsT0FBTztnQkFDTixJQUFJO2dCQUNKLE9BQU87Z0JBQ1AsTUFBTSxFQUFFLElBQUk7YUFDWixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxhQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZCLGFBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsaUJBQWlCLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFFMUUsT0FBTztZQUNOLEVBQUU7WUFDRixTQUFTO1lBQ1QsS0FBSyxFQUFFO2dCQUNOLElBQUksRUFBRSxFQUFFLENBQUMsTUFBTTtnQkFDZixPQUFPLEVBQUUsYUFBYTtnQkFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2FBQ3RCO1NBQ0QsQ0FBQTtJQUNGLENBQUMsQ0FBQyxDQUNEO0FBQ0gsQ0FBQztBQTdKRCx3Q0E2SkM7QUFFRCxTQUFnQixLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxVQUFVLEdBQUcsd0JBQWEsQ0FBQyxVQUFVO0lBRTdFLElBQUksQ0FBUyxDQUFDO0lBRWQsSUFDQTtRQUNDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDL0M7SUFDRCxPQUFPLENBQUMsRUFDUjtRQUNDLGFBQU8sQ0FBQyxHQUFHLENBQUM7WUFDWCxVQUFVO1lBQ1YsUUFBUTtZQUNSLE9BQU87U0FDUCxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsQ0FBQztLQUNSO0lBRUQsT0FBTyxDQUFDLENBQUM7QUFDVixDQUFDO0FBcEJELHNCQW9CQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxPQUFpQjtJQUUzQyxJQUFJLENBQUMsT0FBTyxFQUNaO1FBQ0MsSUFBSSxDQUFDLHNCQUFjLEVBQ25CO1lBQ0MsT0FBTyxHQUFHLHNCQUFjLEdBQUcsYUFBYSxFQUFFLENBQUM7WUFFM0MsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ25DO1FBRUQsT0FBTyxHQUFHLHNCQUFjLENBQUM7S0FDekI7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNoQixDQUFDO0FBZkQsZ0NBZUM7QUFFRCxTQUFnQixpQkFBaUI7SUFFaEMsSUFBSSxVQUFVLEdBQUcsa0JBQVUsQ0FBQztJQUU1QixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQzdCO1FBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3JDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDMUI7QUFDRixDQUFDO0FBVEQsOENBU0M7QUFFRCxTQUFnQixhQUFhLENBQUMsV0FBb0IsSUFBSTtJQUVyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUM7UUFDM0IsT0FBTyxFQUFFLElBQUk7UUFFYixnQkFBZ0IsRUFBRTtZQUVqQixjQUFjLEVBQUUsSUFBSTtTQUVwQjtLQUNELENBQUMsQ0FBQztJQUVILElBQUksVUFBVSxHQUFHLGtCQUFVLENBQUM7SUFFNUIsSUFBSSxPQUFPLEdBQUc7UUFDYjs7V0FFRztRQUNILE9BQU8sRUFBRSxJQUFJO0tBQ2IsQ0FBQztJQUVGLGFBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFeEI7O09BRUc7SUFDSCxJQUFJLFFBQVEsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUN6QztRQUNDLDZCQUE2QjtRQUU3QixJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWpDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7UUFFMUMsaUNBQWlDO1FBRWpDLElBQUksRUFBRSxHQUFHLHFCQUFhLEVBQ3RCO1lBQ0Msc0JBQXNCO1lBRXRCLDBCQUEwQjtZQUUxQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUU5RCxnQkFBVSxDQUFDLE9BQU8sRUFBRTtnQkFDbkIsR0FBRyxPQUFPO2dCQUNWLE1BQU0sRUFBRSxJQUFJO2FBQ1osQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBRXpCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBRXRCLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxHQUFHLFNBQVMsQ0FBQztTQUNqQjtLQUNEO0lBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQ25CO1FBQ0MsMEJBQTBCO1FBQzFCLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFMUIsUUFBUTtRQUNSLDZDQUE2QztLQUM3QztJQUVELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFeEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBRS9CLHVDQUF1QztJQUV2QyxhQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRTNCLElBQUksUUFBUSxJQUFJLFVBQVUsRUFDMUI7UUFDQyxnQ0FBZ0M7UUFFaEMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUM1QyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7U0FDbEIsQ0FBQyxDQUFDLENBQUM7S0FDSjtJQUVELGFBQU0sRUFBRSxDQUFDO0lBRVQsT0FBTyxPQUFPLENBQUM7QUFDaEIsQ0FBQztBQXpGRCxzQ0F5RkM7QUFFRCxTQUFnQixXQUFXLENBQUMsT0FBZ0I7SUFFM0MsT0FBTyxPQUFPLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLFVBQVU7SUFFekIsSUFBSSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRTFFLElBQUksY0FtQkgsQ0FBQztJQUVGLElBQUksTUFBTSxHQUFXLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ3JFLElBQUksTUFBTSxHQUFXLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBRXBFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUN0QztRQUNDLElBQ0E7WUFDQyxjQUFjLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQ3REO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7U0FFQztLQUNEO0lBRUQsYUFBYTtJQUNiLGNBQWMsR0FBRyxjQUFjLElBQUksRUFBRSxDQUFDO0lBQ3RDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7SUFFaEQ7UUFDQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsY0FBYyxDQUFDO1FBQzlELGFBQU8sQ0FBQyxLQUFLLENBQUM7WUFDYixNQUFNO1lBQ04sTUFBTTtZQUVOLEtBQUs7WUFDTCxLQUFLO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsSUFBSSxLQUFLLElBQUksTUFBTSxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQ3RDO1lBQ0MsaUJBQWlCLEVBQUUsQ0FBQztTQUNwQjtLQUNEO0lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzdCLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFFMUMsSUFBSSxrQkFBa0IsR0FBRyxRQUFRO1NBQy9CLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDbkIsVUFBVTtLQUNWLEVBQUU7UUFDRixHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7S0FDakQsQ0FBQyxFQUFFLEtBQUssV0FBVyxFQUFVO1FBRTdCLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3QyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsR0FBRyxrQkFBa0IsRUFDakQ7WUFDQyxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSw0QkFBaUIsQ0FBQyxpQkFBaUIsUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUN0RjtRQUVELElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFbEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQ3RCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFakMsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEUsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNWO1FBRUQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBRXRFLElBQUksUUFBUSxHQUFZLEtBQUssQ0FBQztRQUU5QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRWxFLElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFeEcsSUFBSSxZQUFZLEdBQWEsRUFBRSxDQUFDO1FBRWhDO1lBQ0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakUsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBRWpELE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7aUJBQ3pCLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBRWpCLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUMxQixDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQ2pCO1NBQ0Q7UUFFRCxJQUFJLGFBQWEsQ0FBQyxLQUFLLElBQUksTUFBTSxJQUFJLGFBQWEsQ0FBQyxLQUFLLElBQUksTUFBTSxFQUNsRTtZQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ2IsUUFBUTtnQkFDUixPQUFPO2dCQUNQLEtBQUssRUFBRSxhQUFhLENBQUMsS0FBSztnQkFDMUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO2FBQzFCLENBQUMsQ0FBQztZQUVILFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDaEI7UUFFRCxJQUFJLEVBQUUsR0FBRyxzQkFBYyxDQUFDLE1BQU0sRUFBRTtZQUMvQiwyQkFBMkI7WUFDM0IsZ0JBQWdCO1lBQ2hCLEdBQUc7WUFDSCxZQUFZO1lBQ1osUUFBUTtZQUNSLFdBQVc7WUFDWCxPQUFPO1lBQ1AsVUFBVTtZQUNWLE1BQU0sQ0FBQyxRQUFRLENBQUM7U0FDaEIsRUFBRTtZQUNGLEtBQUssRUFBRSxTQUFTO1lBQ2hCLEdBQUcsRUFBRSxrQkFBVTtTQUNmLENBQUMsQ0FBQztRQUVILElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ2pCO1lBQ0Msc0JBQWMsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3JCLFFBQVE7Z0JBQ1IsSUFBSTtnQkFDSixJQUFJO2dCQUNKLGFBQWEsUUFBUSxJQUFJLE9BQU8sRUFBRTthQUNsQyxFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHLEVBQUUsa0JBQVU7YUFDZixDQUFDLENBQUM7WUFFSCxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO2dCQUN4RCxNQUFNLEVBQUUsSUFBSTthQUNaLENBQUMsQ0FBQztTQUNIO1FBRUQ7WUFDQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNqRSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7WUFDakQsSUFBSSxhQUFhLEdBQUcsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUV2QyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO2lCQUM5QixJQUFJLENBQUMsS0FBSyxXQUFXLEVBQVk7Z0JBRWpDLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksV0FBVyxHQUFZLEtBQUssQ0FBQztnQkFFakMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQzlCO29CQUNDLE9BQU87aUJBQ1A7Z0JBRUQsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQztxQkFDYixNQUFNLENBQUMsWUFBWSxDQUFDLENBQ3JCO2dCQUVELEVBQUUsR0FBRywyQ0FBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFaEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLEVBQ3JCO29CQUNDLE9BQU87aUJBQ1A7Z0JBRUQsT0FBTyxRQUFRO3FCQUNiLFNBQVMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxXQUFXLElBQUk7b0JBRWxDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEVBQ2hDO3dCQUNDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUV2QyxPQUFPLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7NkJBQ2hDLElBQUksQ0FBQyxVQUFVLEdBQUc7NEJBRWxCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQ3JCO2dDQUNDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDMUIsSUFBSSxPQUFPLEdBQUcsbUJBQVksQ0FBQyxPQUFPLENBQUM7cUNBQ2pDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO3FDQUNyQixPQUFPLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQ2hDO2dDQUVELElBQUksT0FBTyxJQUFJLE9BQU8sSUFBSSxPQUFPLEVBQ2pDO29DQUNDLFdBQVcsR0FBRyxJQUFJLENBQUM7b0NBRW5CLE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDO3lDQUNwQyxJQUFJLENBQUM7d0NBRUwsYUFBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7d0NBRXBDLE9BQU8sUUFBUSxDQUFDO29DQUNqQixDQUFDLENBQUMsQ0FBQTtpQ0FDSDtnQ0FFRCxPQUFPLElBQUksQ0FBQzs2QkFDWjs0QkFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzVCLENBQUMsQ0FBQzs2QkFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQ1YsYUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7NEJBQ3pCLE9BQU8sSUFBSSxDQUFDO3dCQUNiLENBQUMsQ0FBQyxDQUNEO3FCQUNGO2dCQUNGLENBQUMsQ0FBQztxQkFDRCxTQUFTLENBQUMsVUFBVSxRQUFRO29CQUU1QixRQUFRLElBQUksc0JBQWMsQ0FBQyxLQUFLLEVBQUU7d0JBQ2pDLEtBQUs7d0JBQ0wsUUFBUTtxQkFDUixFQUFFO3dCQUNGLEtBQUssRUFBRSxTQUFTO3dCQUNoQixHQUFHLEVBQUUsTUFBTTtxQkFDWCxDQUFDLENBQUM7b0JBRUgsT0FBTyxRQUFRLENBQUE7Z0JBQ2hCLENBQUMsQ0FBQztxQkFDRCxHQUFHLENBQUM7b0JBRUosSUFBSSxXQUFXLEVBQ2Y7d0JBQ0Msc0JBQWMsQ0FBQyxLQUFLLEVBQUU7NEJBQ3JCLFFBQVE7NEJBQ1IsSUFBSTs0QkFDSixjQUFjLFFBQVEsSUFBSSxPQUFPLEVBQUU7eUJBQ25DLEVBQUU7NEJBQ0YsS0FBSyxFQUFFLFNBQVM7NEJBQ2hCLEdBQUcsRUFBRSxNQUFNO3lCQUNYLENBQUMsQ0FBQztxQkFDSDtnQkFDRixDQUFDLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1YsYUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQ0Y7U0FDRDtRQUVELGFBQWEsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUMvQyxhQUFhLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7UUFFL0MsYUFBYSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDN0IsYUFBYSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFFN0IsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUMsQ0FBQztTQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDaEIsS0FBSyxDQUFDLDRCQUFpQixFQUFFLENBQUMsQ0FBb0IsRUFBRSxFQUFFO1FBRWxELGFBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXpCLE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQyxDQUFDO1NBQ0QsR0FBRyxDQUFDLEtBQUs7UUFFVCxjQUFjLENBQUMsVUFBVSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFDakQsY0FBYyxDQUFDLFVBQVUsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO1FBRWpELGNBQWMsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBQzlCLGNBQWMsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBRTlCLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQUU7WUFDeEQsTUFBTSxFQUFFLElBQUk7U0FDWixDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FDRjtJQUVELE9BQU8sa0JBQWtCO1NBQ3ZCLEtBQUssQ0FBQyw0QkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1FBRS9CLE9BQU8sYUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFakMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBdFNELGdDQXNTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IHBhdGggPSByZXF1aXJlKFwidXBhdGgyXCIpO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBmcmVlR0MgfSBmcm9tICcuLi9saWIvdXRpbCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZywgeyBNQVhfU0NSSVBUX1RJTUVPVVQgfSBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IHsgdXNlRGVmYXVsdCwgZ2V0RGVmYXVsdE1vZExpc3QgfSBmcm9tICdub3ZlbC1zZWdtZW50L2xpYic7XG5pbXBvcnQgU2VnbWVudCBmcm9tICdub3ZlbC1zZWdtZW50L2xpYi9TZWdtZW50JztcbmltcG9ydCBUYWJsZURpY3QgZnJvbSAnbm92ZWwtc2VnbWVudC9saWIvdGFibGUvZGljdCc7XG5pbXBvcnQgRmFzdEdsb2IgPSByZXF1aXJlKCdmYXN0LWdsb2InKTtcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCB7IGNybGYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgQmx1ZWJpcmRDYW5jZWxsYXRpb24gZnJvbSAnYmx1ZWJpcmQtY2FuY2VsbGF0aW9uJztcbmltcG9ydCB7IENhbmNlbGxhdGlvbkVycm9yLCBUaW1lb3V0RXJyb3IgfSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgZnNJY29udiA9IHJlcXVpcmUoJ2ZzLWljb252Jyk7XG5pbXBvcnQgeyB0dzJjbl9taW4sIGNuMnR3X21pbiwgdGFibGVDbjJUd0RlYnVnLCB0YWJsZVR3MkNuRGVidWcgfSBmcm9tICdjamstY29udi9saWIvemgvY29udmVydC9taW4nO1xuaW1wb3J0IHsgZG9fY24ydHdfbWluIH0gZnJvbSAnLi4vbGliL2NvbnYnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlX292ZXJ3cml0ZSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5cbmV4cG9ydCBsZXQgRElTVF9OT1ZFTCA9IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuZXhwb3J0IGxldCBDQUNIRV9USU1FT1VUID0gMzYwMDtcblxuZXhwb3J0IGxldCBfc2VnbWVudE9iamVjdDogU2VnbWVudDtcblxuZXhwb3J0IGNvbnN0IEVSUk9SX01TR18wMDEgPSBg5rKS5pyJ5pCc5bCL5Yiw5Lu75L2V5qqU5qGIIOiri+aqouafpeaQnOWwi+aineS7tmA7XG5cbmV4cG9ydCBjb25zdCBDQUNIRV9GSUxFID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2NhY2hlLmRiJyk7XG5cbmV4cG9ydCB0eXBlIElPcHRpb25zID0ge1xuXHRwYXRoTWFpbjogc3RyaW5nLFxuXHRwYXRoTWFpbl9vdXQ/OiBzdHJpbmcsXG5cdG5vdmVsSUQ6IHN0cmluZyxcblxuXHRzZWdtZW50PzogU2VnbWVudCxcblxuXHRub3ZlbF9yb290Pzogc3RyaW5nLFxuXG5cdGdsb2JQYXR0ZXJuPzogc3RyaW5nW10sXG5cblx0ZmlsZXM/OiBzdHJpbmdbXSxcblxuXHRoaWRlTG9nPzogYm9vbGVhbixcblxuXHRjYWxsYmFjaz8oZG9uZV9saXN0OiBzdHJpbmdbXSwgZmlsZTogc3RyaW5nLCBpbmRleDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciksXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZG9TZWdtZW50R2xvYihvcHRpb25zOiBJT3B0aW9ucylcbntcblx0Y29uc3Qgbm92ZWxfcm9vdCA9IG9wdGlvbnMubm92ZWxfcm9vdCB8fCBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG5cblx0Y29uc3Qgc2VnbWVudCA9IG9wdGlvbnMuc2VnbWVudCA9IGdldFNlZ21lbnQob3B0aW9ucy5zZWdtZW50KTtcblxuXHRvcHRpb25zLnBhdGhNYWluX291dCA9IG9wdGlvbnMucGF0aE1haW5fb3V0IHx8IG9wdGlvbnMucGF0aE1haW47XG5cblx0bGV0IENXRF9JTiA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW4sIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cdGxldCBDV0RfT1VUID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbl9vdXQsIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cblx0bGV0IGdsb2JQYXR0ZXJuID0gb3B0aW9ucy5nbG9iUGF0dGVybiB8fCBbXG5cdFx0JyoqLyoudHh0Jyxcblx0XTtcblxuXHRjb25zb2xlLmluZm8oJ1tkb10nLCBvcHRpb25zLnBhdGhNYWluLCBvcHRpb25zLm5vdmVsSUQpO1xuXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUob3B0aW9ucy5maWxlcyB8fCBGYXN0R2xvYihnbG9iUGF0dGVybiwge1xuXHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHQvL2Fic29sdXRlOiB0cnVlLFxuXHRcdH0pIGFzIGFueSBhcyBQcm9taXNlPHN0cmluZ1tdPilcblx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9kb1NlZ21lbnRHbG9iKGxzLCBvcHRpb25zKTtcblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9kb1NlZ21lbnRHbG9iKGxzOiBzdHJpbmdbXSwgb3B0aW9uczogSU9wdGlvbnMpXG57XG5cdGNvbnN0IG5vdmVsX3Jvb3QgPSBvcHRpb25zLm5vdmVsX3Jvb3QgfHwgUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5cdGNvbnN0IHNlZ21lbnQgPSBvcHRpb25zLnNlZ21lbnQgPSBnZXRTZWdtZW50KG9wdGlvbnMuc2VnbWVudCk7XG5cblx0b3B0aW9ucy5wYXRoTWFpbl9vdXQgPSBvcHRpb25zLnBhdGhNYWluX291dCB8fCBvcHRpb25zLnBhdGhNYWluO1xuXG5cdGxldCBDV0RfSU4gPSBfcGF0aChvcHRpb25zLnBhdGhNYWluLCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXHRsZXQgQ1dEX09VVCA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW5fb3V0LCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXG5cdHJldHVybiBQcm9taXNlXG5cdFx0LnJlc29sdmUobHMpXG5cdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0e1xuXHRcdFx0aWYgKGxzLmxlbmd0aCA9PSAwKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKENXRF9JTik7XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KEVSUk9SX01TR18wMDEpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKGxzKVxuXHRcdHtcblx0XHRcdGxldCBsYWJlbCA9IGBhbGwgZmlsZSAke2xzLmxlbmd0aH1gO1xuXHRcdFx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRcdFx0Y29uc29sZS5sb2coYGFsbCBmaWxlICR7bHMubGVuZ3RofWApO1xuXG5cdFx0XHRsZXQgY291bnRfY2hhbmdlZCA9IDA7XG5cblx0XHRcdGxldCBkb25lX2xpc3QgPSBbXSBhcyBzdHJpbmdbXTtcblxuXHRcdFx0bGV0IHJzID0gYXdhaXQgUHJvbWlzZS5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChmaWxlLCBpbmRleCwgbGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgbGFiZWwgPSBmaWxlO1xuXG5cdFx0XHRcdC8vY29uc29sZS50aW1lKGxhYmVsKTtcblxuLy9cdFx0XHRcdGNvbnNvbGUubG9nKCdbc3RhcnRdJywgbGFiZWwpO1xuXG5cdFx0XHRcdGxldCBmaWxscGF0aCA9IHBhdGguam9pbihDV0RfSU4sIGZpbGUpO1xuXHRcdFx0XHRsZXQgZmlsbHBhdGhfb3V0ID0gcGF0aC5qb2luKENXRF9PVVQsIGZpbGUpO1xuXG4vL1x0XHRcdFx0Y29uc29sZS5sb2coZmlsbHBhdGgpO1xuLy9cdFx0XHRcdGNvbnNvbGUubG9nKGZpbGxwYXRoX291dCk7XG5cblx0XHRcdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhmaWxscGF0aCkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmNhbGxiYWNrKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGF3YWl0IG9wdGlvbnMuY2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdGNoYW5nZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXhpc3RzOiBmYWxzZSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKCFmaWxlLm1hdGNoKC9cXC50eHQkL2kpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdGNoYW5nZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXhpc3RzOiB0cnVlLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgdGV4dCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGxwYXRoKVxuXHRcdFx0XHRcdC50aGVuKHYgPT4gY3JsZih2LnRvU3RyaW5nKCkpKVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0aWYgKCF0ZXh0LnJlcGxhY2UoL1xccysvZywgJycpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLndhcm4oJ1tza2lwXScsIGxhYmVsKTtcblxuXHRcdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0YXdhaXQgb3B0aW9ucy5jYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0Y2hhbmdlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRleGlzdHM6IHRydWUsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBfbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRsZXQga3MgPSBhd2FpdCBzZWdtZW50LmRvU2VnbWVudCh0ZXh0KTtcblxuXHRcdFx0XHRsZXQgdGltZXVzZSA9IERhdGUubm93KCkgLSBfbm93O1xuXG5cdFx0XHRcdGxldCB0ZXh0X25ldyA9IGF3YWl0IHNlZ21lbnQuc3RyaW5naWZ5KGtzKTtcblxuXHRcdFx0XHRsZXQgY2hhbmdlZCA9IHRleHRfbmV3ICE9IHRleHQ7XG5cblx0XHRcdFx0aWYgKGNoYW5nZWQpXG5cdFx0XHRcdHtcbi8vXHRcdFx0XHRcdGNvbnNvbGUud2FybignW2NoYW5nZWRdJywgbGFiZWwpO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxscGF0aF9vdXQsIHRleHRfbmV3KTtcblxuXHRcdFx0XHRcdGNvdW50X2NoYW5nZWQrKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjaGFuZ2VkKVxuXHRcdFx0XHR7XG5cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbZG9uZV0nLCBsYWJlbCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRpZiAob3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IG9wdGlvbnMuY2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGtzID0gbnVsbDtcblxuXHRcdFx0XHR0ZXh0ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR0ZXh0X25ldyA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0Y2hhbmdlZCxcblx0XHRcdFx0XHRleGlzdHM6IHRydWUsXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRcdFx0Y29uc29sZVtjb3VudF9jaGFuZ2VkID8gJ29rJyA6ICdkZWJ1ZyddKGBmaWxlIGNoYW5nZWQ6ICR7Y291bnRfY2hhbmdlZH1gKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bHMsXG5cdFx0XHRcdGRvbmVfbGlzdCxcblx0XHRcdFx0Y291bnQ6IHtcblx0XHRcdFx0XHRmaWxlOiBscy5sZW5ndGgsXG5cdFx0XHRcdFx0Y2hhbmdlZDogY291bnRfY2hhbmdlZCxcblx0XHRcdFx0XHRkb25lOiBkb25lX2xpc3QubGVuZ3RoLFxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQsIG5vdmVsX3Jvb3QgPSBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpOiBzdHJpbmdcbntcblx0bGV0IHA6IHN0cmluZztcblxuXHR0cnlcblx0e1xuXHRcdHAgPSBwYXRoLnJlc29sdmUobm92ZWxfcm9vdCwgcGF0aE1haW4sIG5vdmVsSUQpXG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblx0XHRjb25zb2xlLmRpcih7XG5cdFx0XHRub3ZlbF9yb290LFxuXHRcdFx0cGF0aE1haW4sXG5cdFx0XHRub3ZlbElELFxuXHRcdH0pO1xuXG5cdFx0dGhyb3cgZTtcblx0fVxuXG5cdHJldHVybiBwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VnbWVudChzZWdtZW50PzogU2VnbWVudClcbntcblx0aWYgKCFzZWdtZW50KVxuXHR7XG5cdFx0aWYgKCFfc2VnbWVudE9iamVjdClcblx0XHR7XG5cdFx0XHRzZWdtZW50ID0gX3NlZ21lbnRPYmplY3QgPSBjcmVhdGVTZWdtZW50KCk7XG5cblx0XHRcdGxldCBkYl9kaWN0ID0gZ2V0RGljdE1haW4oc2VnbWVudCk7XG5cdFx0fVxuXG5cdFx0c2VnbWVudCA9IF9zZWdtZW50T2JqZWN0O1xuXHR9XG5cblx0cmV0dXJuIHNlZ21lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldFNlZ21lbnRDYWNoZSgpXG57XG5cdGxldCBjYWNoZV9maWxlID0gQ0FDSEVfRklMRTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhjYWNoZV9maWxlKSlcblx0e1xuXHRcdGNvbnNvbGUucmVkKGBbU2VnbWVudF0gcmVzZXQgY2FjaGVgKTtcblx0XHRmcy5yZW1vdmVTeW5jKGNhY2hlX2ZpbGUpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWdtZW50KHVzZUNhY2hlOiBib29sZWFuID0gdHJ1ZSlcbntcblx0Y29uc3Qgc2VnbWVudCA9IG5ldyBTZWdtZW50KHtcblx0XHRhdXRvQ2prOiB0cnVlLFxuXG5cdFx0b3B0aW9uc0RvU2VnbWVudDoge1xuXG5cdFx0XHRjb252ZXJ0U3lub255bTogdHJ1ZSxcblxuXHRcdH0sXG5cdH0pO1xuXG5cdGxldCBjYWNoZV9maWxlID0gQ0FDSEVfRklMRTtcblxuXHRsZXQgb3B0aW9ucyA9IHtcblx0XHQvKipcblx0XHQgKiDplovllZ8gYWxsX21vZCDmiY3mnIPlnKjoh6rli5XovInlhaXmmYLljIXlkKsgWmh0U3lub255bU9wdGltaXplclxuXHRcdCAqL1xuXHRcdGFsbF9tb2Q6IHRydWUsXG5cdH07XG5cblx0Y29uc29sZS50aW1lKGDoroDlj5bmqKHntYToiIflrZflhbhgKTtcblxuXHQvKipcblx0ICog5L2/55So57ep5a2Y55qE5a2X5YW45qqU56+E5L6LXG5cdCAqL1xuXHRpZiAodXNlQ2FjaGUgJiYgZnMuZXhpc3RzU3luYyhjYWNoZV9maWxlKSlcblx0e1xuXHRcdC8vY29uc29sZS5sb2coYOeZvOePviBjYWNoZS5kYmApO1xuXG5cdFx0bGV0IHN0ID0gZnMuc3RhdFN5bmMoY2FjaGVfZmlsZSk7XG5cblx0XHRsZXQgbWQgPSAoRGF0ZS5ub3coKSAtIHN0Lm10aW1lTXMpIC8gMTAwMDtcblxuXHRcdC8vY29uc29sZS5sb2coYOi3nembouS4iuasoee3qeWtmOW3sumBjiAke21kfXNgKTtcblxuXHRcdGlmIChtZCA8IENBQ0hFX1RJTUVPVVQpXG5cdFx0e1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhzdCwgbWQpO1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGDplovlp4vovInlhaXnt6nlrZjlrZflhbhgKTtcblxuXHRcdFx0bGV0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjYWNoZV9maWxlKS50b1N0cmluZygpKTtcblxuXHRcdFx0dXNlRGVmYXVsdChzZWdtZW50LCB7XG5cdFx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRcdG5vZGljdDogdHJ1ZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRzZWdtZW50LkRJQ1QgPSBkYXRhLkRJQ1Q7XG5cblx0XHRcdHNlZ21lbnQuaW5pdGVkID0gdHJ1ZTtcblxuXHRcdFx0Y2FjaGVfZmlsZSA9IG51bGw7XG5cdFx0XHRkYXRhID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0fVxuXG5cdGlmICghc2VnbWVudC5pbml0ZWQpXG5cdHtcblx0XHQvL2NvbnNvbGUubG9nKGDph43mlrDovInlhaXliIbmnpDlrZflhbhgKTtcblx0XHRzZWdtZW50LmF1dG9Jbml0KG9wdGlvbnMpO1xuXG5cdFx0Ly8g57Ch6L2J57mB5bCI55SoXG5cdFx0Ly9zZWdtZW50LmxvYWRTeW5vbnltRGljdCgnemh0LnN5bm9ueW0udHh0Jyk7XG5cdH1cblxuXHRsZXQgZGJfZGljdCA9IHNlZ21lbnQuZ2V0RGljdERhdGFiYXNlKCdUQUJMRScsIHRydWUpO1xuXHRkYl9kaWN0LlRBQkxFID0gc2VnbWVudC5ESUNUWydUQUJMRSddO1xuXHRkYl9kaWN0LlRBQkxFMiA9IHNlZ21lbnQuRElDVFsnVEFCTEUyJ107XG5cblx0ZGJfZGljdC5vcHRpb25zLmF1dG9DamsgPSB0cnVlO1xuXG5cdC8vY29uc29sZS5sb2coJ+S4u+Wtl+WFuOe4veaVuCcsIGRiX2RpY3Quc2l6ZSgpKTtcblxuXHRjb25zb2xlLnRpbWVFbmQoYOiugOWPluaooee1hOiIh+Wtl+WFuGApO1xuXG5cdGlmICh1c2VDYWNoZSAmJiBjYWNoZV9maWxlKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhg57ep5a2Y5a2X5YW45pa8IGNhY2hlLmRiYCk7XG5cblx0XHRmcy5vdXRwdXRGaWxlU3luYyhjYWNoZV9maWxlLCBKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRESUNUOiBzZWdtZW50LkRJQ1QsXG5cdFx0fSkpO1xuXHR9XG5cblx0ZnJlZUdDKCk7XG5cblx0cmV0dXJuIHNlZ21lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaWN0TWFpbihzZWdtZW50OiBTZWdtZW50KVxue1xuXHRyZXR1cm4gc2VnbWVudC5nZXREaWN0RGF0YWJhc2UoJ1RBQkxFJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5TZWdtZW50KClcbntcblx0bGV0IF9jYWNoZV9maWxlX3NlZ21lbnQgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLnNlZ21lbnQnKTtcblxuXHRsZXQgX2NhY2hlX3NlZ21lbnQ6IHtcblxuXHRcdHNfdmVyPzogc3RyaW5nLFxuXHRcdGRfdmVyPzogc3RyaW5nLFxuXG5cdFx0bGFzdF9zX3Zlcj86IHN0cmluZyxcblx0XHRsYXN0X2RfdmVyPzogc3RyaW5nLFxuXG5cdFx0bGlzdDoge1xuXHRcdFx0W2s6IHN0cmluZ106IHtcblx0XHRcdFx0W2s6IHN0cmluZ106IHtcblx0XHRcdFx0XHRzX3Zlcj86IHN0cmluZyxcblx0XHRcdFx0XHRkX3Zlcj86IHN0cmluZyxcblxuXHRcdFx0XHRcdGxhc3Rfc192ZXI/OiBzdHJpbmcsXG5cdFx0XHRcdFx0bGFzdF9kX3Zlcj86IHN0cmluZyxcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xuXG5cdGxldCBfc192ZXI6IHN0cmluZyA9IFN0cmluZyhyZXF1aXJlKFwibm92ZWwtc2VnbWVudFwiKS52ZXJzaW9uIHx8ICcxJyk7XG5cdGxldCBfZF92ZXI6IHN0cmluZyA9IFN0cmluZyhyZXF1aXJlKFwic2VnbWVudC1kaWN0XCIpLnZlcnNpb24gfHwgJzEnKTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhfY2FjaGVfZmlsZV9zZWdtZW50KSlcblx0e1xuXHRcdHRyeVxuXHRcdHtcblx0XHRcdF9jYWNoZV9zZWdtZW50ID0gZnMucmVhZEpTT05TeW5jKF9jYWNoZV9maWxlX3NlZ21lbnQpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cdH1cblxuXHQvLyBAdHMtaWdub3JlXG5cdF9jYWNoZV9zZWdtZW50ID0gX2NhY2hlX3NlZ21lbnQgfHwge307XG5cdF9jYWNoZV9zZWdtZW50Lmxpc3QgPSBfY2FjaGVfc2VnbWVudC5saXN0IHx8IHt9O1xuXG5cdHtcblx0XHRsZXQgeyBsYXN0X3NfdmVyLCBsYXN0X2RfdmVyLCBzX3ZlciwgZF92ZXIgfSA9IF9jYWNoZV9zZWdtZW50O1xuXHRcdGNvbnNvbGUuZGVidWcoe1xuXHRcdFx0X3NfdmVyLFxuXHRcdFx0X2RfdmVyLFxuXG5cdFx0XHRzX3Zlcixcblx0XHRcdGRfdmVyLFxuXHRcdH0pO1xuXG5cdFx0aWYgKHNfdmVyICE9IF9zX3ZlciB8fCBkX3ZlciAhPSBfZF92ZXIpXG5cdFx0e1xuXHRcdFx0cmVzZXRTZWdtZW50Q2FjaGUoKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXHRjb25zdCBNQVhfU0NSSVBUX1RJTUVPVVQgPSAyMCAqIDYwICogMTAwMDtcblxuXHRsZXQgY2FuY2VsbGFibGVQcm9taXNlID0gQmx1ZWJpcmRcblx0XHQubWFwU2VyaWVzKEZhc3RHbG9iKFtcblx0XHRcdCcqLyouanNvbicsXG5cdFx0XSwge1xuXHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnKSxcblx0XHR9KSwgYXN5bmMgZnVuY3Rpb24gKGlkOiBzdHJpbmcpXG5cdFx0e1xuXHRcdFx0bGV0IFtwYXRoTWFpbiwgbm92ZWxJRF0gPSBpZC5zcGxpdCgvW1xcXFxcXC9dLyk7XG5cdFx0XHRub3ZlbElEID0gcGF0aC5iYXNlbmFtZShub3ZlbElELCAnLmpzb24nKTtcblxuXHRcdFx0aWYgKChEYXRlLm5vdygpIC0gc3RhcnRUaW1lKSA+IE1BWF9TQ1JJUFRfVElNRU9VVClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgQ2FuY2VsbGF0aW9uRXJyb3IoYOS7u+WLmeW3suWPlua2iCDmnKzmrKHlsIfkuI3mnIPln7fooYwgJHtwYXRoTWFpbn0sICR7bm92ZWxJRH1gKSlcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5wID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmMobnApKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUocGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJywgaWQpKTtcblxuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBiaW4gPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5wcm9qZWN0X3Jvb3QsICdiaW4vX2RvX3NlZ21lbnQuanMnKTtcblxuXHRcdFx0bGV0IF9ydW5fYWxsOiBib29sZWFuID0gZmFsc2U7XG5cblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF0gPSBfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdIHx8IHt9O1xuXG5cdFx0XHRsZXQgX2N1cnJlbnRfZGF0YSA9IF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF1bbm92ZWxJRF0gPSBfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdW25vdmVsSURdIHx8IHt9O1xuXG5cdFx0XHRsZXQgX2hhbmRsZV9saXN0OiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkaXIgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnLCBwYXRoTWFpbik7XG5cdFx0XHRcdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihkaXIsIG5vdmVsSUQgKyAnLmpzb24nKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZWFkSlNPTihqc29uZmlsZSlcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0X2hhbmRsZV9saXN0LnB1c2goLi4ubHMpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKGUgPT4gbnVsbClcblx0XHRcdFx0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2N1cnJlbnRfZGF0YS5kX3ZlciAhPSBfZF92ZXIgfHwgX2N1cnJlbnRfZGF0YS5zX3ZlciAhPSBfc192ZXIpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZGVidWcoe1xuXHRcdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0c192ZXI6IF9jdXJyZW50X2RhdGEuc192ZXIsXG5cdFx0XHRcdFx0ZF92ZXI6IF9jdXJyZW50X2RhdGEuZF92ZXIsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9ydW5fYWxsID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ25vZGUnLCBbXG5cdFx0XHRcdCctLW1heC1vbGQtc3BhY2Utc2l6ZT0yMDQ4Jyxcblx0XHRcdFx0Ly8nLS1leHBvc2UtZ2MnLFxuXHRcdFx0XHRiaW4sXG5cdFx0XHRcdCctLXBhdGhNYWluJyxcblx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdCctLW5vdmVsSUQnLFxuXHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHQnLS1ydW5BbGwnLFxuXHRcdFx0XHRTdHJpbmcoX3J1bl9hbGwpLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IERJU1RfTk9WRUwsXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGNwLnN0YXR1cyA+IDApXG5cdFx0XHR7XG5cdFx0XHRcdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdGBbU2VnbWVudF0gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWAsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdGN3ZDogRElTVF9OT1ZFTCxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0YXdhaXQgZnMub3V0cHV0SlNPTihfY2FjaGVfZmlsZV9zZWdtZW50LCBfY2FjaGVfc2VnbWVudCwge1xuXHRcdFx0XHRcdHNwYWNlczogXCJcXHRcIixcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHtcblx0XHRcdFx0bGV0IGRpciA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycsIHBhdGhNYWluKTtcblx0XHRcdFx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKGRpciwgbm92ZWxJRCArICcuanNvbicpO1xuXHRcdFx0XHRsZXQganNvbmZpbGVfZG9uZSA9IGpzb25maWxlICsgJy5kb25lJztcblxuXHRcdFx0XHRhd2FpdCBmcy5yZWFkSlNPTihqc29uZmlsZV9kb25lKVxuXHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChsczogc3RyaW5nW10pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IENXRF9JTiA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0XHRcdGxldCBjamtfY2hhbmdlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKENXRF9JTikpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bHMgPSAobHMgfHwgW10pXG5cdFx0XHRcdFx0XHRcdC5jb25jYXQoX2hhbmRsZV9saXN0KVxuXHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRscyA9IGFycmF5X3VuaXF1ZV9vdmVyd3JpdGUobHMpO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWxzLmxlbmd0aCB8fCAhbHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIEJsdWViaXJkXG5cdFx0XHRcdFx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChmaWxlKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHBhdGguZXh0bmFtZShmaWxlKSA9PSAnLnR4dCcpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IGZ1bGxwYXRoID0gcGF0aC5qb2luKENXRF9JTiwgZmlsZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBhd2FpdCBmcy5yZWFkRmlsZShmdWxscGF0aClcblx0XHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGJ1Zilcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChidWYgJiYgYnVmLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgdHh0X29sZCA9IFN0cmluZyhidWYpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9uZXcgPSBkb19jbjJ0d19taW4odHh0X29sZClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL15cXHMqXFxuLywgJycpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8oPzw9XFxuKVxccypcXG5cXHMqJC8sICcnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodHh0X29sZCAhPSB0eHRfbmV3ICYmIHR4dF9uZXcpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNqa19jaGFuZ2VkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnMud3JpdGVGaWxlKGZ1bGxwYXRoLCB0eHRfbmV3KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKGBbY2prLWNvbnZdYCwgZmlsZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBmdWxscGF0aDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoYnVmKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0Lm1hcFNlcmllcyhmdW5jdGlvbiAoZnVsbHBhdGgpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRmdWxscGF0aCAmJiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRmdWxscGF0aCxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVsbHBhdGhcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNqa19jaGFuZ2VkKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRgW2Nqay1jb252XSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXHRcdFx0fVxuXG5cdFx0XHRfY3VycmVudF9kYXRhLmxhc3Rfc192ZXIgPSBfY3VycmVudF9kYXRhLnNfdmVyO1xuXHRcdFx0X2N1cnJlbnRfZGF0YS5sYXN0X2RfdmVyID0gX2N1cnJlbnRfZGF0YS5kX3ZlcjtcblxuXHRcdFx0X2N1cnJlbnRfZGF0YS5zX3ZlciA9IF9zX3Zlcjtcblx0XHRcdF9jdXJyZW50X2RhdGEuZF92ZXIgPSBfZF92ZXI7XG5cblx0XHRcdHJldHVybiBjcC5zdGF0dXM7XG5cdFx0fSlcblx0XHQudGhlbigoKSA9PiB0cnVlKVxuXHRcdC5jYXRjaChDYW5jZWxsYXRpb25FcnJvciwgKGU6IENhbmNlbGxhdGlvbkVycm9yKSA9PiB7XG5cblx0XHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pXG5cdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxhc3Rfc192ZXIgPSBfY2FjaGVfc2VnbWVudC5zX3Zlcjtcblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxhc3RfZF92ZXIgPSBfY2FjaGVfc2VnbWVudC5kX3ZlcjtcblxuXHRcdFx0X2NhY2hlX3NlZ21lbnQuc192ZXIgPSBfc192ZXI7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5kX3ZlciA9IF9kX3ZlcjtcblxuXHRcdFx0YXdhaXQgZnMub3V0cHV0SlNPTihfY2FjaGVfZmlsZV9zZWdtZW50LCBfY2FjaGVfc2VnbWVudCwge1xuXHRcdFx0XHRzcGFjZXM6IFwiXFx0XCIsXG5cdFx0XHR9KTtcblx0XHR9KVxuXHQ7XG5cblx0cmV0dXJuIGNhbmNlbGxhYmxlUHJvbWlzZVxuXHRcdC5jYXRjaChDYW5jZWxsYXRpb25FcnJvciwgKGUpID0+IHtcblxuXHRcdFx0cmV0dXJuIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblxuXHRcdH0pO1xufVxuIl19