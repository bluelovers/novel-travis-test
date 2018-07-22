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

/**
 * Created by user on 2018/7/22/022.
 */

export const PROJECT_ROOT = ProjectConfig.project_root;

export let MyConfig = loadMainConfig(PROJECT_ROOT);
export let CacheConfig = loadCacheConfig(PROJECT_ROOT);

export let GITEE_TOKEN = process.env.GITEE_TOKEN || '';
export const DIST_NOVEL = ProjectConfig.novel_root;

console.time('bugfix');

let ls: string[] = FastGlob.sync([
	'docs/*.json',
], {
	cwd: path.join(ProjectConfig.cache_root, 'files'),
	absolute: true,
	onlyFiles: true,
});

if (ls.length)
{
	ls.forEach(function (file)
	{
		console.log('[delete]', file);
		fs.removeSync(file)
	})
}

console.timeEnd('bugfix');
