#!/usr/bin/env node

import processTocContents from '@node-novel/toc/toc_contents';
import * as fs from 'fs-extra';
import * as yargs from 'yargs';
import { doSegmentGlob, ERROR_MSG_001 } from '../script/segment';
import ProjectConfig from '../project.config';
import path = require('upath2');
import * as Promise from 'bluebird';
import envBool, { envVal } from 'env-bool';
import console from '../lib/log';
import { showMemoryUsage, freeGC } from '../lib/util';
import { getNovelStatCache } from '../lib/cache/novel-stat';

let { pathMain, novelID, novel_root, runAll } = yargs
	.option('pathMain', {
		type: 'string',
	})
	.option('novelID', {
		type: 'string',
	})
	.option('novel_root', {
		type: 'string',
	})
	.option('runAll', {

	})
	.argv
;

if (pathMain && novelID)
{
	Promise.resolve((async () =>
	{
		let dir = path.join(ProjectConfig.cache_root, 'files', pathMain);
		let jsonfile = path.join(dir, novelID + '.json');

		let jsonfile_done = jsonfile + '.done';

		await fs.remove(jsonfile_done).catch(e => null);

		if (!fs.existsSync(jsonfile))
		{
			return 0;
		}

		let ls = await fs.readJSON(jsonfile) as string[];

		runAll = envBool(runAll);

		if (!runAll && (!Array.isArray(ls) || !ls.length))
		{
			console.log(`[Segment:skip]`, pathMain, novelID, ls);

			await fs.remove(jsonfile);

			return 0;
		}

		if (runAll)
		{
			console.debug(`[Segment]`, pathMain, novelID, `runAll: ${runAll}`);
		}
		else
		{
			console.log(`[Segment]`, pathMain, novelID, `runAll: ${runAll}`);
		}

		if (!runAll)
		{
			console.grey(`list:`, ls);
		}

		let done_list_cache: string[] = [];

		return doSegmentGlob({
			pathMain,
			novelID,
			novel_root,

			files: (!runAll && Array.isArray(ls)) ? ls : null,

			callback(done_list, file, index, length)
			{
				if ((index % 10) == 0 || ((index + 1) >= length))
				{
					console.grey(`[${index}/${length}]`, file);

					ls = ls.filter(function (v)
					{
						let bool = done_list.indexOf(v) == -1;

						if (bool)
						{
							done_list_cache.push(v)
						}

						return bool
					});

//					console.log(ls.length);

					if (ls.length == 0)
					{
						fs.removeSync(jsonfile);
					}
					else
					{
						fs.writeJSONSync(jsonfile, ls, {
							spaces: '\t',
						});
					}

					showMemoryUsage();
				}

				freeGC();
			},
		})
			.then(async function (ret)
			{
				ls = ls.filter(function (v)
				{
					let bool = ret.done_list.indexOf(v) == -1;

					if (bool)
					{
						done_list_cache.push(v)
					}

					return bool
				});

				console.error(`ls: ${ls.length}`);

				if (ls.length == 0 || 1)
				{
					await fs.remove(jsonfile);
				}

				const novelStatCache = getNovelStatCache();
				let stat = novelStatCache.novel(pathMain, novelID);

				if (ret.count.changed > 0)
				{
					stat.segment_date = Date.now();

					stat.segment_old = stat.segment | 0;
					stat.segment = ret.count.changed;

					let today = novelStatCache.historyToday();

					today.segment.push([pathMain, novelID]);
				}

				novelStatCache.save();

				return ret.count.changed;
			})
			.tap(function ()
			{
				return fs
					.writeJSON(jsonfile_done, done_list_cache)
					.catch(e => console.error(e.message))
					;
			})
			.catch(async function (e)
			{
				if (e == ERROR_MSG_001)
				{
					console.warn(ERROR_MSG_001);

					await fs.remove(jsonfile);

					return 0;
				}

				return Promise.reject(e)
			})
			;
	})())
		.then(function (n)
		{
			process.exit(n || 0)
		})
	;
}
