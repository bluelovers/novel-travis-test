/**
 * Created by user on 2018/7/28/028.
 */

import { crossSpawnSync, crossSpawnAsync } from '../index';
import ProjectConfig from '../project.config';
// @ts-ignore
import { processToc } from '@node-novel/toc';

processToc(ProjectConfig.novel_root)
	.then(function (ls)
	{
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
