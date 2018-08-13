#!/usr/bin/env node

import processTocContents from '@node-novel/toc/toc_contents';
import * as fs from 'fs-extra';
import * as yargs from 'yargs';
import { doSegmentGlob, ERROR_MSG_001 } from '../script/segment';
import ProjectConfig from '../project.config';
import path = require('upath2');
import * as Promise from 'bluebird';
import envBool, { envVal } from 'env-bool';

let { pathMain, novelID, novel_root, runAll } = yargs.argv;

if (pathMain && novelID)
{
	Promise.resolve((async () =>
	{
		let dir = path.join(ProjectConfig.cache_root, 'files', pathMain);
		let jsonfile = path.join(dir, novelID + '.json');

		if (!fs.existsSync(jsonfile))
		{
			return 0;
		}

		let ls = await fs.readJSON(jsonfile) as string[];

		runAll = envBool(runAll);

		if (!runAll && (!Array.isArray(ls) || !ls.length))
		{
			console.log(`[Segment:skip]`, pathMain, novelID, ls);

			fs.removeSync(jsonfile);

			return 0;
		}
		console.log(`[Segment]`, pathMain, novelID, `runAll: ${runAll}`);
		console.log(`list:`, ls);

		return doSegmentGlob({
			pathMain,
			novelID,
			novel_root,

			files: (!runAll && Array.isArray(ls)) ? ls : null,

			callback(done_list, file, index, length)
			{
				if ((index % 10) == 0 || ((index + 1) >= length))
				{
					console.log(`[${index}/${length}]`, file);

					ls = ls.filter(function (v)
					{
						return done_list.indexOf(v) == -1
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
				}
			},
		})
			.then(async function (ret)
			{
				ls = ls.filter(function (v)
				{
					return ret.done_list.indexOf(v) == -1
				});

				console.error(`ls: ${ls.length}`);

				if (ls.length == 0 || 1)
				{
					fs.removeSync(jsonfile);
				}

				return ret.count.changed;
			})
			.catch(function (e)
			{
				if (e == ERROR_MSG_001)
				{
					console.warn(ERROR_MSG_001);

					fs.removeSync(jsonfile);

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
