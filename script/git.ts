import path = require('upath2');
import * as crossSpawn from 'cross-spawn';
import { gitDiffFrom, IGitDiffFrom, IGitDiffFromRow } from 'git-diff-from';
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import gitlog from 'gitlog2';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot, SpawnOptions, SpawnSyncReturns } from '../index';
import { loadCacheConfig, loadMainConfig } from '@node-novel/task/lib/config';
import ProjectConfig, { novel_root } from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, GITEE_TOKEN, DEBUG } from './init';

/**
 * Created by user on 2018/5/17/017.
 */

export function pushGit(REPO_PATH: string, repo: string)
{
	let cp = crossSpawnSync('git', [
		'push',
		'--progress',
		'--force',
		repo,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});

	return cp;
}

export function pullGit(REPO_PATH: string)
{
	return crossSpawn.sync('git', [
		'pull',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function fetchGit(REPO_PATH: string)
{
	return crossSpawnSync('git', [
		'fetch',
		'origin',
		'master',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function newBranch(REPO_PATH: string, BR_NAME: string)
{
	return crossSpawnSync('git', [
		'checkout',
		'-B',
		BR_NAME,
		'origin/master',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function currentBranchName(REPO_PATH: string)
{
	let cp = crossSpawnSync('git', [
		'rev-parse',
		'--abbrev-ref',
		'HEAD',
	], {
		cwd: REPO_PATH,
	});

	let name = crossSpawnOutput(cp.stdout);

	return name;
}

export function deleteBranch(REPO_PATH: string, name: string, force?: boolean)
{
	return crossSpawnSync('git', [
		'branch',
		force ? '-D' : '-d',
		name,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function oldBranch(REPO_PATH: string)
{
	let name = currentBranchName(REPO_PATH);

	if (name.indexOf('auto/') == 0)
	{
		return name;
	}

	return null;
}

export function diffOrigin(REPO_PATH: string)
{
	let log = gitlog({
		repo: REPO_PATH,
		branch: [currentBranchName(REPO_PATH), 'origin/master'].join('..'),
		number: 3,
	});

	console.log(log, log.length);

	return log.length;
}

export function getHashHEAD(REPO_PATH: string, branch: string = 'HEAD')
{
	return gitlog({ repo: REPO_PATH, number: 1, branch })[0].abbrevHash;
}

export type IOptionsCreateGit = {
	url: string,
	targetPath: string,

	newBranchName: string,

	urlClone: string,

	NOT_DONE,

	on?: {
		create_before?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]),
		create?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]),
		create_after?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]),
	},
};

export function createGit(options: IOptionsCreateGit)
{
	let targetName = path.basename(options.targetPath);
	let targetPath = path.normalize(options.targetPath);

	let REPO_PATH = targetPath;

	let exists = fs.pathExistsSync(REPO_PATH) && isGitRoot(REPO_PATH);

	let data = {
		targetName,
		targetPath,

		newBranchName: options.newBranchName,

		exists,
		existsBranchName: exists && oldBranch(REPO_PATH) || null,

		NOT_DONE,

		url: options.url,
		urlClone: options.urlClone,

		pushUrl: `https://${GITEE_TOKEN ? GITEE_TOKEN : ''}${options.url}`,
	};

	let temp: {
		cp: ReturnType<typeof crossSpawnSync>,

		[k: string]: any,
	} = {
		cp: null,
	};

	let label: string;

	console.log(`create git: ${targetName}`);

	if (options.on && options.on.create_before)
	{
		label = `--- CREATE_BEFORE ---`;
		console.log(label);
		console.time(label);
		options.on.create_before(data, temp);
		console.timeEnd(label);
	}

	label = `--- CREATE ---`;
	console.log(label);
	console.time(label);

	temp.cp = null;

	if (data.NOT_DONE && data.exists)
	{
		console.warn(`${targetName} already exists`);

		temp.cp = fetchGit(data.targetPath);
	}
	else if (data.exists)
	{
		console.warn(`${targetName} already exists`);

		temp.cp = fetchGit(data.targetPath);
	}
	else
	{
		temp.cp = crossSpawnSync('git', [
			'clone',
			//`--depth=${CLONE_DEPTH}`,
			//'--verbose',
			//'--progress ',
			data.urlClone,
			data.targetPath,
		], {
			stdio: 'inherit',
			cwd: PROJECT_ROOT,
		});
	}

	if (options.on && options.on.create)
	{
		options.on.create(data, temp);
	}

	console.timeEnd(label);

	if (options.on && options.on.create_after)
	{
		label = `--- CREATE_AFTER ---`;
		console.log(label);
		console.time(label);
		options.on.create_before(data, temp);
		console.timeEnd(label);
	}

	return { data, temp }
}
