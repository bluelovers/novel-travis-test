import path = require('upath2');
import * as crossSpawn from 'cross-spawn';
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot } from '../index';
import { loadCacheConfig, loadMainConfig, loadConfig } from '@node-novel/task/lib/config';
import { IConfig } from '@node-novel/task';
import ProjectConfig from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';
import console from '../lib/log';

/**
 * Created by user on 2018/5/17/017.
 */

export let DEBUG = false;

export const PROJECT_ROOT = ProjectConfig.project_root;

export let MyConfig = loadMainConfig(PROJECT_ROOT);
export let CacheConfig = loadCacheConfig(PROJECT_ROOT);

export let GITEE_TOKEN: string = process.env.GITEE_TOKEN || '';
export let GITLAB_TOKEN: string = process.env.GITLAB_TOKEN || '';

export const DIST_NOVEL = ProjectConfig.novel_root;

if (!GITEE_TOKEN || !GITLAB_TOKEN)
{
	let env = dotenvConfig({ path: path.join(PROJECT_ROOT, '.env') });

	if (!GITEE_TOKEN && env.parsed && env.parsed.GITEE_TOKEN)
	{
		GITEE_TOKEN = env.parsed.GITEE_TOKEN;
	}

	if (!GITLAB_TOKEN && env.parsed && env.parsed.GITLAB_TOKEN)
	{
		GITLAB_TOKEN = env.parsed.GITLAB_TOKEN;
	}
}

export let CLONE_DEPTH = process.env.CLONE_DEPTH || 50;

if (!/@$/.test(GITEE_TOKEN))
{
	GITEE_TOKEN += '@';
}

export let NOT_DONE: boolean;

if (CacheConfig && CacheConfig.config && CacheConfig.config.done == -1)
{
	NOT_DONE = true;

	console.warn(`上次的任務未完成 本次繼續執行 (1)`);
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
		console.warn(`上次的任務未完成 本次繼續執行 (2)`);

		console.log(ls);
	}
}

export const BR_NAME = 'auto/' + moment().format('YYYY-MM-DD-HH-mm-ss');

export const NO_PUSH = MyConfig && MyConfig.config.debug && MyConfig.config.debug.no_push;
