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

const DEBUG = false;
let label: string;

const PROJECT_ROOT = path.resolve(__dirname, '..');

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

if (GITEE_TOKEN)
{
	GITEE_TOKEN += '@';
}

if (fs.pathExistsSync(DIST_NOVEL) && isGitRoot(DIST_NOVEL))
{
	console.warn(`dist_novel already exists`);

	label = `--- PULL ---`;
	console.log(label);
	console.time(label);

//	crossSpawnSync('git', [
//		'fetch',
//		'--all',
//	], {
//		stdio: 'inherit',
//		cwd: DIST_NOVEL,
//	});

	pullGit();

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
		'--progress ',
		'https://gitee.com/bluelovers/novel.git',
		'dist_novel',
	], {
		stdio: 'inherit',
		cwd: PROJECT_ROOT,
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

label = `--- TASK ---`;

console.log(label);
console.time(label);

runTask();

console.timeEnd(label);

label = `--- PUSH ---`;

console.log(label);
console.time(label);

pushGit();

console.timeEnd(label);

// ----------------

function runTask()
{
	let bin = path.join(path.dirname(require.resolve('@node-novel/task')), 'bin/_novel-task.js');

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
