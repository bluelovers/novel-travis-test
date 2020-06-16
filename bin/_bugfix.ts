import path = require('upath2');
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot } from '../index';
import { loadCacheConfig, loadMainConfig, loadConfig } from '@node-novel/task/lib/config';
import { IConfig } from '@node-novel/task';
import { getNovelStatCache } from '../lib/cache/novel-stat';
import ProjectConfig from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';

/**
 * Created by user on 2018/7/22/022.
 */

export const PROJECT_ROOT = ProjectConfig.project_root;

export let MyConfig = loadMainConfig(PROJECT_ROOT);
export let CacheConfig = loadCacheConfig(PROJECT_ROOT);

export let GITEE_TOKEN = process.env.GITEE_TOKEN || '';
export const DIST_NOVEL = ProjectConfig.novel_root;

console.time('bugfix');

let ls: string[] = FastGlob.sync([
	'docs/*.json',
], {
	cwd: path.join(ProjectConfig.cache_root, 'files'),
	absolute: true,
	onlyFiles: true,
});

if (ls.length)
{
	ls.forEach(function (file)
	{
		console.log('[delete]', file);
		fs.removeSync(file)
	})
}

{
	let now = moment();
	let now_unix = now.unix();

	const novelStatCache = getNovelStatCache();

	const timestamp = novelStatCache.timestamp;

	let _ok: boolean;

	Object.entries(novelStatCache.data.history)
		.forEach(function ([timestamp, stat])
		{
			let n_timestamp = parseInt(timestamp);

			if (now_unix >= n_timestamp)
			{
				let ms = moment.unix(n_timestamp).valueOf();

				delete novelStatCache.data.history[timestamp];
				novelStatCache.data.history[ms] = stat;

				_ok = true;
			}

		})
	;

	Object.entries(novelStatCache.data.novels)
		.forEach(([pathMain, data], i) =>
		{
			Object.entries(novelStatCache.data.novels[pathMain])
				.forEach(([novelID, data]) =>
				{
					let ks: (keyof typeof data)[] = [
						'init_date',
						'epub_date',
						'segment_date',
					];

					ks.forEach(k => {

						if (data[k] && now_unix >= data[k])
						{
							// @ts-ignore
							let ms = moment.unix(data[k]).valueOf();

							// @ts-ignore
							data[k] = ms;

							_ok = true;
						}

					});
				})
			;
		})
	;

	if (_ok)
	{
		novelStatCache.save();
	}
}

console.timeEnd('bugfix');
