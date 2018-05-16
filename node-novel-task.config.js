"use strict";
/**
 * Created by user on 2018/5/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const cache_1 = require("./lib/cache");
const path = require("upath2");
const project_config_1 = require("./project.config");
const FastGlob = require("fast-glob");
const Promise = require("bluebird");
let DIST_NOVEL = path.join(__dirname, 'dist_novel');
console.log(`目前設定為 預設值 ${__filename}`);
exports.default = {
    cwd: DIST_NOVEL,
    dist_novel: DIST_NOVEL,
    //	nocache: true,
    //	debug: {
    //		no_push: true,
    //	},
    task: {
        main(data, name) {
            //			console.log('MAIN', name);
            //console.log(data);
        },
        async novel(data, name) {
            //			console.log('NOVEL', data.pathMain, data.novelID, data.length);
            //			console.log(data);
            await cache_1.cacheFileList(data);
            //			await runSegment(data);
            /*
            if (1 || 1 && data.pathMain == 'cm')
            {
                await doSegmentGlob({
                    pathMain: data.pathMain,
                    novelID: data.novelID,
                    novel_root: DIST_NOVEL,
                })
                    .catch(function (err)
                    {
                        console.error(err.toString());
                    })
                    .then(async function (ret)
                    {
                        if (ret && ret.count && ret.count.changed)
                        {
                            await crossSpawnAsync('git', [
                                'commit',
                                '-a',
                                '-m',
                                `[Segment] ${data.pathMain} ${data.novelID}`,
                            ], {
                                stdio: 'inherit',
                                cwd: DIST_NOVEL,
                            })
                                .then(function (r)
                                {
                                    return r;
                                })
                            ;
                        }

                        return ret;
                    })
                ;
            }
            */
        },
        async file(data, file) {
            //console.log('FILE', data.subpath);
            //console.log(data);
            //			console.log(data.subpath, data.status);
            //console.log(data, file);
            //			if (data.basename.match(/\.txt$/))
            //			{
            //				await runSegment(data, data.subpath);
            //			}
        },
        async before_end() {
            await Promise
                .mapSeries(FastGlob([
                '*/*.json',
            ], {
                cwd: path.join(project_config_1.default.cache_root, 'files'),
            }), function (id) {
                let [pathMain, novelID] = id.split(/[\\\/]/);
                novelID = path.basename(novelID, '.json');
                let bin = path.join(project_config_1.default.project_root, 'bin/_do_segment.js');
                let cp = index_1.crossSpawnSync('node', [
                    bin,
                    '--pathMain',
                    pathMain,
                    '--novelID',
                    novelID,
                ], {
                    stdio: 'inherit',
                    cwd: DIST_NOVEL,
                });
                if (cp.status > 0) {
                    index_1.crossSpawnSync('git', [
                        'commit',
                        '-a',
                        '-m',
                        `[Segment] ${pathMain} ${novelID}`,
                    ], {
                        stdio: 'inherit',
                        cwd: DIST_NOVEL,
                    });
                }
            });
        }
    },
};
async function runSegment(data, file) {
    let bin = path.join(project_config_1.default.project_root, 'bin/_do_segment.js');
    let argv = [
        bin,
        '--pathMain',
        data.pathMain,
        '--novelID',
        data.novelID,
    ];
    let files;
    if (file) {
        files = [file];
    }
    //	if (0 && data.length)
    //	{
    //		files = [];
    //
    //		data.forEach(function (row)
    //		{
    //			files.push(row.subpath)
    //		})
    //	}
    if (files) {
        files.forEach(function (v) {
            argv.push('--file', v);
        });
    }
    let cp = await index_1.crossSpawnAsync('node', argv, {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });
    if (cp.status > 0 && !cp.error) {
        await index_1.crossSpawnAsync('git', [
            'commit',
            '-a',
            '-m',
            `[Segment] ${data.pathMain} ${data.novelID}`,
        ], {
            stdio: 'inherit',
            cwd: DIST_NOVEL,
        })
            .then(function (r) {
            return r;
        });
    }
    return cp.status;
}
