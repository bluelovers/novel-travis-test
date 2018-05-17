/**
 * Created by user on 2018/5/16/016.
 */

import NodeNovelTask from '@node-novel/task';
//import * as child_process from 'child_process';
import { SpawnOptions, SpawnSyncReturns } from 'child_process';
import * as crossSpawn from 'cross-spawn';

import { config as dotenvConfig } from 'dotenv';
import path = require('upath2');
// @ts-ignore
import gitRoot, { isGitRoot } from 'git-root2';
import { crlf, LF } from 'crlf-normalize';
import ProjectConfig from './project.config';

export { isGitRoot }

export { SpawnOptions, SpawnSyncReturns }

export let DIST_NOVEL = ProjectConfig.novel_root;

export function crossSpawnAsync(bin: string, argv?: string[], optiobs?: SpawnOptions): Promise<ReturnType<typeof crossSpawn.sync> & {
	errorCrossSpawn?: Error,
}>
{
	return new Promise(function (resolve, reject)
	{
		try
		{
			let cp = crossSpawn.sync(bin, argv, optiobs);

			resolve(cp);
		}
		catch (e)
		{
			reject({
				errorCrossSpawn: e,
			});
		}
	})
		.catch(function (ret)
		{
			return ret;
		})
	;
}

export function crossSpawnSync(bin: string, argv?: string[], optiobs?: SpawnOptions): ReturnType<typeof crossSpawn.sync> & {
	errorCrossSpawn?: Error,
}
{
	try
	{
		let cp = crossSpawn.sync(bin, argv, optiobs);

		return cp;
	}
	catch (e)
	{
		// @ts-ignore
		return {
			errorCrossSpawn: e as Error
		}
	}
}

export function crossSpawnOutput(buf: ReturnType<typeof crossSpawn.sync>["output"] | Buffer, options: {
	clearEol?: boolean,
} = {
	clearEol: true,
}): string
{
	let output = '';

	if (Array.isArray(buf))
	{
		output = buf
			.filter(function (b)
		{
			return !(!b || !b.length)
		})
			.map(function (b)
			{
				return b.toString();
			})
			.join("\n")
	}
	else
	{
		output = (buf || '').toString();
	}

	output = crlf(output);

	if (options.clearEol)
	{
		output = output.replace(/\n+$/g, '');
	}

	return output;
}
