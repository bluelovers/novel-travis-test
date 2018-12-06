/**
 * Created by user on 2018/7/28/028.
 */

// @ts-ignore
import { processToc, Promise } from '@node-novel/toc';
import { crossSpawnAsync } from '../index';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import ProjectConfig from '../project.config';
import path = require('path');

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && processToc(ProjectConfig.novel_root)
	.then(async function (ls)
	{
		await Promise.each(Object.keys(ls), function (pathMain)
		{
			let file = path.join(ProjectConfig.novel_root, pathMain, 'README.md');

			return crossSpawnAsync('git', [
				'add',
				'--verbose',
				file,
			], {
				stdio: 'inherit',
				cwd: ProjectConfig.novel_root,
			});
		});

		return crossSpawnAsync('git', [
			'commit',
			'-a',
			'-m',
			`[TOC] auto update toc`,
		], {
			stdio: 'inherit',
			cwd: ProjectConfig.novel_root,
		});
	})
;
