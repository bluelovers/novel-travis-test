/**
 * Created by user on 2018/5/15/015.
 */

import { IConfig, IListFileRow, IListMainRow, IListNovelRow } from '@node-novel/task';
import { crossSpawnAsync, crossSpawnOutput, crossSpawnSync } from './index';
import { cacheFileList } from './lib/cache';
import { doSegmentGlob } from './script/segment';
import path = require('upath2');
import ProjectConfig from './project.config';
import { filterNotDelete } from '@node-novel/task/lib/index';
import * as fs from 'fs-extra';
import * as arrayUniq from 'array-uniq';
import * as FastGlob from 'fast-glob';
import * as Promise from 'bluebird';

let DIST_NOVEL = path.join(__dirname, 'dist_novel');

console.log(`目前設定為 預設值 ${__filename}`);

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

			await cacheFileList(data);

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

		async before_end()
		{
			await Promise
				.mapSeries(FastGlob([
					'*/*.json',
				], {
					cwd: path.join(ProjectConfig.cache_root, 'files'),
				}), function (id: string)
				{
					let [pathMain, novelID] = id.split(/[\\\/]/);

					novelID = path.basename(novelID, '.json');

					let bin = path.join(ProjectConfig.project_root, 'bin/_do_segment.js');

					let cp = crossSpawnSync('node', [
						bin,
						'--pathMain',
						pathMain,
						'--novelID',
						novelID,
					], {
						stdio: 'inherit',
						cwd: DIST_NOVEL,
					});

					if (cp.status > 0)
					{
						crossSpawnSync('git', [
							'commit',
							'-a',
							'-m',
							`[Segment] ${pathMain} ${novelID}`,
						], {
							stdio: 'inherit',
							cwd: DIST_NOVEL,
						});
					}
				})
			;
		}
	},
} as IConfig

async function runSegment(data: IListNovelRow | IListFileRow, file?: string)
{
	let bin = path.join(ProjectConfig.project_root, 'bin/_do_segment.js');

	let argv = [
		bin,

		'--pathMain',
		data.pathMain,
		'--novelID',
		data.novelID,
	];

	let files: string[];

	if (file)
	{
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

	if (files)
	{
		files.forEach(function (v)
		{
			argv.push('--file', v);
		});
	}

	let cp = await crossSpawnAsync('node', argv, {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	if (cp.status > 0 && !cp.error)
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

	return cp.status;
}

