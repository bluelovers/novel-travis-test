/**
 * Created by user on 2018/12/11/011.
 */

import * as fs from 'fs-extra';
import ProjectConfig from '../../project.config';
import path = require('upath2');
import console from '../../lib/log';
import * as yargs from 'yargs';

enum EnumCacheName
{
	'toc_contents' = '.toc_contents.cache'
}

let { target } = yargs
	.option('target', {
		alias: ['t'],
		type: 'string',
		demandOption: true,
	})
	.usage('npm run reset-init-cahche -- -t toc_contents')
	.showHelpOnFail(true)
	.strict()
	.argv
;

let file_name = EnumCacheName[target as any];

if (!target || !file_name)
{
	yargs.showHelp();

	throw new TypeError(`target (${target}) not exists`)
}

let cache_file = path.join(ProjectConfig.cache_root, file_name);

fs.pathExists(cache_file)
	.then(async function (bool)
	{
		console.debug('[exists]', bool, cache_file);

		if (bool)
		{
			await fs.remove(cache_file);

			console.debug('[delete]', cache_file);
		}
	})
;
