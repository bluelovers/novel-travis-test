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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZ21lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtCQUErQjtBQUMvQixvQ0FBMEM7QUFDMUMsc0NBQXFDO0FBQ3JDLHNEQUE4QztBQUM5QywrQkFBK0I7QUFDL0IsMkNBQWtFO0FBQ2xFLHVEQUFnRDtBQUVoRCxzQ0FBc0M7QUFDdEMsb0NBQW9DO0FBQ3BDLG1EQUFzQztBQUN0QyxvQ0FBaUM7QUFFdEIsUUFBQSxVQUFVLEdBQUcsd0JBQWEsQ0FBQyxVQUFVLENBQUM7QUFFdEMsUUFBQSxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBSW5CLFFBQUEsYUFBYSxHQUFHLG1CQUFtQixDQUFDO0FBRXBDLFFBQUEsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFvQjFFLFNBQWdCLGFBQWEsQ0FBQyxPQUFpQjtJQUU5QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLHdCQUFhLENBQUMsVUFBVSxDQUFDO0lBRWxFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU5RCxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUVoRSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFdkUsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSTtRQUN4QyxVQUFVO0tBQ1YsQ0FBQztJQUVGLGFBQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXhELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUU7UUFDNUQsR0FBRyxFQUFFLE1BQU07S0FFWCxDQUE2QixDQUFDO1NBQzlCLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFFakIsT0FBTyxjQUFjLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUNEO0FBQ0gsQ0FBQztBQTFCRCxzQ0EwQkM7QUFFRCxTQUFnQixjQUFjLENBQUMsRUFBWSxFQUFFLE9BQWlCO0lBRTdELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksd0JBQWEsQ0FBQyxVQUFVLENBQUM7SUFFbEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTlELE9BQU8sQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDO0lBRWhFLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbEUsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV2RSxPQUFPLE9BQU87U0FDWixPQUFPLENBQUMsRUFBRSxDQUFDO1NBQ1gsR0FBRyxDQUFDLFVBQVUsRUFBRTtRQUVoQixJQUFJLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUNsQjtZQUNDLHNCQUFzQjtZQUV0QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMscUJBQWEsQ0FBQyxDQUFDO1NBQ3JDO0lBQ0YsQ0FBQyxDQUFDO1NBQ0QsSUFBSSxDQUFDLEtBQUssV0FBVyxFQUFFO1FBRXZCLElBQUksS0FBSyxHQUFHLFlBQVksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BDLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFcEIsYUFBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRXJDLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUV0QixJQUFJLFNBQVMsR0FBRyxFQUFjLENBQUM7UUFFL0IsSUFBSSxFQUFFLEdBQUcsTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxLQUFLLFdBQVcsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNO1lBRXZFLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztZQUVqQixzQkFBc0I7WUFFMUIsb0NBQW9DO1lBRWhDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWhELDRCQUE0QjtZQUM1QixnQ0FBZ0M7WUFFNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQ2hDO2dCQUNDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXJCLElBQUksT0FBTyxDQUFDLFFBQVEsRUFDcEI7b0JBQ0MsTUFBTSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUN2RDtnQkFFRCxPQUFPO29CQUNOLElBQUk7b0JBQ0osT0FBTyxFQUFFLEtBQUs7b0JBQ2QsTUFBTSxFQUFFLEtBQUs7aUJBQ2IsQ0FBQzthQUNGO2lCQUNJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUMvQjtnQkFDQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVyQixPQUFPO29CQUNOLElBQUk7b0JBQ0osT0FBTyxFQUFFLEtBQUs7b0JBQ2QsTUFBTSxFQUFFLElBQUk7aUJBQ1osQ0FBQzthQUNGO1lBRUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztpQkFDcEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMscUJBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUM5QjtZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFDN0I7Z0JBQ0MsZ0NBQWdDO2dCQUVoQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVyQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQ3BCO29CQUNDLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDdkQ7Z0JBRUQsT0FBTztvQkFDTixJQUFJO29CQUNKLE9BQU8sRUFBRSxLQUFLO29CQUNkLE1BQU0sRUFBRSxJQUFJO2lCQUNaLENBQUM7YUFDRjtZQUVELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUV0QixJQUFJLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFdkMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztZQUVoQyxJQUFJLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFM0MsSUFBSSxPQUFPLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQztZQUUvQixJQUFJLE9BQU8sRUFDWDtnQkFDSix3Q0FBd0M7Z0JBRW5DLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBRTVDLGFBQWEsRUFBRSxDQUFDO2FBQ2hCO1lBRUQsSUFBSSxPQUFPLEVBQ1g7YUFFQztpQkFFRDtnQkFDQywrQkFBK0I7YUFDL0I7WUFFRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJCLElBQUksT0FBTyxDQUFDLFFBQVEsRUFDcEI7Z0JBQ0MsTUFBTSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQ3ZEO1lBRUQsRUFBRSxHQUFHLElBQUksQ0FBQztZQUVWLElBQUksR0FBRyxTQUFTLENBQUM7WUFDakIsUUFBUSxHQUFHLFNBQVMsQ0FBQztZQUVyQixPQUFPO2dCQUNOLElBQUk7Z0JBQ0osT0FBTztnQkFDUCxNQUFNLEVBQUUsSUFBSTthQUNaLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGFBQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdkIsYUFBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxpQkFBaUIsYUFBYSxFQUFFLENBQUMsQ0FBQztRQUUxRSxPQUFPO1lBQ04sRUFBRTtZQUNGLFNBQVM7WUFDVCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLEVBQUUsQ0FBQyxNQUFNO2dCQUNmLE9BQU8sRUFBRSxhQUFhO2dCQUN0QixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07YUFDdEI7U0FDRCxDQUFBO0lBQ0YsQ0FBQyxDQUFDLENBQ0Q7QUFDSCxDQUFDO0FBN0pELHdDQTZKQztBQUVELFNBQWdCLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFVBQVUsR0FBRyx3QkFBYSxDQUFDLFVBQVU7SUFFN0UsSUFBSSxDQUFTLENBQUM7SUFFZCxJQUNBO1FBQ0MsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQTtLQUMvQztJQUNELE9BQU8sQ0FBQyxFQUNSO1FBQ0MsYUFBTyxDQUFDLEdBQUcsQ0FBQztZQUNYLFVBQVU7WUFDVixRQUFRO1lBQ1IsT0FBTztTQUNQLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxDQUFDO0tBQ1I7SUFFRCxPQUFPLENBQUMsQ0FBQztBQUNWLENBQUM7QUFwQkQsc0JBb0JDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE9BQWlCO0lBRTNDLElBQUksQ0FBQyxPQUFPLEVBQ1o7UUFDQyxJQUFJLENBQUMsc0JBQWMsRUFDbkI7WUFDQyxPQUFPLEdBQUcsc0JBQWMsR0FBRyxhQUFhLEVBQUUsQ0FBQztZQUUzQyxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDbkM7UUFFRCxPQUFPLEdBQUcsc0JBQWMsQ0FBQztLQUN6QjtJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2hCLENBQUM7QUFmRCxnQ0FlQztBQUVELFNBQWdCLGlCQUFpQjtJQUVoQyxJQUFJLFVBQVUsR0FBRyxrQkFBVSxDQUFDO0lBRTVCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFDN0I7UUFDQyxhQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDckMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUMxQjtBQUNGLENBQUM7QUFURCw4Q0FTQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxXQUFvQixJQUFJO0lBRXJELE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sQ0FBQztRQUMzQixPQUFPLEVBQUUsSUFBSTtRQUViLGdCQUFnQixFQUFFO1lBRWpCLGNBQWMsRUFBRSxJQUFJO1NBRXBCO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBSSxVQUFVLEdBQUcsa0JBQVUsQ0FBQztJQUU1QixJQUFJLE9BQU8sR0FBRztRQUNiOztXQUVHO1FBQ0gsT0FBTyxFQUFFLElBQUk7S0FDYixDQUFDO0lBRUYsYUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUV4Qjs7T0FFRztJQUNILElBQUksUUFBUSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQ3pDO1FBQ0MsNkJBQTZCO1FBRTdCLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFakMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztRQUUxQyxpQ0FBaUM7UUFFakMsSUFBSSxFQUFFLEdBQUcscUJBQWEsRUFDdEI7WUFDQyxzQkFBc0I7WUFFdEIsMEJBQTBCO1lBRTFCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRTlELGdCQUFVLENBQUMsT0FBTyxFQUFFO2dCQUNuQixHQUFHLE9BQU87Z0JBQ1YsTUFBTSxFQUFFLElBQUk7YUFDWixDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFFekIsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFFdEIsVUFBVSxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLEdBQUcsU0FBUyxDQUFDO1NBQ2pCO0tBQ0Q7SUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFDbkI7UUFDQywwQkFBMEI7UUFDMUIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUUxQixRQUFRO1FBQ1IsNkNBQTZDO0tBQzdDO0lBRUQsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDckQsT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV4QyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFFL0IsdUNBQXVDO0lBRXZDLGFBQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFM0IsSUFBSSxRQUFRLElBQUksVUFBVSxFQUMxQjtRQUNDLGdDQUFnQztRQUVoQyxFQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQzVDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtTQUNsQixDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsYUFBTSxFQUFFLENBQUM7SUFFVCxPQUFPLE9BQU8sQ0FBQztBQUNoQixDQUFDO0FBekZELHNDQXlGQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxPQUFnQjtJQUUzQyxPQUFPLE9BQU8sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsVUFBVTtJQUV6QixJQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFMUUsSUFBSSxjQW1CSCxDQUFDO0lBRUYsSUFBSSxNQUFNLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDLENBQUM7SUFDckUsSUFBSSxNQUFNLEdBQVcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDLENBQUM7SUFFcEUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLEVBQ3RDO1FBQ0MsSUFDQTtZQUNDLGNBQWMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDdEQ7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO0tBQ0Q7SUFFRCxhQUFhO0lBQ2IsY0FBYyxHQUFHLGNBQWMsSUFBSSxFQUFFLENBQUM7SUFDdEMsY0FBYyxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUVoRDtRQUNDLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxjQUFjLENBQUM7UUFDOUQsYUFBTyxDQUFDLEtBQUssQ0FBQztZQUNiLE1BQU07WUFDTixNQUFNO1lBRU4sS0FBSztZQUNMLEtBQUs7U0FDTCxDQUFDLENBQUM7UUFFSCxJQUFJLEtBQUssSUFBSSxNQUFNLElBQUksS0FBSyxJQUFJLE1BQU0sRUFDdEM7WUFDQyxpQkFBaUIsRUFBRSxDQUFDO1NBQ3BCO0tBQ0Q7SUFFRCxPQUFPLE9BQU87U0FDWixTQUFTLENBQUMsUUFBUSxDQUFDO1FBQ25CLFVBQVU7S0FDVixFQUFFO1FBQ0YsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDO0tBQ2pELENBQUMsRUFBRSxLQUFLLFdBQVcsRUFBVTtRQUU3QixJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFN0MsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFbEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQ3RCO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFakMsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEUsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNWO1FBRUQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBRXRFLElBQUksUUFBUSxHQUFZLEtBQUssQ0FBQztRQUU5QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRWxFLElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFeEcsSUFBSSxhQUFhLENBQUMsS0FBSyxJQUFJLE1BQU0sSUFBSSxhQUFhLENBQUMsS0FBSyxJQUFJLE1BQU0sRUFDbEU7WUFDQyxhQUFPLENBQUMsS0FBSyxDQUFDO2dCQUNiLFFBQVE7Z0JBQ1IsT0FBTztnQkFDUCxLQUFLLEVBQUUsYUFBYSxDQUFDLEtBQUs7Z0JBQzFCLEtBQUssRUFBRSxhQUFhLENBQUMsS0FBSzthQUMxQixDQUFDLENBQUM7WUFFSCxRQUFRLEdBQUcsSUFBSSxDQUFDO1NBQ2hCO1FBRUQsSUFBSSxFQUFFLEdBQUcsc0JBQWMsQ0FBQyxNQUFNLEVBQUU7WUFDL0IsMkJBQTJCO1lBQzNCLGdCQUFnQjtZQUNoQixHQUFHO1lBQ0gsWUFBWTtZQUNaLFFBQVE7WUFDUixXQUFXO1lBQ1gsT0FBTztZQUNQLFVBQVU7WUFDVixNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ2hCLEVBQUU7WUFDRixLQUFLLEVBQUUsU0FBUztZQUNoQixHQUFHLEVBQUUsa0JBQVU7U0FDZixDQUFDLENBQUM7UUFFSCxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUNqQjtZQUNDLHNCQUFjLENBQUMsS0FBSyxFQUFFO2dCQUNyQixRQUFRO2dCQUNSLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixhQUFhLFFBQVEsSUFBSSxPQUFPLEVBQUU7YUFDbEMsRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLGtCQUFVO2FBQ2YsQ0FBQyxDQUFDO1lBRUgsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRTtnQkFDeEQsTUFBTSxFQUFFLElBQUk7YUFDWixDQUFDLENBQUM7U0FDSDtRQUVELGFBQWEsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUMvQyxhQUFhLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7UUFFL0MsYUFBYSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDN0IsYUFBYSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFFN0IsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUMsQ0FBQztTQUNELEdBQUcsQ0FBQyxLQUFLO1FBRVQsY0FBYyxDQUFDLFVBQVUsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO1FBQ2pELGNBQWMsQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztRQUVqRCxjQUFjLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUM5QixjQUFjLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUU5QixNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO1lBQ3hELE1BQU0sRUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQ0Q7QUFDSCxDQUFDO0FBM0pELGdDQTJKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNi8wMTYuXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwidXBhdGgyXCI7XG5pbXBvcnQgeyBjcm9zc1NwYXduU3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGZyZWVHQyB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IHVzZURlZmF1bHQsIGdldERlZmF1bHRNb2RMaXN0IH0gZnJvbSAnbm92ZWwtc2VnbWVudC9saWInO1xuaW1wb3J0IFNlZ21lbnQgZnJvbSAnbm92ZWwtc2VnbWVudC9saWIvU2VnbWVudCc7XG5pbXBvcnQgVGFibGVEaWN0IGZyb20gJ25vdmVsLXNlZ21lbnQvbGliL3RhYmxlL2RpY3QnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgY3JsZiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuXG5leHBvcnQgbGV0IERJU1RfTk9WRUwgPSBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG5cbmV4cG9ydCBsZXQgQ0FDSEVfVElNRU9VVCA9IDM2MDA7XG5cbmV4cG9ydCBsZXQgX3NlZ21lbnRPYmplY3Q6IFNlZ21lbnQ7XG5cbmV4cG9ydCBjb25zdCBFUlJPUl9NU0dfMDAxID0gYOaykuacieaQnOWwi+WIsOS7u+S9leaqlOahiCDoq4vmqqLmn6XmkJzlsIvmop3ku7ZgO1xuXG5leHBvcnQgY29uc3QgQ0FDSEVfRklMRSA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdjYWNoZS5kYicpO1xuXG5leHBvcnQgdHlwZSBJT3B0aW9ucyA9IHtcblx0cGF0aE1haW46IHN0cmluZyxcblx0cGF0aE1haW5fb3V0Pzogc3RyaW5nLFxuXHRub3ZlbElEOiBzdHJpbmcsXG5cblx0c2VnbWVudD86IFNlZ21lbnQsXG5cblx0bm92ZWxfcm9vdD86IHN0cmluZyxcblxuXHRnbG9iUGF0dGVybj86IHN0cmluZ1tdLFxuXG5cdGZpbGVzPzogc3RyaW5nW10sXG5cblx0aGlkZUxvZz86IGJvb2xlYW4sXG5cblx0Y2FsbGJhY2s/KGRvbmVfbGlzdDogc3RyaW5nW10sIGZpbGU6IHN0cmluZywgaW5kZXg6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRvU2VnbWVudEdsb2Iob3B0aW9uczogSU9wdGlvbnMpXG57XG5cdGNvbnN0IG5vdmVsX3Jvb3QgPSBvcHRpb25zLm5vdmVsX3Jvb3QgfHwgUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5cdGNvbnN0IHNlZ21lbnQgPSBvcHRpb25zLnNlZ21lbnQgPSBnZXRTZWdtZW50KG9wdGlvbnMuc2VnbWVudCk7XG5cblx0b3B0aW9ucy5wYXRoTWFpbl9vdXQgPSBvcHRpb25zLnBhdGhNYWluX291dCB8fCBvcHRpb25zLnBhdGhNYWluO1xuXG5cdGxldCBDV0RfSU4gPSBfcGF0aChvcHRpb25zLnBhdGhNYWluLCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXHRsZXQgQ1dEX09VVCA9IF9wYXRoKG9wdGlvbnMucGF0aE1haW5fb3V0LCBvcHRpb25zLm5vdmVsSUQsIG5vdmVsX3Jvb3QpO1xuXG5cdGxldCBnbG9iUGF0dGVybiA9IG9wdGlvbnMuZ2xvYlBhdHRlcm4gfHwgW1xuXHRcdCcqKi8qLnR4dCcsXG5cdF07XG5cblx0Y29uc29sZS5pbmZvKCdbZG9dJywgb3B0aW9ucy5wYXRoTWFpbiwgb3B0aW9ucy5ub3ZlbElEKTtcblxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9wdGlvbnMuZmlsZXMgfHwgRmFzdEdsb2IoZ2xvYlBhdHRlcm4sIHtcblx0XHRcdGN3ZDogQ1dEX0lOLFxuXHRcdFx0Ly9hYnNvbHV0ZTogdHJ1ZSxcblx0XHR9KSBhcyBhbnkgYXMgUHJvbWlzZTxzdHJpbmdbXT4pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdHtcblx0XHRcdHJldHVybiBfZG9TZWdtZW50R2xvYihscywgb3B0aW9ucyk7XG5cdFx0fSlcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZG9TZWdtZW50R2xvYihsczogc3RyaW5nW10sIG9wdGlvbnM6IElPcHRpb25zKVxue1xuXHRjb25zdCBub3ZlbF9yb290ID0gb3B0aW9ucy5ub3ZlbF9yb290IHx8IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuXHRjb25zdCBzZWdtZW50ID0gb3B0aW9ucy5zZWdtZW50ID0gZ2V0U2VnbWVudChvcHRpb25zLnNlZ21lbnQpO1xuXG5cdG9wdGlvbnMucGF0aE1haW5fb3V0ID0gb3B0aW9ucy5wYXRoTWFpbl9vdXQgfHwgb3B0aW9ucy5wYXRoTWFpbjtcblxuXHRsZXQgQ1dEX0lOID0gX3BhdGgob3B0aW9ucy5wYXRoTWFpbiwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblx0bGV0IENXRF9PVVQgPSBfcGF0aChvcHRpb25zLnBhdGhNYWluX291dCwgb3B0aW9ucy5ub3ZlbElELCBub3ZlbF9yb290KTtcblxuXHRyZXR1cm4gUHJvbWlzZVxuXHRcdC5yZXNvbHZlKGxzKVxuXHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdHtcblx0XHRcdGlmIChscy5sZW5ndGggPT0gMClcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhDV0RfSU4pO1xuXG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlamVjdChFUlJPUl9NU0dfMDAxKTtcblx0XHRcdH1cblx0XHR9KVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHR7XG5cdFx0XHRsZXQgbGFiZWwgPSBgYWxsIGZpbGUgJHtscy5sZW5ndGh9YDtcblx0XHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cblx0XHRcdGNvbnNvbGUubG9nKGBhbGwgZmlsZSAke2xzLmxlbmd0aH1gKTtcblxuXHRcdFx0bGV0IGNvdW50X2NoYW5nZWQgPSAwO1xuXG5cdFx0XHRsZXQgZG9uZV9saXN0ID0gW10gYXMgc3RyaW5nW107XG5cblx0XHRcdGxldCBycyA9IGF3YWl0IFByb21pc2UubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAoZmlsZSwgaW5kZXgsIGxlbmd0aClcblx0XHRcdHtcblx0XHRcdFx0bGV0IGxhYmVsID0gZmlsZTtcblxuXHRcdFx0XHQvL2NvbnNvbGUudGltZShsYWJlbCk7XG5cbi8vXHRcdFx0XHRjb25zb2xlLmxvZygnW3N0YXJ0XScsIGxhYmVsKTtcblxuXHRcdFx0XHRsZXQgZmlsbHBhdGggPSBwYXRoLmpvaW4oQ1dEX0lOLCBmaWxlKTtcblx0XHRcdFx0bGV0IGZpbGxwYXRoX291dCA9IHBhdGguam9pbihDV0RfT1VULCBmaWxlKTtcblxuLy9cdFx0XHRcdGNvbnNvbGUubG9nKGZpbGxwYXRoKTtcbi8vXHRcdFx0XHRjb25zb2xlLmxvZyhmaWxscGF0aF9vdXQpO1xuXG5cdFx0XHRcdGlmICghZnMucGF0aEV4aXN0c1N5bmMoZmlsbHBhdGgpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0XHRpZiAob3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRhd2FpdCBvcHRpb25zLmNhbGxiYWNrKGRvbmVfbGlzdCwgZmlsZSwgaW5kZXgsIGxlbmd0aCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRjaGFuZ2VkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGV4aXN0czogZmFsc2UsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICghZmlsZS5tYXRjaCgvXFwudHh0JC9pKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRvbmVfbGlzdC5wdXNoKGZpbGUpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRjaGFuZ2VkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGV4aXN0czogdHJ1ZSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHRleHQgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxscGF0aClcblx0XHRcdFx0XHQudGhlbih2ID0+IGNybGYodi50b1N0cmluZygpKSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdGlmICghdGV4dC5yZXBsYWNlKC9cXHMrL2csICcnKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vY29uc29sZS53YXJuKCdbc2tpcF0nLCBsYWJlbCk7XG5cblx0XHRcdFx0XHRkb25lX2xpc3QucHVzaChmaWxlKTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmNhbGxiYWNrKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGF3YWl0IG9wdGlvbnMuY2FsbGJhY2soZG9uZV9saXN0LCBmaWxlLCBpbmRleCwgbGVuZ3RoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdGNoYW5nZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXhpc3RzOiB0cnVlLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgX25vdyA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0bGV0IGtzID0gYXdhaXQgc2VnbWVudC5kb1NlZ21lbnQodGV4dCk7XG5cblx0XHRcdFx0bGV0IHRpbWV1c2UgPSBEYXRlLm5vdygpIC0gX25vdztcblxuXHRcdFx0XHRsZXQgdGV4dF9uZXcgPSBhd2FpdCBzZWdtZW50LnN0cmluZ2lmeShrcyk7XG5cblx0XHRcdFx0bGV0IGNoYW5nZWQgPSB0ZXh0X25ldyAhPSB0ZXh0O1xuXG5cdFx0XHRcdGlmIChjaGFuZ2VkKVxuXHRcdFx0XHR7XG4vL1x0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1tjaGFuZ2VkXScsIGxhYmVsKTtcblxuXHRcdFx0XHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZmlsbHBhdGhfb3V0LCB0ZXh0X25ldyk7XG5cblx0XHRcdFx0XHRjb3VudF9jaGFuZ2VkKys7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY2hhbmdlZClcblx0XHRcdFx0e1xuXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW2RvbmVdJywgbGFiZWwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZG9uZV9saXN0LnB1c2goZmlsZSk7XG5cblx0XHRcdFx0aWYgKG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhd2FpdCBvcHRpb25zLmNhbGxiYWNrKGRvbmVfbGlzdCwgZmlsZSwgaW5kZXgsIGxlbmd0aCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRrcyA9IG51bGw7XG5cblx0XHRcdFx0dGV4dCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0dGV4dF9uZXcgPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdGNoYW5nZWQsXG5cdFx0XHRcdFx0ZXhpc3RzOiB0cnVlLFxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cblx0XHRcdGNvbnNvbGVbY291bnRfY2hhbmdlZCA/ICdvaycgOiAnZGVidWcnXShgZmlsZSBjaGFuZ2VkOiAke2NvdW50X2NoYW5nZWR9YCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGxzLFxuXHRcdFx0XHRkb25lX2xpc3QsXG5cdFx0XHRcdGNvdW50OiB7XG5cdFx0XHRcdFx0ZmlsZTogbHMubGVuZ3RoLFxuXHRcdFx0XHRcdGNoYW5nZWQ6IGNvdW50X2NoYW5nZWQsXG5cdFx0XHRcdFx0ZG9uZTogZG9uZV9saXN0Lmxlbmd0aCxcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9wYXRoKHBhdGhNYWluLCBub3ZlbElELCBub3ZlbF9yb290ID0gUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KTogc3RyaW5nXG57XG5cdGxldCBwOiBzdHJpbmc7XG5cblx0dHJ5XG5cdHtcblx0XHRwID0gcGF0aC5yZXNvbHZlKG5vdmVsX3Jvb3QsIHBhdGhNYWluLCBub3ZlbElEKVxuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0bm92ZWxfcm9vdCxcblx0XHRcdHBhdGhNYWluLFxuXHRcdFx0bm92ZWxJRCxcblx0XHR9KTtcblxuXHRcdHRocm93IGU7XG5cdH1cblxuXHRyZXR1cm4gcDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlZ21lbnQoc2VnbWVudD86IFNlZ21lbnQpXG57XG5cdGlmICghc2VnbWVudClcblx0e1xuXHRcdGlmICghX3NlZ21lbnRPYmplY3QpXG5cdFx0e1xuXHRcdFx0c2VnbWVudCA9IF9zZWdtZW50T2JqZWN0ID0gY3JlYXRlU2VnbWVudCgpO1xuXG5cdFx0XHRsZXQgZGJfZGljdCA9IGdldERpY3RNYWluKHNlZ21lbnQpO1xuXHRcdH1cblxuXHRcdHNlZ21lbnQgPSBfc2VnbWVudE9iamVjdDtcblx0fVxuXG5cdHJldHVybiBzZWdtZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTZWdtZW50Q2FjaGUoKVxue1xuXHRsZXQgY2FjaGVfZmlsZSA9IENBQ0hFX0ZJTEU7XG5cblx0aWYgKGZzLmV4aXN0c1N5bmMoY2FjaGVfZmlsZSkpXG5cdHtcblx0XHRjb25zb2xlLnJlZChgW1NlZ21lbnRdIHJlc2V0IGNhY2hlYCk7XG5cdFx0ZnMucmVtb3ZlU3luYyhjYWNoZV9maWxlKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VnbWVudCh1c2VDYWNoZTogYm9vbGVhbiA9IHRydWUpXG57XG5cdGNvbnN0IHNlZ21lbnQgPSBuZXcgU2VnbWVudCh7XG5cdFx0YXV0b0NqazogdHJ1ZSxcblxuXHRcdG9wdGlvbnNEb1NlZ21lbnQ6IHtcblxuXHRcdFx0Y29udmVydFN5bm9ueW06IHRydWUsXG5cblx0XHR9LFxuXHR9KTtcblxuXHRsZXQgY2FjaGVfZmlsZSA9IENBQ0hFX0ZJTEU7XG5cblx0bGV0IG9wdGlvbnMgPSB7XG5cdFx0LyoqXG5cdFx0ICog6ZaL5ZWfIGFsbF9tb2Qg5omN5pyD5Zyo6Ieq5YuV6LyJ5YWl5pmC5YyF5ZCrIFpodFN5bm9ueW1PcHRpbWl6ZXJcblx0XHQgKi9cblx0XHRhbGxfbW9kOiB0cnVlLFxuXHR9O1xuXG5cdGNvbnNvbGUudGltZShg6K6A5Y+W5qih57WE6IiH5a2X5YW4YCk7XG5cblx0LyoqXG5cdCAqIOS9v+eUqOe3qeWtmOeahOWtl+WFuOaqlOevhOS+i1xuXHQgKi9cblx0aWYgKHVzZUNhY2hlICYmIGZzLmV4aXN0c1N5bmMoY2FjaGVfZmlsZSkpXG5cdHtcblx0XHQvL2NvbnNvbGUubG9nKGDnmbznj74gY2FjaGUuZGJgKTtcblxuXHRcdGxldCBzdCA9IGZzLnN0YXRTeW5jKGNhY2hlX2ZpbGUpO1xuXG5cdFx0bGV0IG1kID0gKERhdGUubm93KCkgLSBzdC5tdGltZU1zKSAvIDEwMDA7XG5cblx0XHQvL2NvbnNvbGUubG9nKGDot53pm6LkuIrmrKHnt6nlrZjlt7LpgY4gJHttZH1zYCk7XG5cblx0XHRpZiAobWQgPCBDQUNIRV9USU1FT1VUKVxuXHRcdHtcblx0XHRcdC8vY29uc29sZS5sb2coc3QsIG1kKTtcblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhg6ZaL5aeL6LyJ5YWl57ep5a2Y5a2X5YW4YCk7XG5cblx0XHRcdGxldCBkYXRhID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY2FjaGVfZmlsZSkudG9TdHJpbmcoKSk7XG5cblx0XHRcdHVzZURlZmF1bHQoc2VnbWVudCwge1xuXHRcdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0XHRub2RpY3Q6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0c2VnbWVudC5ESUNUID0gZGF0YS5ESUNUO1xuXG5cdFx0XHRzZWdtZW50LmluaXRlZCA9IHRydWU7XG5cblx0XHRcdGNhY2hlX2ZpbGUgPSBudWxsO1xuXHRcdFx0ZGF0YSA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH1cblxuXHRpZiAoIXNlZ21lbnQuaW5pdGVkKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhg6YeN5paw6LyJ5YWl5YiG5p6Q5a2X5YW4YCk7XG5cdFx0c2VnbWVudC5hdXRvSW5pdChvcHRpb25zKTtcblxuXHRcdC8vIOewoei9iee5geWwiOeUqFxuXHRcdC8vc2VnbWVudC5sb2FkU3lub255bURpY3QoJ3podC5zeW5vbnltLnR4dCcpO1xuXHR9XG5cblx0bGV0IGRiX2RpY3QgPSBzZWdtZW50LmdldERpY3REYXRhYmFzZSgnVEFCTEUnLCB0cnVlKTtcblx0ZGJfZGljdC5UQUJMRSA9IHNlZ21lbnQuRElDVFsnVEFCTEUnXTtcblx0ZGJfZGljdC5UQUJMRTIgPSBzZWdtZW50LkRJQ1RbJ1RBQkxFMiddO1xuXG5cdGRiX2RpY3Qub3B0aW9ucy5hdXRvQ2prID0gdHJ1ZTtcblxuXHQvL2NvbnNvbGUubG9nKCfkuLvlrZflhbjnuL3mlbgnLCBkYl9kaWN0LnNpemUoKSk7XG5cblx0Y29uc29sZS50aW1lRW5kKGDoroDlj5bmqKHntYToiIflrZflhbhgKTtcblxuXHRpZiAodXNlQ2FjaGUgJiYgY2FjaGVfZmlsZSlcblx0e1xuXHRcdC8vY29uc29sZS5sb2coYOe3qeWtmOWtl+WFuOaWvCBjYWNoZS5kYmApO1xuXG5cdFx0ZnMub3V0cHV0RmlsZVN5bmMoY2FjaGVfZmlsZSwgSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0RElDVDogc2VnbWVudC5ESUNULFxuXHRcdH0pKTtcblx0fVxuXG5cdGZyZWVHQygpO1xuXG5cdHJldHVybiBzZWdtZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGljdE1haW4oc2VnbWVudDogU2VnbWVudClcbntcblx0cmV0dXJuIHNlZ21lbnQuZ2V0RGljdERhdGFiYXNlKCdUQUJMRScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcnVuU2VnbWVudCgpXG57XG5cdGxldCBfY2FjaGVfZmlsZV9zZWdtZW50ID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJy5zZWdtZW50Jyk7XG5cblx0bGV0IF9jYWNoZV9zZWdtZW50OiB7XG5cblx0XHRzX3Zlcj86IHN0cmluZyxcblx0XHRkX3Zlcj86IHN0cmluZyxcblxuXHRcdGxhc3Rfc192ZXI/OiBzdHJpbmcsXG5cdFx0bGFzdF9kX3Zlcj86IHN0cmluZyxcblxuXHRcdGxpc3Q6IHtcblx0XHRcdFtrOiBzdHJpbmddOiB7XG5cdFx0XHRcdFtrOiBzdHJpbmddOiB7XG5cdFx0XHRcdFx0c192ZXI/OiBzdHJpbmcsXG5cdFx0XHRcdFx0ZF92ZXI/OiBzdHJpbmcsXG5cblx0XHRcdFx0XHRsYXN0X3NfdmVyPzogc3RyaW5nLFxuXHRcdFx0XHRcdGxhc3RfZF92ZXI/OiBzdHJpbmcsXG5cdFx0XHRcdH0sXG5cdFx0XHR9XG5cdFx0fSxcblx0fTtcblxuXHRsZXQgX3NfdmVyOiBzdHJpbmcgPSBTdHJpbmcocmVxdWlyZShcIm5vdmVsLXNlZ21lbnRcIikudmVyc2lvbiB8fCAnMScpO1xuXHRsZXQgX2RfdmVyOiBzdHJpbmcgPSBTdHJpbmcocmVxdWlyZShcInNlZ21lbnQtZGljdFwiKS52ZXJzaW9uIHx8ICcxJyk7XG5cblx0aWYgKGZzLmV4aXN0c1N5bmMoX2NhY2hlX2ZpbGVfc2VnbWVudCkpXG5cdHtcblx0XHR0cnlcblx0XHR7XG5cdFx0XHRfY2FjaGVfc2VnbWVudCA9IGZzLnJlYWRKU09OU3luYyhfY2FjaGVfZmlsZV9zZWdtZW50KTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXHR9XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRfY2FjaGVfc2VnbWVudCA9IF9jYWNoZV9zZWdtZW50IHx8IHt9O1xuXHRfY2FjaGVfc2VnbWVudC5saXN0ID0gX2NhY2hlX3NlZ21lbnQubGlzdCB8fCB7fTtcblxuXHR7XG5cdFx0bGV0IHsgbGFzdF9zX3ZlciwgbGFzdF9kX3Zlciwgc192ZXIsIGRfdmVyIH0gPSBfY2FjaGVfc2VnbWVudDtcblx0XHRjb25zb2xlLmRlYnVnKHtcblx0XHRcdF9zX3Zlcixcblx0XHRcdF9kX3ZlcixcblxuXHRcdFx0c192ZXIsXG5cdFx0XHRkX3Zlcixcblx0XHR9KTtcblxuXHRcdGlmIChzX3ZlciAhPSBfc192ZXIgfHwgZF92ZXIgIT0gX2RfdmVyKVxuXHRcdHtcblx0XHRcdHJlc2V0U2VnbWVudENhY2hlKCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIFByb21pc2Vcblx0XHQubWFwU2VyaWVzKEZhc3RHbG9iKFtcblx0XHRcdCcqLyouanNvbicsXG5cdFx0XSwge1xuXHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnKSxcblx0XHR9KSwgYXN5bmMgZnVuY3Rpb24gKGlkOiBzdHJpbmcpXG5cdFx0e1xuXHRcdFx0bGV0IFtwYXRoTWFpbiwgbm92ZWxJRF0gPSBpZC5zcGxpdCgvW1xcXFxcXC9dLyk7XG5cblx0XHRcdG5vdmVsSUQgPSBwYXRoLmJhc2VuYW1lKG5vdmVsSUQsICcuanNvbicpO1xuXG5cdFx0XHRsZXQgbnAgPSBfcGF0aChwYXRoTWFpbiwgbm92ZWxJRCk7XG5cblx0XHRcdGlmICghZnMuZXhpc3RzU3luYyhucCkpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IocGF0aE1haW4sIG5vdmVsSUQpO1xuXG5cdFx0XHRcdGF3YWl0IGZzLnJlbW92ZShwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnLCBpZCkpO1xuXG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGJpbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJ2Jpbi9fZG9fc2VnbWVudC5qcycpO1xuXG5cdFx0XHRsZXQgX3J1bl9hbGw6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRcdFx0X2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXSA9IF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF0gfHwge307XG5cblx0XHRcdGxldCBfY3VycmVudF9kYXRhID0gX2NhY2hlX3NlZ21lbnQubGlzdFtub3ZlbElEXVtub3ZlbElEXSA9IF9jYWNoZV9zZWdtZW50Lmxpc3Rbbm92ZWxJRF1bbm92ZWxJRF0gfHwge307XG5cblx0XHRcdGlmIChfY3VycmVudF9kYXRhLmRfdmVyICE9IF9kX3ZlciB8fCBfY3VycmVudF9kYXRhLnNfdmVyICE9IF9zX3Zlcilcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5kZWJ1Zyh7XG5cdFx0XHRcdFx0cGF0aE1haW4sXG5cdFx0XHRcdFx0bm92ZWxJRCxcblx0XHRcdFx0XHRzX3ZlcjogX2N1cnJlbnRfZGF0YS5zX3Zlcixcblx0XHRcdFx0XHRkX3ZlcjogX2N1cnJlbnRfZGF0YS5kX3Zlcixcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X3J1bl9hbGwgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgY3AgPSBjcm9zc1NwYXduU3luYygnbm9kZScsIFtcblx0XHRcdFx0Jy0tbWF4LW9sZC1zcGFjZS1zaXplPTIwNDgnLFxuXHRcdFx0XHQvLyctLWV4cG9zZS1nYycsXG5cdFx0XHRcdGJpbixcblx0XHRcdFx0Jy0tcGF0aE1haW4nLFxuXHRcdFx0XHRwYXRoTWFpbixcblx0XHRcdFx0Jy0tbm92ZWxJRCcsXG5cdFx0XHRcdG5vdmVsSUQsXG5cdFx0XHRcdCctLXJ1bkFsbCcsXG5cdFx0XHRcdFN0cmluZyhfcnVuX2FsbCksXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogRElTVF9OT1ZFTCxcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoY3Auc3RhdHVzID4gMClcblx0XHRcdHtcblx0XHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0YFtTZWdtZW50XSAke3BhdGhNYWlufSAke25vdmVsSUR9YCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBESVNUX05PVkVMLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRKU09OKF9jYWNoZV9maWxlX3NlZ21lbnQsIF9jYWNoZV9zZWdtZW50LCB7XG5cdFx0XHRcdFx0c3BhY2VzOiBcIlxcdFwiLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0X2N1cnJlbnRfZGF0YS5sYXN0X3NfdmVyID0gX2N1cnJlbnRfZGF0YS5zX3Zlcjtcblx0XHRcdF9jdXJyZW50X2RhdGEubGFzdF9kX3ZlciA9IF9jdXJyZW50X2RhdGEuZF92ZXI7XG5cblx0XHRcdF9jdXJyZW50X2RhdGEuc192ZXIgPSBfc192ZXI7XG5cdFx0XHRfY3VycmVudF9kYXRhLmRfdmVyID0gX2RfdmVyO1xuXG5cdFx0XHRyZXR1cm4gY3Auc3RhdHVzO1xuXHRcdH0pXG5cdFx0LnRhcChhc3luYyBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxhc3Rfc192ZXIgPSBfY2FjaGVfc2VnbWVudC5zX3Zlcjtcblx0XHRcdF9jYWNoZV9zZWdtZW50Lmxhc3RfZF92ZXIgPSBfY2FjaGVfc2VnbWVudC5kX3ZlcjtcblxuXHRcdFx0X2NhY2hlX3NlZ21lbnQuc192ZXIgPSBfc192ZXI7XG5cdFx0XHRfY2FjaGVfc2VnbWVudC5kX3ZlciA9IF9kX3ZlcjtcblxuXHRcdFx0YXdhaXQgZnMub3V0cHV0SlNPTihfY2FjaGVfZmlsZV9zZWdtZW50LCBfY2FjaGVfc2VnbWVudCwge1xuXHRcdFx0XHRzcGFjZXM6IFwiXFx0XCIsXG5cdFx0XHR9KTtcblx0XHR9KVxuXHRcdDtcbn1cbiJdfQ==