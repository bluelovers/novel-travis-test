/**
 * Created by user on 2018/5/16/016.
 */

import path = require('upath2');
import * as crossSpawn from 'cross-spawn';
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot } from '../index';
import { loadCacheConfig, loadMainConfig } from '@node-novel/task/lib/config';
import ProjectConfig from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, MyConfig, CacheConfig } from '../script/init';
import { diffOrigin, pushGit } from '../script/git';

let label: string;

{
	if (!isGitRoot(DIST_NOVEL))
	{
		console.warn(`dist_novel not a git: ${DIST_NOVEL}`);

		throw new Error(`something wrong when create git`);
	}

	console.log(`dist_novel: ${DIST_NOVEL}`);
}

if (NOT_DONE)
{
	label = `--- NOT_DONE ---`;

	console.log(label);
	console.time(label);

	let bin = path.join(PROJECT_ROOT, 'bin/_do_segment_all.js');

	crossSpawnSync('node', [
		bin,
	], {
		stdio: 'inherit',
		cwd: PROJECT_ROOT,
	});
}
else
{
	label = `--- TASK ---`;

	console.log(label);
	console.time(label);

	runTask();
}

console.timeEnd(label);

label = `--- PUSH ---`;

console.log(label);
console.time(label);

if (MyConfig.config.debug && MyConfig.config.debug.no_push)
{
	console.log(`[DEBUG] skip push`);
}
else
{
	if (diffOrigin())
	{
		fs.ensureFileSync(path.join(ProjectConfig.cache_root, '.waitpush'));

		pushGit();
	}
	else
	{
		console.log(`沒有任何變更 忽略 PUSH`);
	}

	fs.removeSync(path.join(ProjectConfig.cache_root, '.waitpush'));
}

console.timeEnd(label);

// ----------------

function runTask()
{
	let bin = path.join(path.dirname(require.resolve('@node-novel/task')), 'bin/_novel-task.js');

//	console.log(bin);

	crossSpawnSync('node', [
		bin,
	], {
		stdio: 'inherit',
		cwd: PROJECT_ROOT,
	});
}


