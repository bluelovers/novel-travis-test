"use strict";
/**
 * Created by user on 2018/5/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const path = require("upath2");
const project_config_1 = require("./project.config");
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
            //			console.log(data);
            await runSegment(data);
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
            //console.log(data, file);
            //			if (data.basename.match(/\.txt$/))
            //			{
            //				await runSegment(data, data.subpath);
            //			}
        },
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
