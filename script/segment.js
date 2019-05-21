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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtCQUFnQztBQUNoQyxvQ0FBMEM7QUFDMUMsc0NBQXFDO0FBQ3JDLHNEQUE4QztBQUM5QywrQkFBZ0M7QUFDaEMsMkNBQWtFO0FBQ2xFLHVEQUFnRDtBQUVoRCxzQ0FBdUM7QUFDdkMsb0NBQXFDO0FBQ3JDLG1EQUFzQztBQUN0QyxvQ0FBaUM7QUFDakMscUNBQXNDO0FBR3RDLHNDQUEyQztBQUMzQywyREFBNEQ7QUFFakQsUUFBQSxVQUFVLEdBQUcsd0JBQWEsQ0FBQyxVQUFVLENBQUM7QUFFdEMsUUFBQSxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBSW5CLFFBQUEsYUFBYSxHQUFHLG1CQUFtQixDQUFDO0FBRXBDLFFBQUEsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFvQjFFLFNBQWdCLGFBQWEsQ0FBQyxPQUFpQjtJQUU5QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLHdCQUFhLENBQUMsVUFBVSxDQUFDO0lBRWxFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU5RCxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUVoRSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFdkUsSUFBSSxXQUFXLEdBQUcs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RDtRQUVELGFBQWEsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUMvQyxhQUFhLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7UUFFL0MsYUFBYSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDN0IsYUFBYSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFFN0IsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUMsQ0FBQztTQUNELEdBQUcsQ0FBQyxLQUFLO1FBRVQsY0FBYyxDQUFDLFVBQVUsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO1FBQ2pELGNBQWMsQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztRQUVqRCxjQUFjLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUM5QixjQUFjLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUU5QixNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO1lBQ3hELE1BQU0sRUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQ0Q7QUFDSCxDQUFDO0FBalJELGdDQWlSQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IHBhdGggPSByZXF1aXJlKFwidXBhdGgyXCIpO1xuaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBmcmVlR0MgfSBmcm9tICcuLi9saWIvdXRpbCc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IHsgdXNlRGVmYXVsdCwgZ2V0RGVmYXVsdE1vZExpc3QgfSBmcm9tICdub3ZlbC1zZWdtZW50L2xpYic7XG5pbXBvcnQgU2VnbWVudCBmcm9tICdub3ZlbC1zZWdtZW50L2xpYi9TZWdtZW50JztcbmltcG9ydCBUYWJsZURpY3QgZnJvbSAnbm92ZWwtc2VnbWVudC9saWIvdGFibGUvZGljdCc7XG5pbXBvcnQgRmFzdEdsb2IgPSByZXF1aXJlKCdmYXN0LWdsb2InKTtcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCB7IGNybGYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgZnNJY29udiA9IHJlcXVpcmUoJ2ZzLWljb252Jyk7XG5pbXBvcnQgeyB0dzJjbl9taW4sIGNuMnR3X21pbiwgdGFibGVDbjJUd0RlYnVnLCB0YWJsZVR3MkNuRGVidWcgfSBmcm9tICdjamstY29udi9saWIvemgvY29udmVydC9taW4nO1xuaW1wb3J0IHsgZG9fY24ydHdfbWluIH0gZnJvbSAnLi4vbGliL2NvbnYnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlX292ZXJ3cml0ZSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5cbmV4cG9ydCBsZXQgRElTVF9OT1ZFTCA9IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuZXhwb3J0IGxldCBDQUNIRV9USU1FT1VUID0gMzYwMDtcblxuZXhwb3J0IGxldCBfc2VnbWVudE9iamVjdDogU2VnbWVudDtcblxuZXhwb3J0IGNvbnN0IEVSUk9SX01TR18wMDEgPSBg5rKS5pyJ5pCc5bCL5Yiw5Lu75L2V5qqU5qGIIOiri+aqouafpeaQnOWwi+aineS7tmA7XG5cbmV4cG9ydCBjb25zdCBDQUNIRV9GSUxFID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2NhY2hlLmRiJyk7XG5cbmV4cG9ydCB0eXBlIElPcHRpb25zID0ge1xuXHRwYXRoTWFpbjogc3RyaW5nLFxuXHRwYXRoTWFpbl9vdXQ/OiBzdHJpbmcsXG5cdG5vdmVsSUQ6IHN0cmluZyxcblxuXHRzZWdtZW50PzogU2VnbWVudCxcblxuXHRub3ZlbF9yb290Pzogc3RyaW5nLFxuXG5cdGdsb2JQYXR0ZXJuPzogc3RyaW5nW10sXG5cblx0ZmlsZXM/OiBzdHJpbmdbXSxcblxuXHRoaWRlTG9nPzogYm9vbGVhbixcblxuXHRjYWxsYmFjaz8oZG9uZV9saXN0OiBzdHJpbmdbXSwgZmlsZTogc3RyaW5nLCBpbmRleDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciksXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZG9TZWdtZW50R2xvYihvcHRpb25zOiBJT3B0aW9ucylcbntcblx0Y29uc3Qgbm92ZWxfcm9vdCA9IG9wdGlvbnMubm92ZWxfcm9vdCB8fCBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG5cblx0Y29uc3Qgc2VnbWVudCA9IG9wdGlvbnMuc2VnbWVudCA9IGdldFNlZ21lbnQob3B0aW9ucy5zZWdtZW50KTtcblxuXHRvcHRpb25zLnBhdGhNYWluX291dCA9IG9wdGlvbnMucGF0aE1haW5fb3V0IHx8IG9wdGlvbnMucGF0aE1haW47XG5cblx0bGV0IENXRF9JTiA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW4sIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cdGxldCBDV0RfT1VUID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbl9vdXQsIG9wdGlvbnMubm92ZWxJRCwgbm92ZWxfcm9vdCk7XG5cblx0bGV0IGdsb2JQYXR0ZXJuID0gb3B0aW9ucy5nbG9iUGF0dGVybiB8fCBbXG5cdFx0JyoqLyoudHh0Jyxcblx0XTtcblxuXHRjb25zb2xlLmluZm8oJ1tkb10nLCBvcHRpb25zLnBhdGhNYWluLCBvcHRpb25zLm5vdmVsSUQpO1xuXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUob3B0aW9ucy5maWxlcyB8fCBGYXN0R2xvYihnbG9iUGF0dGVybiwge1xuXHRcdFx0Y3dkOiBDV0RfSU4sXG5cdFx0XHQvL2Fic29sdXRlOiB0cnVlLFxuXHRcdH0pIGFzIGFueSBhcyBQcm9taXNlPHN0cmluZ1tdPilcblx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9kb1NlZ21lbnRHbG9iKGxzLCBvcHRpb25zKTtcblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9kb1NlZ21lbnRHbG9iKGxzOiBzdHJpbmdbXSwgb3B0aW9uczogSU9wdGlvbnMpXG57XG5cdGNvbnN0IG5vdmVsX3Jvb3QgPSBvcHRpb25zLm5vdmVsX3Jvb3QgfHwgUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5cdGNvbnN0IHNlZ21lbnQgPSBvcHRpb25zLnNlZ21lbnQgPSBnZXRTZWdtZW50KG9wdGlvbnMuc2VnbWVudCk7XG5cblx0b3B0aW9ucy5wYXRoTWFpbl9vdXQgPSBvcHRpb25zLnBhdGhNYWluX291dCB8fCBvcHRpb25zLnBhdGhNYWluO1xuXG5cdGxldCBDV0RfSU4gPSBfcGF0aChvcHRpb25zLnBhdGhNYWluLCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXHRsZXQgQ1dEX09VVCA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW5fb3V0LCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXG5cdHJldHVybiBQcm9taXNlXG5cdFx0LnJlc29sdmUobHMpXG5cdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0e1xuXHRcdFx0aWYgKGxzLmxlbmd0aCA9PSAwKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKENXRF9JTik7XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KEVSUk9SX01TR18wMDEpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKGxzKVxuXHRcdHtcblx0XHRcdGxldCBsYWJlbCA9IGBhbGwgZmlsZSAke2xzLmxlbmd0aH1gO1xuXHRcdFx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRcdFx0Y29uc29sZS5sb2coYGFsbCBmaWxlICR7bHMubGVuZ3RofWApO1xuXG5cdFx0XHRsZXQgY291bnRfY2hhbmdlZCA9IDA7XG5cblx0XHRcdGxldCBkb25lX2xpc3QgPSBbXSBhcyBzdHJpbmdbXTtcblxuXHRcdFx0bGV0IHJzID0gYXdhaXQgUHJvbWlzZS5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChmaWxlLCBpbmRleCwgbGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgbGFiZWwgPSBmaWxlO1xuXG5cdFx0XHRcdC8vY29uc29sZS50aW1lKGxhYmVsKTtcblxuLy9cdFx0XHRcdGNvbnNvbGUubG9nKCdbc3RhcnRdJywgbGFiZWwpO1xuXG5cdFx0XHRcdGxldCBmaWxscGF0aCA9IHBhdGguam9pbihDV0RfSU4sIGZpbGUpO1xuXHRcdFx0XHRsZXQgZmlsbHBhdGhfb3V0ID0gcGF0aC5qb2luKENXRF9PVVQsIGZpbGUpO1xuXG4vL1x0XHRcdFx0Y29uc29sZS5sb2coZmlsbHBhdGgpO1xuLy9cdFx0XHRcdGNvbnNvbGUubG9nKGZpbGxwYXRoX291dCk7XG5cblx0XHRcdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhmaWxscGF0aCkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmNhbGxiYWNrKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGF3YWl0IG9wdGlvbnMuY2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdGNoYW5nZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXhpc3RzOiBmYWxzZSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKCFmaWxlLm1hdGNoKC9cXC50eHQkL2kpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdGNoYW5nZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXhpc3RzOiB0cnVlLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgdGV4dCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGxwYXRoKVxuXHRcdFx0XHRcdC50aGVuKHYgPT4gY3JsZih2LnRvU3RyaW5nKCkpKVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0aWYgKCF0ZXh0LnJlcGxhY2UoL1xccysvZywgJycpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLndhcm4oJ1tza2lwXScsIGxhYmVsKTtcblxuXHRcdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0YXdhaXQgb3B0aW9ucy5jYWxsYmFjayhkb25lX2xpc3QsIGZpbGUsIGluZGV4LCBsZW5ndGgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0Y2hhbmdlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRleGlzdHM6IHRydWUsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBfbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRsZXQga3MgPSBhd2FpdCBzZWdtZW50LmRvU2VnbWVudCh0ZXh0KTtcblxuXHRcdFx0XHRsZXQgdGltZXVzZSA9IERhdGUubm93KCkgLSBfbm93O1xuXG5cdFx0XHRcdGxldCB0ZXh0X25ldyA9IGF3YWl0IHNlZ21lbnQuc3RyaW5naWZ5KGtzKTtcblxuXHRcdFx0XHRsZXQgY2hhbmdlZCA9IHRleHRfbmV3ICE9IHRleHQ7XG5cblx0XHRcdFx0aWYgKGNoYW5nZWQpXG5cdFx0XHRcdHtcbi8vXHRcdFx0XHRcdGNvbnNvbGUud2FybignW2NoYW5nZWRdJywgbGFiZWwpO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxscGF0aF9vdXQsIHRleHRfbmV3KTtcblxuXHRcdFx0XHRcdGNvdW50X2NoYW5nZWQrKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjaGFuZ2VkKVxuXHRcdFx0XHR7XG5cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbZG9uZV0nLCBsYWJlbCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRpZiAob3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGF3YWl0IG9wdGlvbnMuY2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGtzID0gbnVsbDtcblxuXHRcdFx0XHR0ZXh0ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR0ZXh0X25ldyA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0Y2hhbmdlZCxcblx0XHRcdFx0XHRleGlzdHM6IHRydWUsXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHRcdFx0Y29uc29sZVtjb3VudF9jaGFuZ2VkID8gJ29rJyA6ICdkZWJ1ZyddKGBmaWxlIGNoYW5nZWQ6ICR7Y291bnRfY2hhbmdlZH1gKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bHMsXG5cdFx0XHRcdGRvbmVfbGlzdCxcblx0XHRcdFx0Y291bnQ6IHtcblx0XHRcdFx0XHRmaWxlOiBscy5sZW5ndGgsXG5cdFx0XHRcdFx0Y2hhbmdlZDogY291bnRfY2hhbmdlZCxcblx0XHRcdFx0XHRkb25lOiBkb25lX2xpc3QubGVuZ3RoLFxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX3BhdGgocGF0aE1haW4sIG5vdmVsSUQsIG5vdmVsX3Jvb3QgPSBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QpOiBzdHJpbmdcbntcblx0bGV0IHA6IHN0cmluZztcblxuXHR0cnlcblx0e1xuXHRcdHAgPSBwYXRoLnJlc29sdmUobm92ZWxfcm9vdCwgcGF0aE1haW4sIG5vdmVsSUQpXG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblx0XHRjb25zb2xlLmRpcih7XG5cdFx0XHRub3ZlbF9yb290LFxuXHRcdFx0cGF0aE1haW4sXG5cdFx0XHRub3ZlbElELFxuXHRcdH0pO1xuXG5cdFx0dGhyb3cgZTtcblx0fVxuXG5cdHJldHVybiBwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VnbWVudChzZWdtZW50PzogU2VnbWVudClcbntcblx0aWYgKCFzZWdtZW50KVxuXHR7XG5cdFx0aWYgKCFfc2VnbWVudE9iamVjdClcblx0XHR7XG5cdFx0XHRzZWdtZW50ID0gX3NlZ21lbnRPYmplY3QgPSBjcmVhdGVTZWdtZW50KCk7XG5cblx0XHRcdGxldCBkYl9kaWN0ID0gZ2V0RGljdE1haW4oc2VnbWVudCk7XG5cdFx0fVxuXG5cdFx0c2VnbWVudCA9IF9zZWdtZW50T2JqZWN0O1xuXHR9XG5cblx0cmV0dXJuIHNlZ21lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldFNlZ21lbnRDYWNoZSgpXG57XG5cdGxldCBjYWNoZV9maWxlID0gQ0FDSEVfRklMRTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhjYWNoZV9maWxlKSlcblx0e1xuXHRcdGNvbnNvbGUucmVkKGBbU2VnbWVudF0gcmVzZXQgY2FjaGVgKTtcblx0XHRmcy5yZW1vdmVTeW5jKGNhY2hlX2ZpbGUpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWdtZW50KHVzZUNhY2hlOiBib29sZWFuID0gdHJ1ZSlcbntcblx0Y29uc3Qgc2VnbWVudCA9IG5ldyBTZWdtZW50KHtcblx0XHRhdXRvQ2prOiB0cnVlLFxuXG5cdFx0b3B0aW9uc0RvU2VnbWVudDoge1xuXG5cdFx0XHRjb252ZXJ0U3lub255bTogdHJ1ZSxcblxuXHRcdH0sXG5cdH0pO1xuXG5cdGxldCBjYWNoZV9maWxlID0gQ0FDSEVfRklMRTtcblxuXHRsZXQgb3B0aW9ucyA9IHtcblx0XHQvKipcblx0XHQgKiDplovllZ8gYWxsX21vZCDmiY3mnIPlnKjoh6rli5XovInlhaXmmYLljIXlkKsgWmh0U3lub255bU9wdGltaXplclxuXHRcdCAqL1xuXHRcdGFsbF9tb2Q6IHRydWUsXG5cdH07XG5cblx0Y29uc29sZS50aW1lKGDoroDlj5bmqKHntYToiIflrZflhbhgKTtcblxuXHQvKipcblx0ICog5L2/55So57ep5a2Y55qE5a2X5YW45qqU56+E5L6LXG5cdCAqL1xuXHRpZiAodXNlQ2FjaGUgJiYgZnMuZXhpc3RzU3luYyhjYWNoZV9maWxlKSlcblx0e1xuXHRcdC8vY29uc29sZS5sb2coYOeZvOePviBjYWNoZS5kYmApO1xuXG5cdFx0bGV0IHN0ID0gZnMuc3RhdFN5bmMoY2FjaGVfZmlsZSk7XG5cblx0XHRsZXQgbWQgPSAoRGF0ZS5ub3coKSAtIHN0Lm10aW1lTXMpIC8gMTAwMDtcblxuXHRcdC8vY29uc29sZS5sb2coYOi3nembouS4iuasoee3qeWtmOW3sumBjiAke21kfXNgKTtcblxuXHRcdGlmIChtZCA8IENBQ0hFX1RJTUVPVVQpXG5cdFx0e1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhzdCwgbWQpO1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGDplovlp4vovInlhaXnt6nlrZjlrZflhbhgKTtcblxuXHRcdFx0bGV0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjYWNoZV9maWxlKS50b1N0cmluZygpKTtcblxuXHRcdFx0dXNlRGVmYXVsdChzZWdtZW50LCB7XG5cdFx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRcdG5vZGljdDogdHJ1ZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRzZWdtZW50LkRJQ1QgPSBkYXRhLkRJQ1Q7XG5cblx0XHRcdHNlZ21lbnQuaW5pdGVkID0gdHJ1ZTtcblxuXHRcdFx0Y2FjaGVfZmlsZSA9IG51bGw7XG5cdFx0XHRkYXRhID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0fVxuXG5cdGlmICghc2VnbWVudC5pbml0ZWQpXG5cdHtcblx0XHQvL2NvbnNvbGUubG9nKGDph43mlrDovInlhaXliIbmnpDlrZflhbhgKTtcblx0XHRzZWdtZW50LmF1dG9Jbml0KG9wdGlvbnMpO1xuXG5cdFx0Ly8g57Ch6L2J57mB5bCI55SoXG5cdFx0Ly9zZWdtZW50LmxvYWRTeW5vbnltRGljdCgnemh0LnN5bm9ueW0udHh0Jyk7XG5cdH1cblxuXHRsZXQgZGJfZGljdCA9IHNlZ21lbnQuZ2V0RGljdERhdGFiYXNlKCdUQUJMRScsIHRydWUpO1xuXHRkYl9kaWN0LlRBQkxFID0gc2VnbWVudC5ESUNUWydUQUJMRSddO1xuXHRkYl9kaWN0LlRBQkxFMiA9IHNlZ21lbnQuRElDVFsnVEFCTEUyJ107XG5cblx0ZGJfZGljdC5vcHRpb25zLmF1dG9DamsgPSB0cnVlO1xuXG5cdC8vY29uc29sZS5sb2coJ+S4u+Wtl+WFuOe4veaVuCcsIGRiX2RpY3Quc2l6ZSgpKTtcblxuXHRjb25zb2xlLnRpbWVFbmQoYOiugOWPluaooee1hOiIh+Wtl+WFuGApO1xuXG5cdGlmICh1c2VDYWNoZSAmJiBjYWNoZV9maWxlKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhg57ep5a2Y5a2X5YW45pa8IGNhY2hlLmRiYCk7XG5cblx0XHRmcy5vdXRwdXRGaWxlU3luYyhjYWNoZV9maWxlLCBKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRESUNUOiBzZWdtZW50LkRJQ1QsXG5cdFx0fSkpO1xuXHR9XG5cblx0ZnJlZUdDKCk7XG5cblx0cmV0dXJuIHNlZ21lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaWN0TWFpbihzZWdtZW50OiBTZWdtZW50KVxue1xuXHRyZXR1cm4gc2VnbWVudC5nZXREaWN0RGF0YWJhc2UoJ1RBQkxFJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5TZWdtZW50KClcbntcblx0bGV0IF9jYWNoZV9maWxlX3NlZ21lbnQgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLnNlZ21lbnQnKTtcblxuXHRsZXQgX2NhY2hlX3NlZ21lbnQ6IHtcblxuXHRcdHNfdmVyPzogc3RyaW5nLFxuXHRcdGRfdmVyPzogc3RyaW5nLFxuXG5cdFx0bGFzdF9zX3Zlcj86IHN0cmluZyxcblx0XHRsYXN0X2RfdmVyPzogc3RyaW5nLFxuXG5cdFx0bGlzdDoge1xuXHRcdFx0W2s6IHN0cmluZ106IHtcblx0XHRcdFx0W2s6IHN0cmluZ106IHtcblx0XHRcdFx0XHRzX3Zlcj86IHN0cmluZyxcblx0XHRcdFx0XHRkX3Zlcj86IHN0cmluZyxcblxuXHRcdFx0XHRcdGxhc3Rfc192ZXI/OiBzdHJpbmcsXG5cdFx0XHRcdFx0bGFzdF9kX3Zlcj86IHN0cmluZyxcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xuXG5cdGxldCBfc192ZXI6IHN0cmluZyA9IFN0cmluZyhyZXF1aXJlKFwibm92ZWwtc2VnbWVudFwiKS52ZXJzaW9uIHx8ICcxJyk7XG5cdGxldCBfZF92ZXI6IHN0cmluZyA9IFN0cmluZyhyZXF1aXJlKFwic2VnbWVudC1kaWN0XCIpLnZlcnNpb24gfHwgJzEnKTtcblxuXHRpZiAoZnMuZXhpc3RzU3luYyhfY2FjaGVfZmlsZV9zZWdtZW50KSlcblx0e1xuXHRcdHRyeVxuXHRcdHtcblx0XHRcdF9jYWNoZV9zZWdtZW50ID0gZnMucmVhZEpTT05TeW5jKF9jYWNoZV9maWxlX3NlZ21lbnQpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cdH1cblxuXHQvLyBAdHMtaWdub3JlXG5cdF9jYWNoZV9zZWdtZW50ID0gX2NhY2hlX3NlZ21lbnQgfHwge307XG5cdF9jYWNoZV9zZWdtZW50Lmxpc3QgPSBfY2FjaGVfc2VnbWVudC5saXN0IHx8IHt9O1xuXG5cdHtcblx0XHRsZXQgeyBsYXN0X3NfdmVyLCBsYXN0X2RfdmVyLCBzX3ZlciwgZF92ZXIgfSA9IF9jYWNoZV9zZWdtZW50O1xuXHRcdGNvbnNvbGUuZGVidWcoe1xuXHRcdFx0X3NfdmVyLFxuXHRcdFx0X2RfdmVyLFxuXG5cdFx0XHRzX3Zlcixcblx0XHRcdGRfdmVyLFxuXHRcdH0pO1xuXG5cdFx0aWYgKHNfdmVyICE9IF9zX3ZlciB8fCBkX3ZlciAhPSBfZF92ZXIpXG5cdFx0e1xuXHRcdFx0cmVzZXRTZWdtZW50Q2FjaGUoKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gUHJvbWlzZVxuXHRcdC5tYXBTZXJpZXMoRmFzdEdsb2IoW1xuXHRcdFx0JyovKi5qc29uJyxcblx0XHRdLCB7XG5cdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycpLFxuXHRcdH0pLCBhc3luYyBmdW5jdGlvbiAoaWQ6IHN0cmluZylcblx0XHR7XG5cdFx0XHRsZXQgW3BhdGhNYWluLCBub3ZlbElEXSA9IGlkLnNwbGl0KC9bXFxcXFxcL10vKTtcblxuXHRcdFx0bm92ZWxJRCA9IHBhdGguYmFzZW5hbWUobm92ZWxJRCwgJy5qc29uJyk7XG5cblx0XHRcdGxldCBucCA9IF9wYXRoKHBhdGhNYWluLCBub3ZlbElEKTtcblxuXHRcdFx0aWYgKCFmcy5leGlzdHNTeW5jKG5wKSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVtb3ZlKHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycsIGlkKSk7XG5cblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgYmluID0gcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnYmluL19kb19zZWdtZW50LmpzJyk7XG5cblx0XHRcdGxldCBfcnVuX2FsbDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdFx0XHRfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdID0gX2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXSB8fCB7fTtcblxuXHRcdFx0bGV0IF9jdXJyZW50X2RhdGEgPSBfY2FjaGVfc2VnbWVudC5saXN0W25vdmVsSURdW25vdmVsSURdID0gX2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXVtub3ZlbElEXSB8fCB7fTtcblxuXHRcdFx0bGV0IF9oYW5kbGVfbGlzdDogc3RyaW5nW10gPSBbXTtcblxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZGlyID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2ZpbGVzJywgcGF0aE1haW4pO1xuXHRcdFx0XHRsZXQganNvbmZpbGUgPSBwYXRoLmpvaW4oZGlyLCBub3ZlbElEICsgJy5qc29uJyk7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGUpXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdF9oYW5kbGVfbGlzdC5wdXNoKC4uLmxzKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChlID0+IG51bGwpXG5cdFx0XHRcdDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9jdXJyZW50X2RhdGEuZF92ZXIgIT0gX2RfdmVyIHx8IF9jdXJyZW50X2RhdGEuc192ZXIgIT0gX3NfdmVyKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmRlYnVnKHtcblx0XHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0XHRub3ZlbElELFxuXHRcdFx0XHRcdHNfdmVyOiBfY3VycmVudF9kYXRhLnNfdmVyLFxuXHRcdFx0XHRcdGRfdmVyOiBfY3VycmVudF9kYXRhLmRfdmVyLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfcnVuX2FsbCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdub2RlJywgW1xuXHRcdFx0XHQnLS1tYXgtb2xkLXNwYWNlLXNpemU9MjA0OCcsXG5cdFx0XHRcdC8vJy0tZXhwb3NlLWdjJyxcblx0XHRcdFx0YmluLFxuXHRcdFx0XHQnLS1wYXRoTWFpbicsXG5cdFx0XHRcdHBhdGhNYWluLFxuXHRcdFx0XHQnLS1ub3ZlbElEJyxcblx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0Jy0tcnVuQWxsJyxcblx0XHRcdFx0U3RyaW5nKF9ydW5fYWxsKSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBESVNUX05PVkVMLFxuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChjcC5zdGF0dXMgPiAwKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW1NlZ21lbnRdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRjd2Q6IERJU1RfTk9WRUwsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGF3YWl0IGZzLm91dHB1dEpTT04oX2NhY2hlX2ZpbGVfc2VnbWVudCwgX2NhY2hlX3NlZ21lbnQsIHtcblx0XHRcdFx0XHRzcGFjZXM6IFwiXFx0XCIsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkaXIgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnLCBwYXRoTWFpbik7XG5cdFx0XHRcdGxldCBqc29uZmlsZSA9IHBhdGguam9pbihkaXIsIG5vdmVsSUQgKyAnLmpzb24nKTtcblx0XHRcdFx0bGV0IGpzb25maWxlX2RvbmUgPSBqc29uZmlsZSArICcuZG9uZSc7XG5cblx0XHRcdFx0YXdhaXQgZnMucmVhZEpTT04oanNvbmZpbGVfZG9uZSlcblx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHM6IHN0cmluZ1tdKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBDV0RfSU4gPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cdFx0XHRcdFx0XHRsZXQgY2prX2NoYW5nZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRcdFx0XHRcdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhDV0RfSU4pKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGxzID0gKGxzIHx8IFtdKVxuXHRcdFx0XHRcdFx0XHQuY29uY2F0KF9oYW5kbGVfbGlzdClcblx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0bHMgPSBhcnJheV91bmlxdWVfb3ZlcndyaXRlKGxzKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFscy5sZW5ndGggfHwgIWxzKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiBCbHVlYmlyZFxuXHRcdFx0XHRcdFx0XHQubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZmlsZSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChwYXRoLmV4dG5hbWUoZmlsZSkgPT0gJy50eHQnKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBmdWxscGF0aCA9IHBhdGguam9pbihDV0RfSU4sIGZpbGUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgZnMucmVhZEZpbGUoZnVsbHBhdGgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChidWYpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoYnVmICYmIGJ1Zi5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IHR4dF9vbGQgPSBTdHJpbmcoYnVmKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCB0eHRfbmV3ID0gZG9fY24ydHdfbWluKHR4dF9vbGQpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eXFxzKlxcbi8sICcnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvKD88PVxcbilcXHMqXFxuXFxzKiQvLCAnJylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHR4dF9vbGQgIT0gdHh0X25ldyAmJiB0eHRfbmV3KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjamtfY2hhbmdlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZzLndyaXRlRmlsZShmdWxscGF0aCwgdHh0X25ldylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcyhgW2Nqay1jb252XWAsIGZpbGUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZnVsbHBhdGg7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGJ1Zik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC5jYXRjaChlID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQubWFwU2VyaWVzKGZ1bmN0aW9uIChmdWxscGF0aClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGZ1bGxwYXRoICYmIGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHQnYWRkJyxcblx0XHRcdFx0XHRcdFx0XHRcdGZ1bGxwYXRoLFxuXHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IENXRF9JTixcblx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBmdWxscGF0aFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoY2prX2NoYW5nZWQpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGBbY2prLWNvbnZdICR7cGF0aE1haW59ICR7bm92ZWxJRH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IENXRF9JTixcblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChlID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQ7XG5cdFx0XHR9XG5cblx0XHRcdF9jdXJyZW50X2RhdGEubGFzdF9zX3ZlciA9IF9jdXJyZW50X2RhdGEuc192ZXI7XG5cdFx0XHRfY3VycmVudF9kYXRhLmxhc3RfZF92ZXIgPSBfY3VycmVudF9kYXRhLmRfdmVyO1xuXG5cdFx0XHRfY3VycmVudF9kYXRhLnNfdmVyID0gX3NfdmVyO1xuXHRcdFx0X2N1cnJlbnRfZGF0YS5kX3ZlciA9IF9kX3ZlcjtcblxuXHRcdFx0cmV0dXJuIGNwLnN0YXR1cztcblx0XHR9KVxuXHRcdC50YXAoYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5sYXN0X3NfdmVyID0gX2NhY2hlX3NlZ21lbnQuc192ZXI7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5sYXN0X2RfdmVyID0gX2NhY2hlX3NlZ21lbnQuZF92ZXI7XG5cblx0XHRcdF9jYWNoZV9zZWdtZW50LnNfdmVyID0gX3NfdmVyO1xuXHRcdFx0X2NhY2hlX3NlZ21lbnQuZF92ZXIgPSBfZF92ZXI7XG5cblx0XHRcdGF3YWl0IGZzLm91dHB1dEpTT04oX2NhY2hlX2ZpbGVfc2VnbWVudCwgX2NhY2hlX3NlZ21lbnQsIHtcblx0XHRcdFx0c3BhY2VzOiBcIlxcdFwiLFxuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQ7XG59XG4iXX0=