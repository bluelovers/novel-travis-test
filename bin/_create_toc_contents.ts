/**
 * Created by user on 2018/8/14/014.
 */

import { get_ids } from '@node-novel/toc';
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
import * as FastGlob from 'fast-glob';

(async () =>
{
	let _cache_init = path.join(ProjectConfig.cache_root, '.toc_contents.cache');
	let jsonfile = path.join(ProjectConfig.cache_root, 'diff-novel.json');

	let ls: { pathMain: string, novelID: string }[];

	let bool = fs.existsSync(_cache_init);

	console.log(`[toc:contents] 是否已曾經初始化導航目錄`, bool, _cache_init);

	if (!bool)
	{
		console.log(`[toc:contents] 初始化所有 小說 的 導航目錄`);
		ls = await get_ids(ProjectConfig.novel_root)
			.reduce(async function (memo, pathMain: string)
			{
				await Promise
					.mapSeries(FastGlob<string>([
						'*/README.md',
					], {
						cwd: path.join(ProjectConfig.novel_root, pathMain),
					}), function (p)
					{
						let novelID = path.basename(path.dirname(p));

						memo.push({ pathMain, novelID });
					})
				;

				return memo;
			}, [])
		;
	}
	else if (!fs.existsSync(jsonfile))
	{
		console.log(`[toc:contents] 本次沒有任何待更新列表 (1)`);
		return;
	}
	else
	{
		ls = await fs.readJSON(jsonfile);
	}

	if (ls && ls.length)
	{
		let _update: boolean;

		await Promise
			.mapSeries(ls, async function (data)
			{
				const { pathMain, novelID } = data;

				let basePath = path.join(ProjectConfig.novel_root, pathMain, novelID);

				let msg: string;
				let _did = false;
				let _file_changed: boolean;

				if (fs.existsSync(path.join(basePath, 'README.md')))
				{
					let file = path.join(basePath, '導航目錄.md');

					//console.log(`[toc:contents]`, pathMain, novelID);

					let ret = await processTocContents(basePath, file)
						.tap(async function (ls)
						{
							if (ls)
							{
								let old = await fs.readFile(file)
									.catch(function ()
									{
										return '';
									})
									.then(function (ls)
									{
										return ls.toString();
									})
								;

								_file_changed = old != ls;

								if (!bool || _file_changed)
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

									_did = true;
									_update = true;
								}
								else
								{
									msg = `目錄檔案已存在並且沒有變化`;
								}
							}
							else
							{
								msg = `無法生成目錄，可能不存在任何章節檔案`;
							}
						})
						;

					if (_did)
					{
						console.log(`[toc:contents]`, pathMain, novelID);
					}
					else
					{
						console.dir({
							title: `[SKIP]`,
							pathMain, novelID,
							msg,
							bool,
							_file_changed,
						});
					}

					return ret;
				}
			})
			.tap(async function ()
			{
				if (_update)
				{
					console.log(`[toc:contents] 完成 並且試圖 push 與 建立 PR`);

					let cp = await pushGit(ProjectConfig.novel_root, getPushUrl(GIT_SETTING_DIST_NOVEL.url), true);

					await createPullRequests();

					await fs.ensureFile(_cache_init);
				}
				else
				{
					console.log(`[toc:contents] 完成 本次無更新任何檔案`);
				}
			})
			.tap(function ()
			{
				console.log(`[toc:contents] done.`);
			})
		;
	}
	else
	{
		console.log(`[toc:contents] 本次沒有任何待更新列表 (2)`);
	}
})();
