/**
 * Created by user on 2018/9/3/003.
 */

import * as FastGlob from 'fast-glob';
import * as fs from 'fs-extra';
import * as yargs from 'yargs';
import path = require('upath2');
import * as Promise from 'bluebird';
import envBool, { envVal } from 'env-bool';
import ProjectConfig from '../project.config';
import console from '../lib/log';

let argv = yargs.argv;

enum MODE
{
	LAST_NOT_DONE = 'LAST_NOT_DONE',
}

(async () => {

	console.debug('argv=', argv);

	if (argv.mode == MODE.LAST_NOT_DONE)
	{
		console.info(`檢查並刪除 .cache/files 底下的 */*.json`);

		let ls = await FastGlob<string>([
			'*/*.json',
		], {
			cwd: path.join(ProjectConfig.cache_root, 'files'),
			absolute: true,
		});

		Promise.each(ls, async function (file)
		{
			console.log(`try delete ${file}`);

			return fs.remove(file)
		});
	}
	else
	{
		console.error(`參數錯誤 沒有執行任何 腳本`)
	}

})();
