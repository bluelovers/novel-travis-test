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

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, CLONE_DEPTH, GITEE_TOKEN } from '../script/init';

import {
	pushGit,
	pullGit,
	fetchGit,
	newBranch,
	currentBranchName,
	oldBranch,
	deleteBranch,
	getHashHEAD, createGit, IOptionsCreateGit
} from '../script/git';

export const GIT_SETTING_DIST_NOVEL: IOptionsCreateGit = {
	url: 'gitee.com/demogitee/novel.git',
	urlClone: 'https://gitee.com/bluelovers/novel.git',
	targetPath: DIST_NOVEL,
	NOT_DONE,

	newBranchName: BR_NAME,

	on: {
		create_before(data, temp)
		{
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

				pushGit(data.targetPath, data.pushUrl);
			}
			else if (data.exists)
			{
				let waitpush = path.join(ProjectConfig.cache_root, '.waitpush');

				if (fs.existsSync(waitpush) || 0 && getHashHEAD(data.targetPath) != getHashHEAD('origin/master'))
				{
					pushGit(data.targetPath, data.pushUrl);
					fs.removeSync(waitpush);
				}
			}
		},

		create(data, temp)
		{

		},

		create_after(data, temp)
		{
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
		},
	}
};
