import path = require('upath2');
import * as crossSpawn from 'cross-spawn';
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot, SpawnOptions, SpawnSyncReturns } from '../index';
import { loadCacheConfig, loadMainConfig } from '@node-novel/task/lib/config';
import ProjectConfig from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, GITEE_TOKEN, DEBUG } from './init';

/**
 * Created by user on 2018/5/17/017.
 */

export function pushGit()
{
	let cp = crossSpawnSync('git', [
		'push',
		'--progress',
		'--force',
		`https://${GITEE_TOKEN ? GITEE_TOKEN : ''}gitee.com/demogitee/novel.git`,
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	if (cp.output)
	{
		let s = crossSpawnOutput(cp.output);

		if (s.indexOf('Everything up-to-date') != -1)
		{
			console.log(s);
		}
		else if (DEBUG)
		{
			console.log(s);
		}
	}

	return cp;
}

export function pullGit()
{
	return crossSpawn.sync('git', [
		'pull',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});
}

export function fetchGit()
{
	return crossSpawnSync('git', [
		'fetch',
		'origin',
		'master',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});
}

export function newBranch(BR_NAME: string)
{
	return crossSpawnSync('git', [
		'checkout',
		'-B',
		BR_NAME,
		'origin/master',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});
}
