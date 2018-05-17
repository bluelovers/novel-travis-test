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

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME } from '../script/init';
import { pushGit, pullGit } from '../script/git';

let label: string;

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

	let waitpush = path.join(ProjectConfig.cache_root, '.waitpush');

	if (fs.existsSync(waitpush))
	{
		pushGit();

		fs.removeSync(waitpush);
	}

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
		//'--verbose',
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
