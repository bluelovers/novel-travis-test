"use strict";
/**
 * Created by user on 2018/5/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("./lib/cache");
const segment_1 = require("./script/segment");
const project_config_1 = require("./project.config");
let DIST_NOVEL = project_config_1.default.novel_root;
//console.log(`目前設定為 預設值 ${__filename}`);
exports.default = {
    cwd: DIST_NOVEL,
    dist_novel: DIST_NOVEL,
    disableInit: true,
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
            if (data.pathMain.indexOf('"') !== -1 || data.novelID.match(/^\d+$/)) {
                console.error('[ERROR]', data);
            }
            else {
                await cache_1.cacheFileList(data);
            }
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
        async before_end(data, ls_map, temp) {
            await cache_1.cacheDiffNovelList(data);
            await segment_1.runSegment();
        }
    },
};
