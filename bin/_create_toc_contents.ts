/**
 * Created by user on 2018/8/14/014.
 */

import processTocContents from '@node-novel/toc/toc_contents';
import * as Promise from 'bluebird';
import { GIT_SETTING_DIST_NOVEL, GIT_SETTING_EPUB } from '../data/git';
import ProjectConfig from '../project.config';
import { getPushUrl, pushGit } from '../script/git';
import { createPullRequests } from '../script/gitee-pr';
import { DIST_NOVEL } from '../script/init';
import { _path } from '../script/segment';
import * as self from './_create_toc_contents';
import { crossSpawnSync, crossSpawnAsync } from '../index';
import path = require('path');
import * as fs from 'fs-extra';

(async () =>
{

	let jsonfile = path.join(ProjectConfig.cache_root, 'diff-novel.json');

	if (!fs.existsSync(jsonfile))
	{
		return;
	}

	let ls: { pathMain: string, novelID: string }[] = await fs.readJSON(jsonfile);

	if (ls && ls.length)
	{
		await Promise
			.mapSeries(ls, async function (data)
			{
				const { pathMain, novelID } = data;

				let basePath = path.join(ProjectConfig.novel_root, pathMain, novelID);

				if (fs.existsSync(path.join(basePath, 'README.md')))
				{
					let file = path.join(basePath, '導航目錄.md');

					return processTocContents(basePath, file)
						.tap(async function (ls)
						{
							if (ls)
							{
								await crossSpawnSync('git', [
									'add',
									file,
								], {
									stdio: 'inherit',
									cwd: basePath,
								});

								await crossSpawnSync('git', [
									'commit',
									'-a',
									'-m',
									`[toc:contents] ${pathMain} ${novelID}`,
								], {
									stdio: 'inherit',
									cwd: basePath,
								});
							}
						})
						;
				}
			})
			.then(function ()
			{
				let cp = pushGit(ProjectConfig.novel_root, getPushUrl(GIT_SETTING_DIST_NOVEL.url), true);

				return createPullRequests();
			})
		;
	}
})();
