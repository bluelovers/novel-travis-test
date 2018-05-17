#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as yargs from 'yargs';
import { doSegmentGlob } from '../script/segment';
import ProjectConfig from '../project.config';
import path = require('upath2');

let { pathMain, novelID, novel_root } = yargs.argv;

if (pathMain && novelID)
{
	(async () =>
	{
		let dir = path.join(ProjectConfig.cache_root, 'files', pathMain);
		let jsonfile = path.join(dir, novelID + '.json');

		if (!fs.existsSync(jsonfile))
		{
			return 0;
		}

		let ls = await fs.readJSON(jsonfile) as string[];

		if (!Array.isArray(ls) || !ls.length)
		{
			return 0;
		}

		return doSegmentGlob({
			pathMain,
			novelID,
			novel_root,

			files: Array.isArray(ls) ? ls : null,

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
				if (ls.length == 0)
				{
					fs.removeSync(jsonfile);
				}

				return ret.count.changed;
			})
			;
	})()
		.then(function (n)
		{
			process.exit(n || 0)
		})
	;
}
