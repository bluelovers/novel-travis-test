/**
 * Created by user on 2018/5/18/018.
 */

import { loadMainConfig } from '@node-novel/task/lib/config';
import { processToc } from '@node-novel/toc';
import fs = require('fs-extra');
import { crossSpawnAsync, crossSpawnOutput, crossSpawnSync, isGitRoot } from '../index';
import {
	GIT_SETTING_DIST_NOVEL,
	GIT_SETTING_EPUB,
} from '../data/git';
import { getNovelStatCache } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import { git_fake_author, path_equal } from '../lib/util';
import ProjectConfig, { MAX_SCRIPT_TIMEOUT } from '../project.config';
import path = require('upath2');
import Promise = require('bluebird');
import novelEpub from 'novel-epub';
import { getPushUrl, pushGit } from '../script/git';
import { _path, DIST_NOVEL } from '../script/segment';
import FastGlob = require('@bluelovers/fast-glob');
import txtMerge from 'novel-txt-merge';
import { array_unique as arrayUniq } from 'array-hyper-unique';
import console from '../lib/log';
import { mdconf_parse, IMdconfMeta, chkInfo } from 'node-novel-info';
import { parsePathMainBase } from '@node-novel/cache-loader/lib/util';
import { CancellationError, TimeoutError } from 'bluebird';
import Bluebird = require('bluebird');

if (!isGitRoot(GIT_SETTING_EPUB.targetPath))
{
	console.warn(`dist_novel not a git: ${GIT_SETTING_EPUB.targetPath}`);

	throw new Error(`something wrong when create git`);
}

