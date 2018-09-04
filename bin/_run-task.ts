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
import ProjectConfig, { novel_root } from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';
import gitlog from 'gitlog2';
import console from '../lib/log';
import Promise = require('bluebird');

import {
	GIT_SETTING_DIST_NOVEL,
} from '../data/git';
import { createPullRequests } from '../script/gitee-pr';

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, MyConfig, CacheConfig } from '../script/init';
import { diffOrigin, getHashHEAD, getPushUrl, pushGit } from '../script/git';

let label: string;

{
	if (!isGitRoot(DIST_NOVEL))
	{
		console.warn(`dist_novel not a git: ${DIST_NOVEL}`);

		throw new Error(`something wrong when create git`);
	}

	console.info(`dist_novel: ${DIST_NOVEL}`);
}

let currentHEAD =  getHashHEAD(DIST_NOVEL);

if (NOT_DONE)
{
	label = `--- NOT_DONE ---`;

	console.warn(label);
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

	console.info(label);
	console.time(label);

	runTask();
}

console.timeEnd(label);


(async () => {
	label = `--- PUSH ---`;

	console.debug(label);
	console.time(label);

	if (MyConfig.config.debug && MyConfig.config.debug.no_push)
	{
		console.warn(`[DEBUG] skip push`);
	}
	else
	{
		let ok = true;

		let currentHEADNew = getHashHEAD(DIST_NOVEL);

		if (currentHEAD != currentHEADNew || diffOrigin(DIST_NOVEL))
		{
			fs.ensureFileSync(path.join(ProjectConfig.cache_root, '.waitpush'));

			let cp = pushGit(DIST_NOVEL, getPushUrl(GIT_SETTING_DIST_NOVEL.url), true);

			if (cp.error || cp.stderr && cp.stderr.toString())
			{
				ok = false;

				console.error(`發生錯誤`);
			}

			await Promise.delay(1000);

			createPullRequests();
		}
		else
		{
			console.error(`沒有任何變更 忽略 PUSH`);
		}

		if (ok)
		{
			fs.removeSync(path.join(ProjectConfig.cache_root, '.waitpush'));

			if (CacheConfig)
			{
				let config = fs.readJSONSync(CacheConfig.filepath);

				config.done = 1;

				config.last_push_head = currentHEADNew;

				config.last_task_datatime = Date.now();

				console.ok(`將 cache 檔案內的 執行狀態 改為已完成`);

				fs.writeJSONSync(CacheConfig.filepath, config, {
					spaces: 2,
				});

				console.dir(config);
			}
		}
	}

	console.timeEnd(label);
})();

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


