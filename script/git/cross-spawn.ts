/**
 * Created by user on 2019/1/16/016.
 */

import { crossSpawnSync, SpawnSyncReturns, SpawnSyncOptions, crossSpawnOutput } from '../..';
import console from '../../lib/log';
import { stripAnsi } from '../../lib/util/cross-spawn';

/**
 * use for some git cmd
 */
export function crossSpawnSyncGit(bin: string, args: string[], options?: SpawnSyncOptions)
{
	let print: boolean;

	if (options)
	{
		if (options.stdio == 'inherit')
		{
			print = true;
			delete options.stdio
		}
	}

	let cp = crossSpawnSync(bin, args, options);

	print && console.log(crossSpawnOutput(cp.output));

	if (cp.stderr && cp.stderr.length)
	{
		let s1 = String(cp.stderr);
		let s2 = stripAnsi(s1);

		if (/^fatal\:/m.test(s2))
		{
			let e = new Error(s1);

			cp.error = cp.error || e;
			// @ts-ignore
			cp.errorCrossSpawn = e;

			throw e
		}

		console.info(`cp.stderr`);

		console.warn(s1);
	}

	return cp;
}
