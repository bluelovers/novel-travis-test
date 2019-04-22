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
const min_1 = require("cjk-conv/lib/zh/convert/min");
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
    return Promise
        .mapSeries(FastGlob([
        '*/*.json',
    ], {
        cwd: path.join(project_config_1.default.cache_root, 'files'),
    }), async function (id) {
        let [pathMain, novelID] = id.split(/[\\\/]/);
        novelID = path.basename(novelID, '.json');
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
                if (!ls.length || !ls) {
                    return;
                }
                let CWD_IN = _path(pathMain, novelID);
                let cjk_changed = false;
                if (!fs.pathExistsSync(CWD_IN)) {
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
                                let txt_new = min_1.cn2tw_min(txt_old);
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
        .tap(async function () {
        _cache_segment.last_s_ver = _cache_segment.s_ver;
        _cache_segment.last_d_ver = _cache_segment.d_ver;
        _cache_segment.s_ver = _s_ver;
        _cache_segment.d_ver = _d_ver;
        await fs.outputJSON(_cache_file_segment, _cache_segment, {
            spaces: "\t",
        });
    });
}
exports.runSegment = runSegment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtCQUFnQztBQUNoQyxvQ0FBMEM7QUFDMUMsc0NBQXFDO0FBQ3JDLHNEQUE4QztBQUM5QywrQkFBZ0M7QUFDaEMsMkNBQWtFO0FBQ2xFLHVEQUFnRDtBQUVoRCxzQ0FBdUM7QUFDdkMsb0NBQXFDO0FBQ3JDLG1EQUFzQztBQUN0QyxvQ0FBaUM7QUFDakMscUNBQXNDO0FBRXRDLHFEQUFxRztBQUUxRixRQUFBLFVBQVUsR0FBRyx3QkFBYSxDQUFDLFVBQVUsQ0FBQztBQUV0QyxRQUFBLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFJbkIsUUFBQSxhQUFhLEdBQUcsbUJBQW1CLENBQUM7QUFFcEMsUUFBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztBQW9CMUUsU0FBZ0IsYUFBYSxDQUFDLE9BQWlCO0lBRTlDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksd0JBQWEsQ0FBQyxVQUFVLENBQUM7SUFFbEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTlELE9BQU8sQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDO0lBRWhFLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbEUsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV2RSxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FB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XG5cbmltcG9ydCBwYXRoID0gcmVxdWlyZShcInVwYXRoMlwiKTtcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgZnJlZUdDIH0gZnJvbSAnLi4vbGliL3V0aWwnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCB7IHVzZURlZmF1bHQsIGdldERlZmF1bHRNb2RMaXN0IH0gZnJvbSAnbm92ZWwtc2VnbWVudC9saWInO1xuaW1wb3J0IFNlZ21lbnQgZnJvbSAnbm92ZWwtc2VnbWVudC9saWIvU2VnbWVudCc7XG5pbXBvcnQgVGFibGVEaWN0IGZyb20gJ25vdmVsLXNlZ21lbnQvbGliL3RhYmxlL2RpY3QnO1xuaW1wb3J0IEZhc3RHbG9iID0gcmVxdWlyZSgnZmFzdC1nbG9iJyk7XG5pbXBvcnQgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgeyBjcmxmIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IGZzSWNvbnYgPSByZXF1aXJlKCdmcy1pY29udicpO1xuaW1wb3J0IHsgdHcyY25fbWluLCBjbjJ0d19taW4sIHRhYmxlQ24yVHdEZWJ1ZywgdGFibGVUdzJDbkRlYnVnIH0gZnJvbSAnY2prLWNvbnYvbGliL3poL2NvbnZlcnQvbWluJztcblxuZXhwb3J0IGxldCBESVNUX05PVkVMID0gUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5leHBvcnQgbGV0IENBQ0hFX1RJTUVPVVQgPSAzNjAwO1xuXG5leHBvcnQgbGV0IF9zZWdtZW50T2JqZWN0OiBTZWdtZW50O1xuXG5leHBvcnQgY29uc3QgRVJST1JfTVNHXzAwMSA9IGDmspLmnInmkJzlsIvliLDku7vkvZXmqpTmoYgg6KuL5qqi5p+l5pCc5bCL5qKd5Lu2YDtcblxuZXhwb3J0IGNvbnN0IENBQ0hFX0ZJTEUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnY2FjaGUuZGInKTtcblxuZXhwb3J0IHR5cGUgSU9wdGlvbnMgPSB7XG5cdHBhdGhNYWluOiBzdHJpbmcsXG5cdHBhdGhNYWluX291dD86IHN0cmluZyxcblx0bm92ZWxJRDogc3RyaW5nLFxuXG5cdHNlZ21lbnQ/OiBTZWdtZW50LFxuXG5cdG5vdmVsX3Jvb3Q/OiBzdHJpbmcsXG5cblx0Z2xvYlBhdHRlcm4/OiBzdHJpbmdbXSxcblxuXHRmaWxlcz86IHN0cmluZ1tdLFxuXG5cdGhpZGVMb2c/OiBib29sZWFuLFxuXG5cdGNhbGxiYWNrPyhkb25lX2xpc3Q6IHN0cmluZ1tdLCBmaWxlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkb1NlZ21lbnRHbG9iKG9wdGlvbnM6IElPcHRpb25zKVxue1xuXHRjb25zdCBub3ZlbF9yb290ID0gb3B0aW9ucy5ub3ZlbF9yb290IHx8IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuXHRjb25zdCBzZWdtZW50ID0gb3B0aW9ucy5zZWdtZW50ID0gZ2V0U2VnbWVudChvcHRpb25zLnNlZ21lbnQpO1xuXG5cdG9wdGlvbnMucGF0aE1haW5fb3V0ID0gb3B0aW9ucy5wYXRoTWFpbl9vdXQgfHwgb3B0aW9ucy5wYXRoTWFpbjtcblxuXHRsZXQgQ1dEX0lOID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbiwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblx0bGV0IENXRF9PVVQgPSBfcGF0aChvcHRpb25zLnBhdGhNYWluX291dCwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblxuXHRsZXQgZ2xvYlBhdHRlcm4gPSBvcHRpb25zLmdsb2JQYXR0ZXJuIHx8IFtcblx0XHQnKiovKi50eHQnLFxuXHRdO1xuXG5cdGNvbnNvbGUuaW5mbygnW2RvXScsIG9wdGlvbnMucGF0aE1haW4sIG9wdGlvbnMubm92ZWxJRCk7XG5cblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRpb25zLmZpbGVzIHx8IEZhc3RHbG9iKGdsb2JQYXR0ZXJuLCB7XG5cdFx0XHRjd2Q6IENXRF9JTixcblx0XHRcdC8vYWJzb2x1dGU6IHRydWUsXG5cdFx0fSkgYXMgYW55IGFzIFByb21pc2U8c3RyaW5nW10+KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRyZXR1cm4gX2RvU2VnbWVudEdsb2IobHMsIG9wdGlvbnMpO1xuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2RvU2VnbWVudEdsb2IobHM6IHN0cmluZ1tdLCBvcHRpb25zOiBJT3B0aW9ucylcbntcblx0Y29uc3Qgbm92ZWxfcm9vdCA9IG9wdGlvbnMubm92ZWxfcm9vdCB8fCBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG5cblx0Y29uc3Qgc2VnbWVudCA9IG9wdGlvbnMuc2VnbWVudCA9IGdldFNlZ21lbnQob3B0aW9ucy5zZWdtZW50KTtcblxuXHRvcHRpb25zLnBhdGhNYWluX291dCA9IG9wdGlvbnMucGF0aE1haW5fb3V0IHx8IG9wdGlvbnMucGF0aE1haW47XG5cblx0bGV0IENXRF9JTiA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW4sIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cdGxldCBDV0RfT1VUID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbl9vdXQsIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cblx0cmV0dXJuIFByb21pc2Vcblx0XHQucmVzb2x2ZShscylcblx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRpZiAobHMubGVuZ3RoID09IDApXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coQ1dEX0lOKTtcblxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoRVJST1JfTVNHXzAwMSk7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0e1xuXHRcdFx0bGV0IGxhYmVsID0gYGFsbCBmaWxlICR7bHMubGVuZ3RofWA7XG5cdFx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhgYWxsIGZpbGUgJHtscy5sZW5ndGh9YCk7XG5cblx0XHRcdGxldCBjb3VudF9jaGFuZ2VkID0gMDtcblxuXHRcdFx0bGV0IGRvbmVfbGlzdCA9IFtdIGFzIHN0cmluZ1tdO1xuXG5cdFx0XHRsZXQgcnMgPSBhd2FpdCBQcm9taXNlLm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKGZpbGUsIGluZGV4LCBsZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBsYWJlbCA9IGZpbGU7XG5cblx0XHRcdFx0Ly9jb25zb2xlLnRpbWUobGFiZWwpO1xuXG4vL1x0XHRcdFx0Y29uc29sZS5sb2coJ1tzdGFydF0nLCBsYWJlbCk7XG5cblx0XHRcdFx0bGV0IGZpbGxwYXRoID0gcGF0aC5qb2luKENXRF9JTiwgZmlsZSk7XG5cdFx0XHRcdGxldCBmaWxscGF0aF9vdXQgPSBwYXRoLmpvaW4oQ1dEX09VVCwgZmlsZSk7XG5cbi8vXHRcdFx0XHRjb25zb2xlLmxvZyhmaWxscGF0aCk7XG4vL1x0XHRcdFx0Y29uc29sZS5sb2coZmlsbHBhdGhfb3V0KTtcblxuXHRcdFx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKGZpbGxwYXRoKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0YXdhaXQgb3B0aW9ucy5jYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0Y2hhbmdlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRleGlzdHM6IGZhbHNlLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoIWZpbGUubWF0Y2goL1xcLnR4dCQvaSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0Y2hhbmdlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRleGlzdHM6IHRydWUsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB0ZXh0ID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsbHBhdGgpXG5cdFx0XHRcdFx0LnRoZW4odiA9PiBjcmxmKHYudG9TdHJpbmcoKSkpXG5cdFx0XHRcdDtcblxuXHRcdFx0XHRpZiAoIXRleHQucmVwbGFjZSgvXFxzKy9nLCAnJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2NvbnNvbGUud2FybignW3NraXBdJywgbGFiZWwpO1xuXG5cdFx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0XHRpZiAob3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRhd2FpdCBvcHRpb25zLmNhbGxiYWNrKGRvbmVfbGlzdCwgZmlsZSwgaW5kZXgsIGxlbmd0aCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRjaGFuZ2VkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGV4aXN0czogdHJ1ZSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IF9ub3cgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHRcdGxldCBrcyA9IGF3YWl0IHNlZ21lbnQuZG9TZWdtZW50KHRleHQpO1xuXG5cdFx0XHRcdGxldCB0aW1ldXNlID0gRGF0ZS5ub3coKSAtIF9ub3c7XG5cblx0XHRcdFx0bGV0IHRleHRfbmV3ID0gYXdhaXQgc2VnbWVudC5zdHJpbmdpZnkoa3MpO1xuXG5cdFx0XHRcdGxldCBjaGFuZ2VkID0gdGV4dF9uZXcgIT0gdGV4dDtcblxuXHRcdFx0XHRpZiAoY2hhbmdlZClcblx0XHRcdFx0e1xuLy9cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbY2hhbmdlZF0nLCBsYWJlbCk7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGxwYXRoX291dCwgdGV4dF9uZXcpO1xuXG5cdFx0XHRcdFx0Y291bnRfY2hhbmdlZCsrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGNoYW5nZWQpXG5cdFx0XHRcdHtcblxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tkb25lXScsIGxhYmVsKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLmNhbGxiYWNrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YXdhaXQgb3B0aW9ucy5jYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0a3MgPSBudWxsO1xuXG5cdFx0XHRcdHRleHQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHRleHRfbmV3ID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRjaGFuZ2VkLFxuXHRcdFx0XHRcdGV4aXN0czogdHJ1ZSxcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zb2xlLnRpbWVFbmQobGFiZWwpO1xuXG5cdFx0XHRjb25zb2xlW2NvdW50X2NoYW5nZWQgPyAnb2snIDogJ2RlYnVnJ10oYGZpbGUgY2hhbmdlZDogJHtjb3VudF9jaGFuZ2VkfWApO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRscyxcblx0XHRcdFx0ZG9uZV9saXN0LFxuXHRcdFx0XHRjb3VudDoge1xuXHRcdFx0XHRcdGZpbGU6IGxzLmxlbmd0aCxcblx0XHRcdFx0XHRjaGFuZ2VkOiBjb3VudF9jaGFuZ2VkLFxuXHRcdFx0XHRcdGRvbmU6IGRvbmVfbGlzdC5sZW5ndGgsXG5cdFx0XHRcdH0sXG5cdFx0XHR9XG5cdFx0fSlcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCwgbm92ZWxfcm9vdCA9IFByb2plY3RDb25maWcubm92ZWxfcm9vdCk6IHN0cmluZ1xue1xuXHRsZXQgcDogc3RyaW5nO1xuXG5cdHRyeVxuXHR7XG5cdFx0cCA9IHBhdGgucmVzb2x2ZShub3ZlbF9yb290LCBwYXRoTWFpbiwgbm92ZWxJRClcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdG5vdmVsX3Jvb3QsXG5cdFx0XHRwYXRoTWFpbixcblx0XHRcdG5vdmVsSUQsXG5cdFx0fSk7XG5cblx0XHR0aHJvdyBlO1xuXHR9XG5cblx0cmV0dXJuIHA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWdtZW50KHNlZ21lbnQ/OiBTZWdtZW50KVxue1xuXHRpZiAoIXNlZ21lbnQpXG5cdHtcblx0XHRpZiAoIV9zZWdtZW50T2JqZWN0KVxuXHRcdHtcblx0XHRcdHNlZ21lbnQgPSBfc2VnbWVudE9iamVjdCA9IGNyZWF0ZVNlZ21lbnQoKTtcblxuXHRcdFx0bGV0IGRiX2RpY3QgPSBnZXREaWN0TWFpbihzZWdtZW50KTtcblx0XHR9XG5cblx0XHRzZWdtZW50ID0gX3NlZ21lbnRPYmplY3Q7XG5cdH1cblxuXHRyZXR1cm4gc2VnbWVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0U2VnbWVudENhY2hlKClcbntcblx0bGV0IGNhY2hlX2ZpbGUgPSBDQUNIRV9GSUxFO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGNhY2hlX2ZpbGUpKVxuXHR7XG5cdFx0Y29uc29sZS5yZWQoYFtTZWdtZW50XSByZXNldCBjYWNoZWApO1xuXHRcdGZzLnJlbW92ZVN5bmMoY2FjaGVfZmlsZSk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlZ21lbnQodXNlQ2FjaGU6IGJvb2xlYW4gPSB0cnVlKVxue1xuXHRjb25zdCBzZWdtZW50ID0gbmV3IFNlZ21lbnQoe1xuXHRcdGF1dG9Dams6IHRydWUsXG5cblx0XHRvcHRpb25zRG9TZWdtZW50OiB7XG5cblx0XHRcdGNvbnZlcnRTeW5vbnltOiB0cnVlLFxuXG5cdFx0fSxcblx0fSk7XG5cblx0bGV0IGNhY2hlX2ZpbGUgPSBDQUNIRV9GSUxFO1xuXG5cdGxldCBvcHRpb25zID0ge1xuXHRcdC8qKlxuXHRcdCAqIOmWi+WVnyBhbGxfbW9kIOaJjeacg+WcqOiHquWLlei8ieWFpeaZguWMheWQqyBaaHRTeW5vbnltT3B0aW1pemVyXG5cdFx0ICovXG5cdFx0YWxsX21vZDogdHJ1ZSxcblx0fTtcblxuXHRjb25zb2xlLnRpbWUoYOiugOWPluaooee1hOiIh+Wtl+WFuGApO1xuXG5cdC8qKlxuXHQgKiDkvb/nlKjnt6nlrZjnmoTlrZflhbjmqpTnr4Tkvotcblx0ICovXG5cdGlmICh1c2VDYWNoZSAmJiBmcy5leGlzdHNTeW5jKGNhY2hlX2ZpbGUpKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhg55m854++IGNhY2hlLmRiYCk7XG5cblx0XHRsZXQgc3QgPSBmcy5zdGF0U3luYyhjYWNoZV9maWxlKTtcblxuXHRcdGxldCBtZCA9IChEYXRlLm5vdygpIC0gc3QubXRpbWVNcykgLyAxMDAwO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhg6Led6Zui5LiK5qyh57ep5a2Y5bey6YGOICR7bWR9c2ApO1xuXG5cdFx0aWYgKG1kIDwgQ0FDSEVfVElNRU9VVClcblx0XHR7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHN0LCBtZCk7XG5cblx0XHRcdC8vY29uc29sZS5sb2coYOmWi+Wni+i8ieWFpee3qeWtmOWtl+WFuGApO1xuXG5cdFx0XHRsZXQgZGF0YSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNhY2hlX2ZpbGUpLnRvU3RyaW5nKCkpO1xuXG5cdFx0XHR1c2VEZWZhdWx0KHNlZ21lbnQsIHtcblx0XHRcdFx0Li4ub3B0aW9ucyxcblx0XHRcdFx0bm9kaWN0OiB0cnVlLFxuXHRcdFx0fSk7XG5cblx0XHRcdHNlZ21lbnQuRElDVCA9IGRhdGEuRElDVDtcblxuXHRcdFx0c2VnbWVudC5pbml0ZWQgPSB0cnVlO1xuXG5cdFx0XHRjYWNoZV9maWxlID0gbnVsbDtcblx0XHRcdGRhdGEgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFzZWdtZW50LmluaXRlZClcblx0e1xuXHRcdC8vY29uc29sZS5sb2coYOmHjeaWsOi8ieWFpeWIhuaekOWtl+WFuGApO1xuXHRcdHNlZ21lbnQuYXV0b0luaXQob3B0aW9ucyk7XG5cblx0XHQvLyDnsKHovYnnuYHlsIjnlKhcblx0XHQvL3NlZ21lbnQubG9hZFN5bm9ueW1EaWN0KCd6aHQuc3lub255bS50eHQnKTtcblx0fVxuXG5cdGxldCBkYl9kaWN0ID0gc2VnbWVudC5nZXREaWN0RGF0YWJhc2UoJ1RBQkxFJywgdHJ1ZSk7XG5cdGRiX2RpY3QuVEFCTEUgPSBzZWdtZW50LkRJQ1RbJ1RBQkxFJ107XG5cdGRiX2RpY3QuVEFCTEUyID0gc2VnbWVudC5ESUNUWydUQUJMRTInXTtcblxuXHRkYl9kaWN0Lm9wdGlvbnMuYXV0b0NqayA9IHRydWU7XG5cblx0Ly9jb25zb2xlLmxvZygn5Li75a2X5YW457i95pW4JywgZGJfZGljdC5zaXplKCkpO1xuXG5cdGNvbnNvbGUudGltZUVuZChg6K6A5Y+W5qih57WE6IiH5a2X5YW4YCk7XG5cblx0aWYgKHVzZUNhY2hlICYmIGNhY2hlX2ZpbGUpXG5cdHtcblx0XHQvL2NvbnNvbGUubG9nKGDnt6nlrZjlrZflhbjmlrwgY2FjaGUuZGJgKTtcblxuXHRcdGZzLm91dHB1dEZpbGVTeW5jKGNhY2hlX2ZpbGUsIEpTT04uc3RyaW5naWZ5KHtcblx0XHRcdERJQ1Q6IHNlZ21lbnQuRElDVCxcblx0XHR9KSk7XG5cdH1cblxuXHRmcmVlR0MoKTtcblxuXHRyZXR1cm4gc2VnbWVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpY3RNYWluKHNlZ21lbnQ6IFNlZ21lbnQpXG57XG5cdHJldHVybiBzZWdtZW50LmdldERpY3REYXRhYmFzZSgnVEFCTEUnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1blNlZ21lbnQoKVxue1xuXHRsZXQgX2NhY2hlX2ZpbGVfc2VnbWVudCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcuc2VnbWVudCcpO1xuXG5cdGxldCBfY2FjaGVfc2VnbWVudDoge1xuXG5cdFx0c192ZXI/OiBzdHJpbmcsXG5cdFx0ZF92ZXI/OiBzdHJpbmcsXG5cblx0XHRsYXN0X3NfdmVyPzogc3RyaW5nLFxuXHRcdGxhc3RfZF92ZXI/OiBzdHJpbmcsXG5cblx0XHRsaXN0OiB7XG5cdFx0XHRbazogc3RyaW5nXToge1xuXHRcdFx0XHRbazogc3RyaW5nXToge1xuXHRcdFx0XHRcdHNfdmVyPzogc3RyaW5nLFxuXHRcdFx0XHRcdGRfdmVyPzogc3RyaW5nLFxuXG5cdFx0XHRcdFx0bGFzdF9zX3Zlcj86IHN0cmluZyxcblx0XHRcdFx0XHRsYXN0X2RfdmVyPzogc3RyaW5nLFxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH0sXG5cdH07XG5cblx0bGV0IF9zX3Zlcjogc3RyaW5nID0gU3RyaW5nKHJlcXVpcmUoXCJub3ZlbC1zZWdtZW50XCIpLnZlcnNpb24gfHwgJzEnKTtcblx0bGV0IF9kX3Zlcjogc3RyaW5nID0gU3RyaW5nKHJlcXVpcmUoXCJzZWdtZW50LWRpY3RcIikudmVyc2lvbiB8fCAnMScpO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKF9jYWNoZV9maWxlX3NlZ21lbnQpKVxuXHR7XG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0X2NhY2hlX3NlZ21lbnQgPSBmcy5yZWFkSlNPTlN5bmMoX2NhY2hlX2ZpbGVfc2VnbWVudCk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblx0fVxuXG5cdC8vIEB0cy1pZ25vcmVcblx0X2NhY2hlX3NlZ21lbnQgPSBfY2FjaGVfc2VnbWVudCB8fCB7fTtcblx0X2NhY2hlX3NlZ21lbnQubGlzdCA9IF9jYWNoZV9zZWdtZW50Lmxpc3QgfHwge307XG5cblx0e1xuXHRcdGxldCB7IGxhc3Rfc192ZXIsIGxhc3RfZF92ZXIsIHNfdmVyLCBkX3ZlciB9ID0gX2NhY2hlX3NlZ21lbnQ7XG5cdFx0Y29uc29sZS5kZWJ1Zyh7XG5cdFx0XHRfc192ZXIsXG5cdFx0XHRfZF92ZXIsXG5cblx0XHRcdHNfdmVyLFxuXHRcdFx0ZF92ZXIsXG5cdFx0fSk7XG5cblx0XHRpZiAoc192ZXIgIT0gX3NfdmVyIHx8IGRfdmVyICE9IF9kX3Zlcilcblx0XHR7XG5cdFx0XHRyZXNldFNlZ21lbnRDYWNoZSgpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBQcm9taXNlXG5cdFx0Lm1hcFNlcmllcyhGYXN0R2xvYihbXG5cdFx0XHQnKi8qLmpzb24nLFxuXHRcdF0sIHtcblx0XHRcdGN3ZDogcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJyksXG5cdFx0fSksIGFzeW5jIGZ1bmN0aW9uIChpZDogc3RyaW5nKVxuXHRcdHtcblx0XHRcdGxldCBbcGF0aE1haW4sIG5vdmVsSURdID0gaWQuc3BsaXQoL1tcXFxcXFwvXS8pO1xuXG5cdFx0XHRub3ZlbElEID0gcGF0aC5iYXNlbmFtZShub3ZlbElELCAnLmpzb24nKTtcblxuXHRcdFx0bGV0IG5wID0gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmMobnApKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0XHRhd2FpdCBmcy5yZW1vdmUocGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJywgaWQpKTtcblxuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBiaW4gPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5wcm9qZWN0X3Jvb3QsICdiaW4vX2RvX3NlZ21lbnQuanMnKTtcblxuXHRcdFx0bGV0IF9ydW5fYWxsOiBib29sZWFuID0gZmFsc2U7XG5cblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF0gPSBfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdIHx8IHt9O1xuXG5cdFx0XHRsZXQgX2N1cnJlbnRfZGF0YSA9IF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF1bbm92ZWxJRF0gPSBfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdW25vdmVsSURdIHx8IHt9O1xuXG5cdFx0XHRpZiAoX2N1cnJlbnRfZGF0YS5kX3ZlciAhPSBfZF92ZXIgfHwgX2N1cnJlbnRfZGF0YS5zX3ZlciAhPSBfc192ZXIpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZGVidWcoe1xuXHRcdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdFx0c192ZXI6IF9jdXJyZW50X2RhdGEuc192ZXIsXG5cdFx0XHRcdFx0ZF92ZXI6IF9jdXJyZW50X2RhdGEuZF92ZXIsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF9ydW5fYWxsID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ25vZGUnLCBbXG5cdFx0XHRcdCctLW1heC1vbGQtc3BhY2Utc2l6ZT0yMDQ4Jyxcblx0XHRcdFx0Ly8nLS1leHBvc2UtZ2MnLFxuXHRcdFx0XHRiaW4sXG5cdFx0XHRcdCctLXBhdGhNYWluJyxcblx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdCctLW5vdmVsSUQnLFxuXHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHQnLS1ydW5BbGwnLFxuXHRcdFx0XHRTdHJpbmcoX3J1bl9hbGwpLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IERJU1RfTk9WRUwsXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGNwLnN0YXR1cyA+IDApXG5cdFx0XHR7XG5cdFx0XHRcdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdGBbU2VnbWVudF0gJHtwYXRoTWFpbn0gJHtub3ZlbElEfWAsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdGN3ZDogRElTVF9OT1ZFTCxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0YXdhaXQgZnMub3V0cHV0SlNPTihfY2FjaGVfZmlsZV9zZWdtZW50LCBfY2FjaGVfc2VnbWVudCwge1xuXHRcdFx0XHRcdHNwYWNlczogXCJcXHRcIixcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHtcblx0XHRcdFx0bGV0IGRpciA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycsIHBhdGhNYWluKTtcblx0XHRcdFx0bGV0IGpzb25maWxlID0gcGF0aC5qb2luKGRpciwgbm92ZWxJRCArICcuanNvbicpO1xuXHRcdFx0XHRsZXQganNvbmZpbGVfZG9uZSA9IGpzb25maWxlICsgJy5kb25lJztcblxuXHRcdFx0XHRhd2FpdCBmcy5yZWFkSlNPTihqc29uZmlsZV9kb25lKVxuXHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAoIWxzLmxlbmd0aCB8fCAhbHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IENXRF9JTiA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblx0XHRcdFx0XHRcdGxldCBjamtfY2hhbmdlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKENXRF9JTikpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIEJsdWViaXJkXG5cdFx0XHRcdFx0XHRcdC5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChmaWxlKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHBhdGguZXh0bmFtZShmaWxlKSA9PSAnLnR4dCcpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IGZ1bGxwYXRoID0gcGF0aC5qb2luKENXRF9JTiwgZmlsZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBhd2FpdCBmcy5yZWFkRmlsZShmdWxscGF0aClcblx0XHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGJ1Zilcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChidWYgJiYgYnVmLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgdHh0X29sZCA9IFN0cmluZyhidWYpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9uZXcgPSBjbjJ0d19taW4odHh0X29sZCk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0eHRfb2xkICE9IHR4dF9uZXcgJiYgdHh0X25ldylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2prX2NoYW5nZWQgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBmcy53cml0ZUZpbGUoZnVsbHBhdGgsIHR4dF9uZXcpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLnN1Y2Nlc3MoYFtjamstY29udl1gLCBmaWxlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZ1bGxwYXRoO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLnJlamVjdChidWYpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0Lm1hcFNlcmllcyhmdW5jdGlvbiAoZnVsbHBhdGgpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRmdWxscGF0aCAmJiBjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdFx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRmdWxscGF0aCxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVsbHBhdGhcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNqa19jaGFuZ2VkKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRgW2Nqay1jb252XSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2goZSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXHRcdFx0fVxuXG5cdFx0XHRfY3VycmVudF9kYXRhLmxhc3Rfc192ZXIgPSBfY3VycmVudF9kYXRhLnNfdmVyO1xuXHRcdFx0X2N1cnJlbnRfZGF0YS5sYXN0X2RfdmVyID0gX2N1cnJlbnRfZGF0YS5kX3ZlcjtcblxuXHRcdFx0X2N1cnJlbnRfZGF0YS5zX3ZlciA9IF9zX3Zlcjtcblx0XHRcdF9jdXJyZW50X2RhdGEuZF92ZXIgPSBfZF92ZXI7XG5cblx0XHRcdHJldHVybiBjcC5zdGF0dXM7XG5cdFx0fSlcblx0XHQudGFwKGFzeW5jIGZ1bmN0aW9uICgpXG5cdFx0e1xuXHRcdFx0X2NhY2hlX3NlZ21lbnQubGFzdF9zX3ZlciA9IF9jYWNoZV9zZWdtZW50LnNfdmVyO1xuXHRcdFx0X2NhY2hlX3NlZ21lbnQubGFzdF9kX3ZlciA9IF9jYWNoZV9zZWdtZW50LmRfdmVyO1xuXG5cdFx0XHRfY2FjaGVfc2VnbWVudC5zX3ZlciA9IF9zX3Zlcjtcblx0XHRcdF9jYWNoZV9zZWdtZW50LmRfdmVyID0gX2RfdmVyO1xuXG5cdFx0XHRhd2FpdCBmcy5vdXRwdXRKU09OKF9jYWNoZV9maWxlX3NlZ21lbnQsIF9jYWNoZV9zZWdtZW50LCB7XG5cdFx0XHRcdHNwYWNlczogXCJcXHRcIixcblx0XHRcdH0pO1xuXHRcdH0pXG5cdFx0O1xufVxuIl19