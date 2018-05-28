/**
 * Created by user on 2018/5/15/015.
 */

import { IConfig, IListFileRow, IListMainRow, IListNovelRow } from '@node-novel/task';
import novelDiffFromLog, { ITemp } from '@node-novel/task';
import { crossSpawnAsync, crossSpawnOutput, crossSpawnSync } from './index';
import { cacheDiffNovelList, cacheFileList } from './lib/cache';
import { _path, doSegmentGlob, runSegment } from './script/segment';
import path = require('upath2');
import ProjectConfig from './project.config';
import { filterNotDelete } from '@node-novel/task/lib/index';
import * as fs from 'fs-extra';
import * as arrayUniq from 'array-uniq';
import * as FastGlob from 'fast-glob';
import * as Promise from 'bluebird';

let DIST_NOVEL = ProjectConfig.novel_root;

//console.log(`目前設定為 預設值 ${__filename}`);

export default {
	cwd: DIST_NOVEL,
	dist_novel: DIST_NOVEL,

//	nocache: true,

//	debug: {
//		no_push: true,
//	},

	task: {
		main(data: IListMainRow, name: string)
		{
//			console.log('MAIN', name);
			//console.log(data);
		},
		async novel(data: IListNovelRow, name: string)
		{
//			console.log('NOVEL', data.pathMain, data.novelID, data.length);

//			console.log(data);

			if (data.pathMain.indexOf('"') !== -1 || data.novelID.match(/^\d+$/))
			{
				console.error('[ERROR]', data);
			}
			else
			{
				await cacheFileList(data);
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
		async file(data: IListFileRow, file: string)
		{
			//console.log('FILE', data.subpath);
			//console.log(data);

//			console.log(data.subpath, data.status);

			//console.log(data, file);

//			if (data.basename.match(/\.txt$/))
//			{
//				await runSegment(data, data.subpath);
//			}

		},

		async before_end(data: ReturnType<typeof novelDiffFromLog>, ls_map: any[], temp?: ITemp)
		{
			await cacheDiffNovelList(data);

			await runSegment();
		}
	},
} as IConfig
