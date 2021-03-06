import path = require('upath2');
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot } from '../index';
import { loadCacheConfig, loadMainConfig } from '@node-novel/task/lib/config';
import ProjectConfig from '../project.config';
import moment = require('moment');
import * as FastGlob from '@bluelovers/fast-glob';
import gitlog from 'gitlog2';

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, CLONE_DEPTH, GITEE_TOKEN, GITLAB_TOKEN } from '../script/init';

import { GIT_TOKEN } from '../script/git/token';

import {
	pushGit,
	pullGit,
	fetchGit,
	newBranch,
	currentBranchName,
	oldBranch,
	deleteBranch,
	getHashHEAD, createGit, IOptionsCreateGit, getPushUrl, gitCleanAll,
} from '../script/git';

export const GIT_SETTING_DIST_NOVEL: IOptionsCreateGit = {

	//url: 'gitee.com/demogitee/novel.git',
	//urlClone: 'https://gitee.com/bluelovers/novel.git',

	url: 'gitlab.com/demonovel/txt-source.git',
	//urlClone: 'https://gitlab.com/novel-group/txt-source.git',
	//urlClone: 'https://gitlab.com/novel-group-hidden/txt-source.git',

	urlClone: getPushUrl('gitlab.com/novel-group-hidden/txt-source.git', GIT_TOKEN),

	targetPath: DIST_NOVEL,
	NOT_DONE,

	newBranchName: BR_NAME,

	//LOGIN_TOKEN: GITEE_TOKEN,
	//LOGIN_TOKEN: GITLAB_TOKEN,
	LOGIN_TOKEN: GIT_TOKEN,

	on: {
		create_before(data, temp)
		{
			/*
			crossSpawnSync('git', [
				'remote',
				'add',
				'origin',
				data.urlClone,
			], {
				stdio: 'inherit',
				cwd: data.targetPath,
			});

			crossSpawnSync('git', [
				'remote',
				'add',
				'gitee',
				data.pushUrl,
			], {
				stdio: 'inherit',
				cwd: data.targetPath,
			});
			*/

			if (data.NOT_DONE && data.exists)
			{
				crossSpawnSync('git', [
					'commit',
					'-a',
					'-m',
					`[Segment] NOT_DONE`,
				], {
					stdio: 'inherit',
					cwd: data.targetPath,
				});

				pushGit(data.targetPath, data.pushUrl, true);
			}
			else if (data.exists)
			{
				let waitpush = path.join(ProjectConfig.cache_root, '.waitpush');

				if (fs.existsSync(waitpush) || 0 && getHashHEAD(data.targetPath) != getHashHEAD('origin/master'))
				{
					pushGit(data.targetPath, data.pushUrl, true);
					fs.removeSync(waitpush);
				}
			}
		},

		create(data, temp)
		{

		},

		create_after(data, temp)
		{
			console.log(`new branch: ${data.newBranchName}`);
			newBranch(data.targetPath, data.newBranchName);

			if (data.exists)
			{
				if (data.existsBranchName)
				{
					deleteBranch(data.targetPath, data.existsBranchName, true);
				}
			}
			else
			{
				// do something
			}

			gitCleanAll(data.targetPath);

			let log = gitlog({
				repo: data.targetPath,
				number: 5,
				nameStatus: false,
			});

			console.log(log);
		},
	}
};

export const GIT_SETTING_EPUB: IOptionsCreateGit = {

	//url: 'gitee.com/demogitee/epub-txt.git',
	//urlClone: 'https://gitee.com/demogitee/epub-txt.git',

	url: 'gitlab.com/demonovel/epub-txt.git',
//	urlClone: 'https://gitlab.com/demonovel/epub-txt.git',

	targetPath: path.join(ProjectConfig.project_root, 'dist_epub'),
	NOT_DONE,

	newBranchName: BR_NAME,

	CLONE_DEPTH: 10,

	LOGIN_TOKEN: GITLAB_TOKEN,

	on: {
		create_before(data, temp)
		{
			if (data.exists)
			{
				crossSpawnSync('git', [
					'commit',
					'-a',
					'-m',
					`[epub] NOT_DONE`,
				], {
					stdio: 'inherit',
					cwd: data.targetPath,
				});

				pushGit(data.targetPath, data.pushUrl);
			}
		},

		create(data, temp)
		{
			crossSpawnSync('git', [
				'checkout',
				'-f',
				'-B',
				`master`,
				`origin/master`,
			], {
				stdio: 'inherit',
				cwd: data.targetPath,
			});
		},

		create_after(data, temp)
		{
			gitCleanAll(data.targetPath);
		},
	}
};
