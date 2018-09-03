/**
 * Created by user on 2018/5/19/019.
 */

import * as fs from 'fs-extra';
import * as yargs from 'yargs';

import ProjectConfig from '../project.config';
import path = require('upath2');
import console from '../lib/log';

if (yargs.argv.last)
{
	let cache_json = path.join(ProjectConfig.cache_root, '.cache.json');

	if (fs.existsSync(cache_json))
	{
		let data = fs.readJSONSync(cache_json);

		data.last = yargs.argv.last;

		fs.outputJSONSync(cache_json, data, {
			spaces: '\t',
		});

		console.debug(`update .cache.json { last: ${yargs.argv.last} }`);
	}
}
