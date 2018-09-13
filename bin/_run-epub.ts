/**
 * Created by user on 2018/5/18/018.
 */

import * as fs from 'fs-extra';
import { crossSpawnOutput, crossSpawnSync, isGitRoot } from '../index';
import {
	GIT_SETTING_DIST_NOVEL,
	GIT_SETTING_EPUB,
} from '../data/git';
import ProjectConfig from '../project.config';
import path = require('upath2');
import * as Promise from 'bluebird';
import novelEpub from 'novel-epub';
import { getPushUrl, pushGit } from '../script/git';
import { _path, DIST_NOVEL } from '../script/segment';
import * as FastGlob from 'fast-glob';
import txtMerge from 'novel-txt-merge';
import { array_unique as arrayUniq } from 'array-hyper-unique';
import console from '../lib/log';

if (!isGitRoot(GIT_SETTING_EPUB.targetPath))
{
	console.warn(`dist_novel not a git: ${GIT_SETTING_EPUB.targetPath}`);

	throw new Error(`something wrong when create git`);
}

console.info(`git: ${GIT_SETTING_EPUB.targetPath}`);

(async () =>
{

	let jsonfile = path.join(ProjectConfig.cache_root, 'diff-novel.json');
	let epub_json = path.join(ProjectConfig.cache_root, 'epub.json');

	let ls: { pathMain: string, novelID: string }[] = [];
	let ls2: { pathMain: string, novelID: string }[] = [];

	if (fs.existsSync(jsonfile))
	{
		ls = fs.readJSONSync(jsonfile);
	}

	if (!fs.existsSync(epub_json))
	{
		console.red(`[EPUB] 快取檔案不存在 本次將執行初始化所有 epub 檔案`);

		ls2 = await Promise
			.mapSeries(FastGlob([
				'*/*/*',
			], {
				cwd: path.join(ProjectConfig.novel_root),
				onlyDirectories: true,
				onlyFiles: false,
			}), function (id: string)
			{
				let [pathMain, novelID] = id.split(/[\\\/]/);

				let np = _path(pathMain, novelID);

				if (!fs.existsSync(np))
				{
					console.error(pathMain, novelID);

					return null;
				}

				return { pathMain, novelID }
			})
		;
	}
	else
	{
		ls2 = fs.readJSONSync(epub_json);
	}

	console.debug(`本次新增 ${ls.length} , 上次未完成 ${ls2.length}`);

	ls = (ls || []).concat(ls2 || []);

	ls = ls.filter(function (v)
	{
		return v
	});

	ls = arrayUniq(ls);

	fs.outputJSONSync(epub_json, ls, {
		spaces: '\t',
	});

	if (ls && ls.length)
	{
		await Promise
			.mapSeries(ls, async function (data)
			{
				const { pathMain, novelID } = data;

				let _do = false;

				if (pathMain.match(/_out$/))
				{
					_do = true;
				}
				else if (!fs.existsSync(path.join(_path(pathMain + '_out', novelID), 'README.md')))
				{
					_do = true;
				}

				if (_do)
				{
					const outputPath = path.join(GIT_SETTING_EPUB.targetPath, pathMain);
					const inputPath = _path(pathMain, novelID);

					await Promise.resolve(novelEpub({
							inputPath,
							outputPath,
							padEndDate: false,
							useTitle: true,
							filenameLocal: novelID,
							noLog: true,
						}))
						.then(async function (ret)
						{
							await txtMerge(inputPath, outputPath, ret.basename);

							return ret;
						})
						.then(async function (ret)
						{
							await crossSpawnSync('git', [
								'add',
								'.',
							], {
								stdio: 'inherit',
								cwd: path.join(GIT_SETTING_EPUB.targetPath, pathMain),
							});

							await crossSpawnSync('git', [
								'commit',
								'-a',
								'-m',
								`[epub] ${pathMain} ${novelID}`,
							], {
								stdio: 'inherit',
								cwd: GIT_SETTING_EPUB.targetPath,
							});

							return ret;
						})
						.tap(function ()
						{
							ls = filterCache(ls, pathMain, novelID);

							fs.outputJSONSync(epub_json, ls, {
								spaces: '\t',
							});
						})
						.catch(function (e)
						{
							let msg = e.toString();

							if (msg.match(/not a valid novelInfo data/))
							{
								ls = filterCache(ls, pathMain, novelID);

								console.error('[SKIP]', pathMain, novelID, msg);
							}
							else
							{
								console.error('[ERROR]', pathMain, novelID, msg);
							}
						})
					;

					return true;
				}
				else
				{
					ls = filterCache(ls, pathMain, novelID);

					console.grey(ls.length, pathMain, novelID);
				}
			})
			.tap(function (ls)
			{
				let count = ls.filter(v => v).length;

				console.info(`本次共更新 ${count} 小說`);
			})
			.tap(async function ()
			{
				let waitpush = path.join(ProjectConfig.cache_root, 'epub.waitpush');

				await fs.ensureFile(waitpush);

				console.log(`ls: ${ls.length}`);

				fs.outputJSONSync(epub_json, [], {
					spaces: '\t',
				});

				/*
				await pushGit(GIT_SETTING_EPUB.targetPath, getPushUrl(GIT_SETTING_EPUB.url));

				await fs.remove(waitpush);
				*/
			})
		;
	}
})();

function filterCache(ls: { pathMain: string, novelID: string }[], pathMain: string, novelID: string)
{
	return ls.filter(function (v)
	{
		let bool = v.pathMain == pathMain && v.novelID == novelID;

		return v && !bool
	});
}