console.info(`git: ${GIT_SETTING_EPUB.targetPath}`);

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && (async () =>
{

	let jsonfile = path.join(ProjectConfig.cache_root, 'diff-novel.json');
	let epub_json = path.join(ProjectConfig.cache_root, 'epub.json');

	let ls: { pathMain: string, novelID: string }[] = [];
	let ls2: { pathMain: string, novelID: string }[] = [];

	if (fs.existsSync(jsonfile))
	{
		ls = fs.readJSONSync(jsonfile);
	}

	let allowUpdateTimestamp: boolean = true;

	if (!fs.existsSync(epub_json))
	{
		let CWD = process.cwd();
		const result = loadMainConfig(CWD);

		if (result.config.disableInit)
		{
			console.red(`[EPUB] 快取檔案不存在 但不執行初始化任務`);
		}
		else
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

			allowUpdateTimestamp = false;
		}
	}
	else
	{
		ls2 = fs.readJSONSync(epub_json);
	}

	ls2 = ls2.filter(function (v)
	{
		return v
	});

	ls = arrayUniq(ls);
	ls2 = arrayUniq(ls2);

	console.debug(`本次新增 ${ls.length} , 上次未完成 ${ls2.length}`);

	console.dir(ls);
	console.dir(ls2);

	ls = (ls || []).concat(ls2 || []);

	ls = ls.filter(function (v)
	{
		return v
	});

	ls = arrayUniq(ls);

	fs.outputJSONSync(epub_json, ls, {
		spaces: '\t',
	});

	const startTime = Date.now();

	const MAX_SCRIPT_TIMEOUT_EPUB = 2 * 60 * 1000;

	if (ls && ls.length)
	{
		const novelStatCache = getNovelStatCache();
		const historyToday = novelStatCache.historyToday();

		const novelStatCacheTimestamp = novelStatCache.timestamp;

		await Promise
			.mapSeries(ls, async function (data)
			{
				const { pathMain, novelID } = data;

				if ((Date.now() - startTime) > MAX_SCRIPT_TIMEOUT_EPUB)
				{
					return null
				}

				let { is_out, pathMain_base, pathMain_out } = parsePathMainBase(pathMain);

				let _do = false;

				if (is_out)
				{
					_do = true;
				}
				else if (!fs.existsSync(path.join(_path(pathMain_out, novelID), 'README.md')))
				{
					_do = true;
				}

				console.debug(pathMain, novelID, _do);

				if (_do)
				{
					const outputPath = path.join(GIT_SETTING_EPUB.targetPath, pathMain_base);
					const inputPath = _path(pathMain, novelID);

					await Promise.resolve(novelEpub({
							inputPath,
							outputPath,
							padEndDate: false,
							useTitle: true,
							filenameLocal: novelID,
							noLog: true,
							epubContextDate: ProjectConfig.EPUB_CONTEXT_DATE,
						}))
						.then(async function (ret)
						{
							let txt = await txtMerge(inputPath, outputPath, ret.basename);

							let novel = novelStatCache.novel(pathMain, novelID);

							let epub_fullpath = ret.file;
							let txt_fullpath = txt.fullpath;

							if (novel.txt_basename && novel.txt_basename != txt.filename)
							{
								let file = path.join(outputPath, 'out', novel.txt_basename);

								if (!path_equal(file, txt_fullpath))
								{
									await _remove_file_git(file);
								}
							}

							if (novel.epub_basename && novel.epub_basename != ret.filename)
							{
								let file = path.join(outputPath, novel.epub_basename);

								if (!path_equal(file, epub_fullpath))
								{
									await _remove_file_git(file);
								}
							}

							if (is_out)
							{
								let pathMain_src = pathMain_base;

								let outputPath_src = path.join(GIT_SETTING_EPUB.targetPath, pathMain_src);
								let outputPath = outputPath_src;

								let file = path.join(outputPath_src, ret.filename);

								if (!path_equal(file, epub_fullpath))
								{
									await _remove_file_git(file);
								}

								if (novel.txt_basename)
								{
									file = path.join(outputPath_src, 'out', novel.txt_basename);

									if (!path_equal(file, txt_fullpath))
									{
										await _remove_file_git(file);
									}
								}

								if (novel.epub_basename)
								{
									file = path.join(outputPath_src, novel.epub_basename);

									if (!path_equal(file, epub_fullpath))
									{
										await _remove_file_git(file);
									}
								}

								file = path.join(outputPath_src, 'out', txt.filename);

								if (!path_equal(file, txt_fullpath))
								{
									await _remove_file_git(file);
								}
							}

							novel.txt_basename = txt.filename;

							return ret;
						})
						.then(async function (ret)
						{
							let meta: Partial<IMdconfMeta> = await fs.readFile(path.join(inputPath, 'README.md'))
								.then(function (data)
								{
									return mdconf_parse(data, {
										// 當沒有包含必要的內容時不產生錯誤
										throw: false,
										// 允許不標準的 info 內容
										lowCheckLevel: true,
									});
								})
								.catch(function ()
								{
									return null;
								})
							;

							let author_name: string;

							if (meta && meta.novel && meta.novel.author)
							{
								author_name = git_fake_author(meta.novel.author);
							}

							await crossSpawnSync('git', [
								'add',
								'.',
							], {
								stdio: 'inherit',
								cwd: outputPath,
							});

							let commit_msg = `[epub] ${pathMain} ${novelID}`;

							allowUpdateTimestamp && historyToday.epub.push([pathMain, novelID]);

							let novel = novelStatCache.novel(pathMain, novelID);

							allowUpdateTimestamp && (novel.epub_date = Date.now());

							if (ret.stat)
							{
								if (novelStatCacheTimestamp != novel.update_date)
								{
									novel.volume_old = novel.volume | 0;
									novel.chapter_old = novel.chapter | 0;
								}

								novel.volume = ret.stat.volume;
								novel.chapter = ret.stat.chapter;

								commit_msg += `( v:${novel.volume}, c:${novel.chapter}, add:${novel.chapter - novel.chapter_old} )`;
							}

							novel.epub_basename = ret.filename;

							novel.novel_status = (meta && meta.novel) ? meta.novel.novel_status : 0;

							if (!novel.novel_status)
							{
								delete novel.novel_status;
							}

							novelStatCache.mdconf_set(pathMain, novelID, meta);

							//console.log(novel);

							/**
							 * 實驗性功能 可利用 git user 來過濾作者
							 */
							if (author_name)
							{
								await crossSpawnAsync('git', [
									'commit',
									'-a',
									'-m',
									commit_msg,
									`--author=${author_name}`,
								], {
									stdio: 'inherit',
									cwd: GIT_SETTING_EPUB.targetPath,
								});
							}
							else
							{
								await crossSpawnAsync('git', [
									'commit',
									'-a',
									'-m',
									commit_msg,
								], {
									stdio: 'inherit',
									cwd: GIT_SETTING_EPUB.targetPath,
								});
							}

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

				return false
			})
			.tap(function (ls)
			{
				let _count = {
					done: 0,
					cancel: 0,
					ignore: 0,
				};

				let count = ls.filter(v => {

					if (v)
					{
						_count.done++;
					}
					else if (v == null)
					{
						_count.cancel++;
					}
					else
					{
						_count.ignore++;
					}

					return v;
				}).length;

				console.info(`本次共更新 ${_count.done} 小說`, `取消 x ${_count.cancel}`, `忽略 x ${_count.ignore}`);

				novelStatCache.save();
			})
			.tap(async function ()
			{
				let waitpush = path.join(ProjectConfig.cache_root, 'epub.waitpush');

				await fs.ensureFile(waitpush);

				ls = arrayUniq(ls);
				ls2 = arrayUniq(ls2);

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

async function _remove_file_git(file: string, cwd?: string)
{
	if (fs.pathExistsSync(file))
	{
		if (!cwd)
		{
			cwd = path.dirname(file);
		}

		console.log(`移除舊檔案 ${file}`);

		try
		{
			await crossSpawnSync('git', [
				'rm',
				file,
			], {
				stdio: 'inherit',
				cwd,
			});
		}
		catch (e)
		{

		}

		await fs.remove(file).catch(v => null);

		return fs.pathExistsSync(file);
	}
}
