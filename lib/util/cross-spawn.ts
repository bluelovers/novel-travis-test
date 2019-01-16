/**
 * Created by user on 2019/1/16/016.
 */

import { crlf } from 'crlf-normalize';
import { async as crossSpawnAsync, sync as _crossSpawnSync } from 'cross-spawn-extra';
import { SpawnASyncReturns, SpawnASyncReturnsPromise, ISpawnASyncError, SpawnSyncReturns, SpawnOptions, SpawnSyncOptions, CrossSpawnExtra } from 'cross-spawn-extra/core';

export const stripAnsi = CrossSpawnExtra.stripAnsi;

export { crossSpawnAsync }

export function crossSpawnSync(...argv: Parameters<typeof _crossSpawnSync>)
{
	let cp = _crossSpawnSync(...argv);

	delete cp.then;
	// @ts-ignore
	delete cp.catch;

	return cp;
}

export { SpawnASyncReturns, SpawnASyncReturnsPromise, SpawnSyncReturns, SpawnOptions, SpawnSyncOptions, ISpawnASyncError }

export function getCrossSpawnError<T extends SpawnASyncReturns>(cp: T | any): ISpawnASyncError<T>
{
	return cp.error
		// @ts-ignore
		|| cp.errorCrossSpawn
	;
}

export function crossSpawnOutput(buf: SpawnSyncReturns["output"] | Buffer, options: {
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
