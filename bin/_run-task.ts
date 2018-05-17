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

const DEBUG = false;
let label: string;

const PROJECT_ROOT = path.resolve(__dirname, '..');

let MyConfig = loadMainConfig(PROJECT_ROOT);
let CacheConfig = loadCacheConfig(PROJECT_ROOT);

let GITEE_TOKEN = process.env.GITEE_TOKEN || '';
const DIST_NOVEL = path.resolve(PROJECT_ROOT, 'dist_novel');

if (!GITEE_TOKEN)
{
	let env = dotenvConfig({ path: path.join(PROJECT_ROOT, '.env') });

	if (env.parsed && env.parsed.GITEE_TOKEN)
	{
		GITEE_TOKEN = env.parsed.GITEE_TOKEN;
	}
}

if (!/@$/.test(GITEE_TOKEN))
{
	GITEE_TOKEN += '@';
}

let NOT_DONE: boolean;

if (CacheConfig && CacheConfig.config && CacheConfig.config.done == -1)
{
	NOT_DONE = true;

	console.log(`上次的任務未完成 本次繼續執行`);
}
else
{
	let ls = FastGlob.sync([
		'*/*.json',
	], {
		cwd: path.join(ProjectConfig.cache_root, 'files'),
	});

	if (ls.length)
	{
		NOT_DONE = true;
		console.log(`上次的任務未完成 本次繼續執行`);
	}
}

const BR_NAME = 'auto/' + moment().format('YYYY-MM-DD-HH-mm-ss');

if (NOT_DONE && fs.pathExistsSync(DIST_NOVEL) && isGitRoot(DIST_NOVEL))
{

	crossSpawnSync('git', [
		'commit',
		'-a',
		'-m',
		`[Segment] NOT_DONE`,
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	pushGit();

	crossSpawnSync('git', [
		'checkout',
		'-B',
		BR_NAME,
		'master',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});
}
else if (fs.pathExistsSync(DIST_NOVEL) && isGitRoot(DIST_NOVEL))
{
	console.warn(`dist_novel already exists`);

	label = `--- PULL ---`;
	console.log(label);
	console.time(label);

	crossSpawnSync('git', [
		'fetch',
		'--all',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	crossSpawnSync('git', [
		'reset',
		'--hard',
		'FETCH_HEAD',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	pullGit();

	crossSpawnSync('git', [
		'checkout',
		'-B',
		BR_NAME,
		'master',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	console.timeEnd(label);
}
else
{
	label = `--- CLONE ---`;
	console.log(label);
	console.time(label);

	//fs.emptyDirSync(DIST_NOVEL);

	crossSpawnSync('git', [
		'clone',
		'--depth=50',
		'--verbose',
		//'--progress ',
		'https://gitee.com/bluelovers/novel.git',
		'dist_novel',
	], {
		stdio: 'inherit',
		cwd: PROJECT_ROOT,
	});

	crossSpawnSync('git', [
		'checkout',
		'-B',
		BR_NAME,
		'master',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});

	console.timeEnd(label);
}

{
	if (!isGitRoot(DIST_NOVEL))
	{
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
else {
	pushGit();
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

function pullGit()
{
	return crossSpawn.sync('git', [
		'pull',
	], {
		stdio: 'inherit',
		cwd: DIST_NOVEL,
	});
}

function pushGit()
{
	let cp = crossSpawnSync('git', [
		'push',
		'--force',
		`https://${GITEE_TOKEN ? GITEE_TOKEN : ''}gitee.com/demogitee/novel.git`,
	], {
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
