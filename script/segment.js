"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSegment = exports.getDictMain = exports.createSegment = exports.resetSegmentCache = exports.getSegment = exports._path = exports._doSegmentGlob = exports.doSegmentGlob = exports.CACHE_FILE = exports.ERROR_MSG_001 = exports._segmentObject = exports.CACHE_TIMEOUT = exports.DIST_NOVEL = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCwrQkFBZ0M7QUFDaEMsb0NBQTBDO0FBQzFDLHNDQUFxQztBQUNyQyxzREFBc0U7QUFDdEUsK0JBQWdDO0FBQ2hDLDJDQUFrRTtBQUNsRSx1REFBZ0Q7QUFFaEQsc0NBQXVDO0FBQ3ZDLG9DQUFxQztBQUNyQyxtREFBc0M7QUFDdEMsb0NBQWlDO0FBQ2pDLHFDQUFzQztBQUd0Qyx1Q0FBMkQ7QUFFM0Qsc0NBQTJDO0FBQzNDLDJEQUE0RDtBQUVqRCxRQUFBLFVBQVUsR0FBRyx3QkFBYSxDQUFDLFVBQVUsQ0FBQztBQUV0QyxRQUFBLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFJbkIsUUFBQSxhQUFhLEdBQUcsbUJBQW1CLENBQUM7QUFFcEMsUUFBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztBQW9CMUUsU0FBZ0IsYUFBYSxDQUFDLE9BQWlCO0lBRTlDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksd0JBQWEsQ0FBQyxVQUFVLENBQUM7SUFFbEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTlELE9BQU8sQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDO0lBRWhFLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbEUsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV2RSxJ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QUssR0FBRyxNQUFNLENBQUM7UUFFOUIsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRTtZQUN4RCxNQUFNLEVBQUUsSUFBSTtTQUNaLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUNGO0lBRUQsT0FBTyxrQkFBa0I7U0FDdkIsS0FBSyxDQUFDLDRCQUFpQixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFFL0IsT0FBTyxhQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVqQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUF4U0QsZ0NBd1NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC81LzE2LzAxNi5cbiAqL1xuXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoXCJ1cGF0aDJcIik7XG5pbXBvcnQgeyBjcm9zc1NwYXduU3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGZyZWVHQyB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnLCB7IE1BWF9TQ1JJUFRfVElNRU9VVCB9IGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWljb252Jyk7XG5pbXBvcnQgeyB1c2VEZWZhdWx0LCBnZXREZWZhdWx0TW9kTGlzdCB9IGZyb20gJ25vdmVsLXNlZ21lbnQvbGliJztcbmltcG9ydCBTZWdtZW50IGZyb20gJ25vdmVsLXNlZ21lbnQvbGliL1NlZ21lbnQnO1xuaW1wb3J0IFRhYmxlRGljdCBmcm9tICdub3ZlbC1zZWdtZW50L2xpYi90YWJsZS9kaWN0JztcbmltcG9ydCBGYXN0R2xvYiA9IHJlcXVpcmUoJ2Zhc3QtZ2xvYicpO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IHsgY3JsZiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBCbHVlYmlyZENhbmNlbGxhdGlvbiBmcm9tICdibHVlYmlyZC1jYW5jZWxsYXRpb24nO1xuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uRXJyb3IsIFRpbWVvdXRFcnJvciB9IGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IHR3MmNuX21pbiwgY24ydHdfbWluLCB0YWJsZUNuMlR3RGVidWcsIHRhYmxlVHcyQ25EZWJ1ZyB9IGZyb20gJ2Nqay1jb252L2xpYi96aC9jb252ZXJ0L21pbic7XG5pbXBvcnQgeyBkb19jbjJ0d19taW4gfSBmcm9tICcuLi9saWIvY29udic7XG5pbXBvcnQgeyBhcnJheV91bmlxdWVfb3ZlcndyaXRlIH0gZnJvbSAnYXJyYXktaHlwZXItdW5pcXVlJztcblxuZXhwb3J0IGxldCBESVNUX05PVkVMID0gUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5leHBvcnQgbGV0IENBQ0hFX1RJTUVPVVQgPSAzNjAwO1xuXG5leHBvcnQgbGV0IF9zZWdtZW50T2JqZWN0OiBTZWdtZW50O1xuXG5leHBvcnQgY29uc3QgRVJST1JfTVNHXzAwMSA9IGDmspLmnInmkJzlsIvliLDku7vkvZXmqpTmoYgg6KuL5qqi5p+l5pCc5bCL5qKd5Lu2YDtcblxuZXhwb3J0IGNvbnN0IENBQ0hFX0ZJTEUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnY2FjaGUuZGInKTtcblxuZXhwb3J0IHR5cGUgSU9wdGlvbnMgPSB7XG5cdHBhdGhNYWluOiBzdHJpbmcsXG5cdHBhdGhNYWluX291dD86IHN0cmluZyxcblx0bm92ZWxJRDogc3RyaW5nLFxuXG5cdHNlZ21lbnQ/OiBTZWdtZW50LFxuXG5cdG5vdmVsX3Jvb3Q/OiBzdHJpbmcsXG5cblx0Z2xvYlBhdHRlcm4/OiBzdHJpbmdbXSxcblxuXHRmaWxlcz86IHN0cmluZ1tdLFxuXG5cdGhpZGVMb2c/OiBib29sZWFuLFxuXG5cdGNhbGxiYWNrPyhkb25lX2xpc3Q6IHN0cmluZ1tdLCBmaWxlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkb1NlZ21lbnRHbG9iKG9wdGlvbnM6IElPcHRpb25zKVxue1xuXHRjb25zdCBub3ZlbF9yb290ID0gb3B0aW9ucy5ub3ZlbF9yb290IHx8IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuXHRjb25zdCBzZWdtZW50ID0gb3B0aW9ucy5zZWdtZW50ID0gZ2V0U2VnbWVudChvcHRpb25zLnNlZ21lbnQpO1xuXG5cdG9wdGlvbnMucGF0aE1haW5fb3V0ID0gb3B0aW9ucy5wYXRoTWFpbl9vdXQgfHwgb3B0aW9ucy5wYXRoTWFpbjtcblxuXHRsZXQgQ1dEX0lOID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbiwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblx0bGV0IENXRF9PVVQgPSBfcGF0aChvcHRpb25zLnBhdGhNYWluX291dCwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblxuXHRsZXQgZ2xvYlBhdHRlcm4gPSBvcHRpb25zLmdsb2JQYXR0ZXJuIHx8IFtcblx0XHQnKiovKi50eHQnLFxuXHRdO1xuXG5cdGNvbnNvbGUuaW5mbygnW2RvXScsIG9wdGlvbnMucGF0aE1haW4sIG9wdGlvbnMubm92ZWxJRCk7XG5cblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRpb25zLmZpbGVzIHx8IEZhc3RHbG9iKGdsb2JQYXR0ZXJuLCB7XG5cdFx0XHRjd2Q6IENXRF9JTixcblx0XHRcdC8vYWJzb2x1dGU6IHRydWUsXG5cdFx0fSkgYXMgYW55IGFzIFByb21pc2U8c3RyaW5nW10+KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRyZXR1cm4gX2RvU2VnbWVudEdsb2IobHMsIG9wdGlvbnMpO1xuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2RvU2VnbWVudEdsb2IobHM6IHN0cmluZ1tdLCBvcHRpb25zOiBJT3B0aW9ucylcbntcblx0Y29uc3Qgbm92ZWxfcm9vdCA9IG9wdGlvbnMubm92ZWxfcm9vdCB8fCBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG5cblx0Y29uc3Qgc2VnbWVudCA9IG9wdGlvbnMuc2VnbWVudCA9IGdldFNlZ21lbnQob3B0aW9ucy5zZWdtZW50KTtcblxuXHRvcHRpb25zLnBhdGhNYWluX291dCA9IG9wdGlvbnMucGF0aE1haW5fb3V0IHx8IG9wdGlvbnMucGF0aE1haW47XG5cblx0bGV0IENXRF9JTiA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW4sIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cdGxldCBDV0RfT1VUID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbl9vdXQsIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cblx0cmV0dXJuIFByb21pc2Vcblx0XHQucmVzb2x2ZShscylcblx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRpZiAobHMubGVuZ3RoID09IDApXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coQ1dEX0lOKTtcblxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoRVJST1JfTVNHXzAwMSk7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0e1xuXHRcdFx0bGV0IGxhYmVsID0gYGFsbCBmaWxlICR7bHMubGVuZ3RofWA7XG5cdFx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhgYWxsIGZpbGUgJHtscy5sZW5ndGh9YCk7XG5cblx0XHRcdGxldCBjb3VudF9jaGFuZ2VkID0gMDtcblxuXHRcdFx0bGV0IGRvbmVfbGlzdCA9IFtdIGFzIHN0cmluZ1tdO1xuXG5cdFx0XHRsZXQgcnMgPSBhd2FpdCBQcm9taXNlLm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGZpbGUsIGluZGV4LCBsZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBsYWJlbCA9IGZpbGU7XG5cblx0XHRcdFx0Ly9jb25zb2xlLnRpbWUobGFiZWwpO1xuXG4vL1x0XHRcdFx0Y29uc29sZS5sb2coJ1tzdGFydF0nLCBsYWJlbCk7XG5cblx0XHRcdFx0bGV0IGZpbGxwYXRoID0gcGF0aC5qb2luKENXRF9JTiwgZmlsZSk7XG5cdFx0XHRcdGxldCBmaWxscGF0aF9vdXQgPSBwYXRoLmpvaW4oQ1dEX09VVCwgZmlsZSk7XG5cbi8vXHRcdFx0XHRjb25zb2xlLmxvZyhmaWxscGF0aCk7XG4vL1x0XHRcdFx0Y29uc29sZS5sb2coZmlsbHBhdGhfb3V0KTtcblxuXHRcdFx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKGZpbGxwYXRoKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0YXdhaXQgb3B0aW9ucy5jYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0Y2hhbmdlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRleGlzdHM6IGZhbHNlLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoIWZpbGUubWF0Y2goL1xcLnR4dCQvaSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0Y2hhbmdlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRleGlzdHM6IHRydWUsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB0ZXh0ID0gYXdhaXQgZnMubG9hZEZpbGUoZmlsbHBhdGgsIHtcblx0XHRcdFx0XHRhdXRvRGVjb2RlOiB0cnVlLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnRoZW4odiA9PiBjcmxmKHYudG9TdHJpbmcoKSkpXG5cdFx0XHRcdDtcblxuXHRcdFx0XHRpZiAoIXRleHQucmVwbGFjZSgvXFxzKy9nLCAnJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2NvbnNvbGUud2FybignW3NraXBdJywgbGFiZWwpO1xuXG5cdFx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0XHRpZiAob3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRhd2FpdCBvcHRpb25zLmNhbGxiYWNrKGRvbmVfbGlzdCwgZmlsZSwgaW5kZXgsIGxlbmd0aCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRjaGFuZ2VkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGV4aXN0czogdHJ1ZSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IF9ub3cgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHRcdGxldCBrcyA9IGF3YWl0IHNlZ21lbnQuZG9TZWdtZW50KHRleHQpO1xuXG5cdFx0XHRcdGxldCB0aW1ldXNlID0gRGF0ZS5ub3coKSAtIF9ub3c7XG5cblx0XHRcdFx0bGV0IHRleHRfbmV3ID0gYXdhaXQgc2VnbWVudC5zdHJpbmdpZnkoa3MpO1xuXG5cdFx0XHRcdGxldCBjaGFuZ2VkID0gdGV4dF9uZXcgIT0gdGV4dDtcblxuXHRcdFx0XHRpZiAoY2hhbmdlZClcblx0XHRcdFx0e1xuLy9cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbY2hhbmdlZF0nLCBsYWJlbCk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGxwYXRoX291dCwgdGV4dF9uZXcpO1xuXG5cdFx0XHRcdFx0Y291bnRfY2hhbmdlZCsrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGNoYW5nZWQpXG5cdFx0XHRcdHtcblxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tkb25lXScsIGxhYmVsKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLmNhbGxiYWNrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXdhaXQgb3B0aW9ucy5jYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0a3MgPSBudWxsO1xuXG5cdFx0XHRcdHRleHQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHRleHRfbmV3ID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRjaGFuZ2VkLFxuXHRcdFx0XHRcdGV4aXN0czogdHJ1ZSxcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdFx0XHRjb25zb2xlW2NvdW50X2NoYW5nZWQgPyAnb2snIDogJ2RlYnVnJ10oYGZpbGUgY2hhbmdlZDogJHtjb3VudF9jaGFuZ2VkfWApO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRscyxcblx0XHRcdFx0ZG9uZV9saXN0LFxuXHRcdFx0XHRjb3VudDoge1xuXHRcdFx0XHRcdGZpbGU6IGxzLmxlbmd0aCxcblx0XHRcdFx0XHRjaGFuZ2VkOiBjb3VudF9jaGFuZ2VkLFxuXHRcdFx0XHRcdGRvbmU6IGRvbmVfbGlzdC5sZW5ndGgsXG5cdFx0XHRcdH0sXG5cdFx0XHR9XG5cdFx0fSlcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxfcm9vdCA9IFByb2plY3RDb25maWcubm92ZWxfcm9vdCk6IHN0cmluZ1xue1xuXHRsZXQgcDogc3RyaW5nO1xuXG5cdHRyeVxuXHR7XG5cdFx0cCA9IHBhdGgucmVzb2x2ZShub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRClcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdG5vdmVsX3Jvb3QsXG5cdFx0XHRwYXRoTWFpbixcblx0XHRcdG5vdmVsSUQsXG5cdFx0fSk7XG5cblx0XHR0aHJvdyBlO1xuXHR9XG5cblx0cmV0dXJuIHA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWdtZW50KHNlZ21lbnQ/OiBTZWdtZW50KVxue1xuXHRpZiAoIXNlZ21lbnQpXG5cdHtcblx0XHRpZiAoIV9zZWdtZW50T2JqZWN0KVxuXHRcdHtcblx0XHRcdHNlZ21lbnQgPSBfc2VnbWVudE9iamVjdCA9IGNyZWF0ZVNlZ21lbnQoKTtcblxuXHRcdFx0bGV0IGRiX2RpY3QgPSBnZXREaWN0TWFpbihzZWdtZW50KTtcblx0XHR9XG5cblx0XHRzZWdtZW50ID0gX3NlZ21lbnRPYmplY3Q7XG5cdH1cblxuXHRyZXR1cm4gc2VnbWVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0U2VnbWVudENhY2hlKClcbntcblx0bGV0IGNhY2hlX2ZpbGUgPSBDQUNIRV9GSUxFO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGNhY2hlX2ZpbGUpKVxuXHR7XG5cdFx0Y29uc29sZS5yZWQoYFtTZWdtZW50XSByZXNldCBjYWNoZWApO1xuXHRcdGZzLnJlbW92ZVN5bmMoY2FjaGVfZmlsZSk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlZ21lbnQodXNlQ2FjaGU6IGJvb2xlYW4gPSB0cnVlKVxue1xuXHRjb25zdCBzZWdtZW50ID0gbmV3IFNlZ21lbnQoe1xuXHRcdGF1dG9Dams6IHRydWUsXG5cblx0XHRvcHRpb25zRG9TZWdtZW50OiB7XG5cblx0XHRcdGNvbnZlcnRTeW5vbnltOiB0cnVlLFxuXG5cdFx0fSxcblx0fSk7XG5cblx0bGV0IGNhY2hlX2ZpbGUgPSBDQUNIRV9GSUxFO1xuXG5cdGxldCBvcHRpb25zID0ge1xuXHRcdC8qKlxuXHRcdCAqIOmWi+WVnyBhbGxfbW9kIOaJjeacg+WcqOiHquWLlei8ieWFpeaZguWMheWQqyBaaHRTeW5vbnltT3B0aW1pemVyXG5cdFx0ICovXG5cdFx0YWxsX21vZDogdHJ1ZSxcblx0fTtcblxuXHRjb25zb2xlLnRpbWUoYOiugOWPluaooee1hOiIh+Wtl+WFuGApO1xuXG5cdC8qKlxuXHQgKiDkvb/nlKjnt6nlrZjnmoTlrZflhbjmqpTnr4Tkvotcblx0ICovXG5cdGlmICh1c2VDYWNoZSAmJiBmcy5leGlzdHNTeW5jKGNhY2hlX2ZpbGUpKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhg55m854++IGNhY2hlLmRiYCk7XG5cblx0XHRsZXQgc3QgPSBmcy5zdGF0U3luYyhjYWNoZV9maWxlKTtcblxuXHRcdGxldCBtZCA9IChEYXRlLm5vdygpIC0gc3QubXRpbWVNcykgLyAxMDAwO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhg6Led6Zui5LiK5qyh57ep5a2Y5bey6YGOICR7bWR9c2ApO1xuXG5cdFx0aWYgKG1kIDwgQ0FDSEVfVElNRU9VVClcblx0XHR7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHN0LCBtZCk7XG5cblx0XHRcdC8vY29uc29sZS5sb2coYOmWi+Wni+i8ieWFpee3qeWtmOWtl+WFuGApO1xuXG5cdFx0XHRsZXQgZGF0YSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNhY2hlX2ZpbGUpLnRvU3RyaW5nKCkpO1xuXG5cdFx0XHR1c2VEZWZhdWx0KHNlZ21lbnQsIHtcblx0XHRcdFx0Li4ub3B0aW9ucyxcblx0XHRcdFx0bm9kaWN0OiB0cnVlLFxuXHRcdFx0fSk7XG5cblx0XHRcdHNlZ21lbnQuRElDVCA9IGRhdGEuRElDVDtcblxuXHRcdFx0c2VnbWVudC5pbml0ZWQgPSB0cnVlO1xuXG5cdFx0XHRjYWNoZV9maWxlID0gbnVsbDtcblx0XHRcdGRhdGEgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFzZWdtZW50LmluaXRlZClcblx0e1xuXHRcdC8vY29uc29sZS5sb2coYOmHjeaWsOi8ieWFpeWIhuaekOWtl+WFuGApO1xuXHRcdHNlZ21lbnQuYXV0b0luaXQob3B0aW9ucyk7XG5cblx0XHQvLyDnsKHovYnnuYHlsIjnlKhcblx0XHQvL3NlZ21lbnQubG9hZFN5bm9ueW1EaWN0KCd6aHQuc3lub255bS50eHQnKTtcblx0fVxuXG5cdGxldCBkYl9kaWN0ID0gc2VnbWVudC5nZXREaWN0RGF0YWJhc2UoJ1RBQkxFJywgdHJ1ZSk7XG5cdGRiX2RpY3QuVEFCTEUgPSBzZWdtZW50LkRJQ1RbJ1RBQkxFJ107XG5cdGRiX2RpY3QuVEFCTEUyID0gc2VnbWVudC5ESUNUWydUQUJMRTInXTtcblxuXHRkYl9kaWN0Lm9wdGlvbnMuYXV0b0NqayA9IHRydWU7XG5cblx0Ly9jb25zb2xlLmxvZygn5Li75a2X5YW457i95pW4JywgZGJfZGljdC5zaXplKCkpO1xuXG5cdGNvbnNvbGUudGltZUVuZChg6K6A5Y+W5qih57WE6IiH5a2X5YW4YCk7XG5cblx0aWYgKHVzZUNhY2hlICYmIGNhY2hlX2ZpbGUpXG5cdHtcblx0XHQvL2NvbnNvbGUubG9nKGDnt6nlrZjlrZflhbjmlrwgY2FjaGUuZGJgKTtcblxuXHRcdGZzLm91dHB1dEZpbGVTeW5jKGNhY2hlX2ZpbGUsIEpTT04uc3RyaW5naWZ5KHtcblx0XHRcdERJQ1Q6IHNlZ21lbnQuRElDVCxcblx0XHR9KSk7XG5cdH1cblxuXHRmcmVlR0MoKTtcblxuXHRyZXR1cm4gc2VnbWVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpY3RNYWluKHNlZ21lbnQ6IFNlZ21lbnQpXG57XG5cdHJldHVybiBzZWdtZW50LmdldERpY3REYXRhYmFzZSgnVEFCTEUnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1blNlZ21lbnQoKVxue1xuXHRsZXQgX2NhY2hlX2ZpbGVfc2VnbWVudCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcuc2VnbWVudCcpO1xuXG5cdGxldCBfY2FjaGVfc2VnbWVudDoge1xuXG5cdFx0c192ZXI/OiBzdHJpbmcsXG5cdFx0ZF92ZXI/OiBzdHJpbmcsXG5cblx0XHRsYXN0X3NfdmVyPzogc3RyaW5nLFxuXHRcdGxhc3RfZF92ZXI/OiBzdHJpbmcsXG5cblx0XHRsaXN0OiB7XG5cdFx0XHRbazogc3RyaW5nXToge1xuXHRcdFx0XHRbazogc3RyaW5nXToge1xuXHRcdFx0XHRcdHNfdmVyPzogc3RyaW5nLFxuXHRcdFx0XHRcdGRfdmVyPzogc3RyaW5nLFxuXG5cdFx0XHRcdFx0bGFzdF9zX3Zlcj86IHN0cmluZyxcblx0XHRcdFx0XHRsYXN0X2RfdmVyPzogc3RyaW5nLFxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH0sXG5cdH07XG5cblx0bGV0IF9zX3Zlcjogc3RyaW5nID0gU3RyaW5nKHJlcXVpcmUoXCJub3ZlbC1zZWdtZW50XCIpLnZlcnNpb24gfHwgJzEnKTtcblx0bGV0IF9kX3Zlcjogc3RyaW5nID0gU3RyaW5nKHJlcXVpcmUoXCJzZWdtZW50LWRpY3RcIikudmVyc2lvbiB8fCAnMScpO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKF9jYWNoZV9maWxlX3NlZ21lbnQpKVxuXHR7XG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0X2NhY2hlX3NlZ21lbnQgPSBmcy5yZWFkSlNPTlN5bmMoX2NhY2hlX2ZpbGVfc2VnbWVudCk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblx0fVxuXG5cdC8vIEB0cy1pZ25vcmVcblx0X2NhY2hlX3NlZ21lbnQgPSBfY2FjaGVfc2VnbWVudCB8fCB7fTtcblx0X2NhY2hlX3NlZ21lbnQubGlzdCA9IF9jYWNoZV9zZWdtZW50Lmxpc3QgfHwge307XG5cblx0e1xuXHRcdGxldCB7IGxhc3Rfc192ZXIsIGxhc3RfZF92ZXIsIHNfdmVyLCBkX3ZlciB9ID0gX2NhY2hlX3NlZ21lbnQ7XG5cdFx0Y29uc29sZS5kZWJ1Zyh7XG5cdFx0XHRfc192ZXIsXG5cdFx0XHRfZF92ZXIsXG5cblx0XHRcdHNfdmVyLFxuXHRcdFx0ZF92ZXIsXG5cdFx0fSk7XG5cblx0XHRpZiAoc192ZXIgIT0gX3NfdmVyIHx8IGRfdmVyICE9IF9kX3Zlcilcblx0XHR7XG5cdFx0XHRyZXNldFNlZ21lbnRDYWNoZSgpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cdGNvbnN0IE1BWF9TQ1JJUFRfVElNRU9VVCA9IDIwICogNjAgKiAxMDAwO1xuXG5cdGxldCBjYW5jZWxsYWJsZVByb21pc2UgPSBCbHVlYmlyZFxuXHRcdC5tYXBTZXJpZXMoRmFzdEdsb2IoW1xuXHRcdFx0JyovKi5qc29uJyxcblx0XHRdLCB7XG5cdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycpLFxuXHRcdH0pLCBhc3luYyBmdW5jdGlvbiAoaWQ6IHN0cmluZylcblx0XHR7XG5cdFx0XHRsZXQgW3BhdGhNYWluLCBub3ZlbElEXSA9IGlkLnNwbGl0KC9bXFxcXFxcL10vKTtcblx0XHRcdG5vdmVsSUQgPSBwYXRoLmJhc2VuYW1lKG5vdmVsSUQsICcuanNvbicpO1xuXG5cdFx0XHRpZiAoKERhdGUubm93KCkgLSBzdGFydFRpbWUpID4gTUFYX1NDUklQVF9USU1FT1VUKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBDYW5jZWxsYXRpb25FcnJvcihg5Lu75YuZ5bey5Y+W5raIIOacrOasoeWwh+S4jeacg+Wft+ihjCAke3BhdGhNYWlufSwgJHtub3ZlbElEfWApKVxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgbnAgPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdGlmICghZnMuZXhpc3RzU3luYyhucCkpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdGF3YWl0IGZzLnJlbW92ZShwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnLCBpZCkpO1xuXG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGJpbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJ2Jpbi9fZG9fc2VnbWVudC5qcycpO1xuXG5cdFx0XHRsZXQgX3J1bl9hbGw6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRcdFx0X2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXSA9IF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF0gfHwge307XG5cblx0XHRcdGxldCBfY3VycmVudF9kYXRhID0gX2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXVtub3ZlbElEXSA9IF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF1bbm92ZWxJRF0gfHwge307XG5cblx0XHRcdGxldCBfaGFuZGxlX2xpc3Q6IHN0cmluZ1tdID0gW107XG5cblx0XHRcdHtcblx0XHRcdFx0bGV0IGRpciA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycsIHBhdGhNYWluKTtcblx0XHRcdFx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKGRpciwgbm92ZWxJRCArICcuanNvbicpO1xuXG5cdFx0XHRcdGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlKVxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRfaGFuZGxlX2xpc3QucHVzaCguLi5scyk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2goZSA9PiBudWxsKVxuXHRcdFx0XHQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfY3VycmVudF9kYXRhLmRfdmVyICE9IF9kX3ZlciB8fCBfY3VycmVudF9kYXRhLnNfdmVyICE9IF9zX3Zlcilcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5kZWJ1Zyh7XG5cdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRzX3ZlcjogX2N1cnJlbnRfZGF0YS5zX3Zlcixcblx0XHRcdFx0XHRkX3ZlcjogX2N1cnJlbnRfZGF0YS5kX3Zlcixcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X3J1bl9hbGwgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgY3AgPSBjcm9zc1NwYXduU3luYygnbm9kZScsIFtcblx0XHRcdFx0Jy0tbWF4LW9sZC1zcGFjZS1zaXplPTIwNDgnLFxuXHRcdFx0XHQvLyctLWV4cG9zZS1nYycsXG5cdFx0XHRcdGJpbixcblx0XHRcdFx0Jy0tcGF0aE1haW4nLFxuXHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0Jy0tbm92ZWxJRCcsXG5cdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdCctLXJ1bkFsbCcsXG5cdFx0XHRcdFN0cmluZyhfcnVuX2FsbCksXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogRElTVF9OT1ZFTCxcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoY3Auc3RhdHVzID4gMClcblx0XHRcdHtcblx0XHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0YFtTZWdtZW50XSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBESVNUX05PVkVMLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRKU09OKF9jYWNoZV9maWxlX3NlZ21lbnQsIF9jYWNoZV9zZWdtZW50LCB7XG5cdFx0XHRcdFx0c3BhY2VzOiBcIlxcdFwiLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZGlyID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJywgcGF0aE1haW4pO1xuXHRcdFx0XHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oZGlyLCBub3ZlbElEICsgJy5qc29uJyk7XG5cdFx0XHRcdGxldCBqc29uZmlsZV9kb25lID0ganNvbmZpbGUgKyAnLmRvbmUnO1xuXG5cdFx0XHRcdGF3YWl0IGZzLnJlYWRKU09OKGpzb25maWxlX2RvbmUpXG5cdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKGxzOiBzdHJpbmdbXSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgQ1dEX0lOID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXHRcdFx0XHRcdFx0bGV0IGNqa19jaGFuZ2VkOiBib29sZWFuID0gZmFsc2U7XG5cblx0XHRcdFx0XHRcdGlmICghZnMucGF0aEV4aXN0c1N5bmMoQ1dEX0lOKSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRscyA9IChscyB8fCBbXSlcblx0XHRcdFx0XHRcdFx0LmNvbmNhdChfaGFuZGxlX2xpc3QpXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdGxzID0gYXJyYXlfdW5pcXVlX292ZXJ3cml0ZShscyk7XG5cblx0XHRcdFx0XHRcdGlmICghbHMubGVuZ3RoIHx8ICFscylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gQmx1ZWJpcmRcblx0XHRcdFx0XHRcdFx0Lm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGZpbGUpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpZiAocGF0aC5leHRuYW1lKGZpbGUpID09ICcudHh0Jylcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgZnVsbHBhdGggPSBwYXRoLmpvaW4oQ1dEX0lOLCBmaWxlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZzLmxvYWRGaWxlKGZ1bGxwYXRoLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGF1dG9EZWNvZGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChidWYpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoYnVmICYmIGJ1Zi5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9vbGQgPSBTdHJpbmcoYnVmKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCB0eHRfbmV3ID0gZG9fY24ydHdfbWluKHR4dF9vbGQpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eXFxzKlxcbi8sICcnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvKD88PVxcbilcXHMqXFxuXFxzKiQvLCAnJylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHR4dF9vbGQgIT0gdHh0X25ldyAmJiB0eHRfbmV3KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjamtfY2hhbmdlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZzLndyaXRlRmlsZShmdWxscGF0aCwgdHh0X25ldylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW2Nqay1jb252XWAsIGZpbGUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVsbHBhdGg7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGJ1Zik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC5jYXRjaChlID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC5tYXBTZXJpZXMoZnVuY3Rpb24gKGZ1bGxwYXRoKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZnVsbHBhdGggJiYgY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZnVsbHBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogQ1dEX0lOLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZ1bGxwYXRoXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChjamtfY2hhbmdlZClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YFtjamstY29udl0gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogQ1dEX0lOLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKGUgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdDtcblx0XHRcdH1cblxuXHRcdFx0X2N1cnJlbnRfZGF0YS5sYXN0X3NfdmVyID0gX2N1cnJlbnRfZGF0YS5zX3Zlcjtcblx0XHRcdF9jdXJyZW50X2RhdGEubGFzdF9kX3ZlciA9IF9jdXJyZW50X2RhdGEuZF92ZXI7XG5cblx0XHRcdF9jdXJyZW50X2RhdGEuc192ZXIgPSBfc192ZXI7XG5cdFx0XHRfY3VycmVudF9kYXRhLmRfdmVyID0gX2RfdmVyO1xuXG5cdFx0XHRyZXR1cm4gY3Auc3RhdHVzO1xuXHRcdH0pXG5cdFx0LnRoZW4oKCkgPT4gdHJ1ZSlcblx0XHQuY2F0Y2goQ2FuY2VsbGF0aW9uRXJyb3IsIChlOiBDYW5jZWxsYXRpb25FcnJvcikgPT4ge1xuXG5cdFx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9KVxuXHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5sYXN0X3NfdmVyID0gX2NhY2hlX3NlZ21lbnQuc192ZXI7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5sYXN0X2RfdmVyID0gX2NhY2hlX3NlZ21lbnQuZF92ZXI7XG5cblx0XHRcdF9jYWNoZV9zZWdtZW50LnNfdmVyID0gX3NfdmVyO1xuXHRcdFx0X2NhY2hlX3NlZ21lbnQuZF92ZXIgPSBfZF92ZXI7XG5cblx0XHRcdGF3YWl0IGZzLm91dHB1dEpTT04oX2NhY2hlX2ZpbGVfc2VnbWVudCwgX2NhY2hlX3NlZ21lbnQsIHtcblx0XHRcdFx0c3BhY2VzOiBcIlxcdFwiLFxuXHRcdFx0fSk7XG5cdFx0fSlcblx0O1xuXG5cdHJldHVybiBjYW5jZWxsYWJsZVByb21pc2Vcblx0XHQuY2F0Y2goQ2FuY2VsbGF0aW9uRXJyb3IsIChlKSA9PiB7XG5cblx0XHRcdHJldHVybiBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cblx0XHR9KTtcbn1cbiJdfQ==