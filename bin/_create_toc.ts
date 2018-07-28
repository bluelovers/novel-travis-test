/**
 * Created by user on 2018/7/28/028.
 */

import { crossSpawnSync, crossSpawnAsync } from '../index';
import ProjectConfig from '../project.config';
// @ts-ignore
import { processToc, Promise } from '@node-novel/toc';
import path = require('path');

processToc(ProjectConfig.novel_root)
	.then(async function (ls)
	{
		await Promise.each(Object.keys(ls), function(pathMain)
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
