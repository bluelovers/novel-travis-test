/**
 * Created by user on 2018/8/14/014.
 */

import { get_ids, processToc } from '@node-novel/toc';
import { md_href } from '@node-novel/toc/index';
import { md_link_escape } from '@node-novel/toc/lib/util';
import { createTocRoot, IDataAuthorNovelItem } from '@node-novel/toc/toc-root';
import processTocContents, { makeHeader, makeLink, getList as getTxtList } from '@node-novel/toc/toc_contents';
import Promise = require('bluebird');
import novelGlobby = require('node-novel-globby/g');
import { makeFilename } from 'novel-epub/lib/txt2epub3';
import { GIT_SETTING_DIST_NOVEL, GIT_SETTING_EPUB } from '../data/git';
import { createMoment, getNovelStatCache } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import { qrcode_link } from '../lib/util';
import ProjectConfig from '../project.config';
import { updateCacheConfigHashHEAD } from '../script/cache/cache-json';
import { getPushUrl, getPushUrlGitee, pushGit } from '../script/git';
import { createPullRequests } from '../script/git-api-pr';
import { crossSpawnSync, crossSpawnAsync } from '../index';
import path = require('path');
import * as fs from 'fs-extra';
import * as FastGlob from 'fast-glob';
import { mdconf_parse, IMdconfMeta, chkInfo } from 'node-novel-info';
import EpubMaker, { hashSum, slugify } from 'epub-maker2';
import txtMerge, { makeFilename as makeFilenameTxt } from 'novel-txt-merge';
import novelEpub from 'novel-epub';
import console from '../lib/log';
import moment = require('moment');
import { getMdconfMeta, getMdconfMetaByPath } from '../lib/util/meta';
import url = require('url');

let _update: boolean | string;

const novelStatCache = getNovelStatCache();

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && Promise.resolve((async () =>
{
	let _cache_init = path.join(ProjectConfig.cache_root, '.toc_contents.cache');
	let jsonfile = path.join(ProjectConfig.cache_root, 'diff-novel.json');

	let ls: { pathMain: string, novelID: string }[];

	let bool = fs.existsSync(_cache_init);

	console.debug(`[toc:contents] 是否已曾經初始化導航目錄`, bool, _cache_init);

	if (!bool)
	{
		console.warn(`[toc:contents] 初始化所有 小說 的 導航目錄`);
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
		console.grey(`[toc:contents] 本次沒有任何待更新列表 (1)`);
		return;
	}
	else
	{
		ls = await fs.readJSON(jsonfile);
	}

	if (ls && ls.length)
	{
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
					let txts = await getTxtList(basePath);

					let meta = getMdconfMeta(pathMain, novelID);

					if (!txts.length)
					{
						console.warn(`[toc:contents]`, pathMain, novelID, '此目錄為書籤');

						/*
						if (meta)
						{
							novelStatCache.mdconf_set(pathMain, novelID, meta);
						}
						*/

						return;
					}

					let file = path.join(basePath, '導航目錄.md');

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

					//console.log(`[toc:contents]`, pathMain, novelID);

					let ret = await processTocContents(basePath, file, async function (basePath: string, ...argv)
						{
							let ret = await makeHeader(basePath, ...argv);

							if (meta)
							{
								let epub = new EpubMaker()
									.withTitle(meta.novel.title, meta.novel.title_short || meta.novel.title_zh)
								;

								let epub_data = await makeFilename({
									inputPath: basePath,
									outputPath: '',
									padEndDate: false,
									useTitle: true,
									filenameLocal: novelID,
									noLog: true,
								}, epub, meta);

								let epub_file = epub_data.basename + epub_data.ext;

								let txt_file = await makeFilenameTxt(meta, epub_data.basename);

								let _pathMain = pathMain;

								if (fs.existsSync(path.join(
									ProjectConfig.novel_root,
									pathMain + '_out',
									novelID,
									'README.md',
								)))
								{
									_pathMain = pathMain + '_out';
								}

								let link_base = `${ProjectConfig.outputUrl}/${_pathMain}/`;

								let t: string;
								let link: string;
								let _add = [];

								{
									let link_base = 'https://github.com/bluelovers/node-novel/blob/master/lib/locales/';

									if (meta.options && meta.options.novel && meta.options.pattern)
									{
										t = meta.options.pattern;
										link = meta.options.pattern + '.ts';

										_add.push(`[${md_link_escape(t)}](${link_base + md_href(link)})`);
									}
									else
									{
										t = '格式與譯名整合樣式';
										link = novelID + '.ts';
									}

									let md = `[${md_link_escape(t)}](${link_base + md_href(link)})`;

									ret.push('- ' + md + ` - 如果連結錯誤 請點[這裡](${link_base})`);
								}

								link_base = `${ProjectConfig.outputUrl}/${_pathMain}/`;

								t = 'EPUB';
								link = epub_file;

								_add.push(` :heart: [${md_link_escape(t)}](${link_base + md_href(link)}) :heart: `);

								t = 'TXT';
								link = 'out/' + txt_file;

								_add.push(`[${md_link_escape(t)}](${link_base + md_href(link)})`);

								ret.push('- ' + _add.join(` ／ `) + ` - 如果連結錯誤 請點[這裡](${link_base})`);

							}

							const DISCORD_LINK = 'https://discord.gg/MnXkpmX';

							{
								let t = DISCORD_LINK;
								let link = DISCORD_LINK;

								let md = `[${md_link_escape(t)}](${link})`;

								ret.push(`- :mega: ${md} - 報錯交流群，如果已經加入請點[這裡](https://discordapp.com/channels/467794087769014273/467794088285175809) 或 [Discord](https://discordapp.com/channels/@me)`);
							}

							{
								let qt = qrcode_link(DISCORD_LINK);
								let qu = qrcode_link(url.format(url.parse([
									ProjectConfig.sourceUrl,
									pathMain,
									novelID,
									'導航目錄.md',
								].join('/'))));

								let c = `\n\n`;

								ret.push(c + [
									`![導航目錄](${md_link_escape(qu)} "導航目錄")`,
									//`![Discord](${md_link_escape(qt)})`,
								].join('  ') + c);
							}

							return ret;
						})
						.tap(async function (ls)
						{
							if (ls)
							{
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

									/*
									await crossSpawnSync('git', [
										'commit',
										'-a',
										'-m',
										`[toc:contents] ${pathMain} ${novelID}`,
									], {
										stdio: 'inherit',
										cwd: basePath,
									});
									*/

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
						console.success(`[toc:contents]`, pathMain, novelID);
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
					/*
					await crossSpawnSync('git', [
						'commit',
						'-a',
						'-m',
						`[toc:contents] 導航目錄.md`,
					], {
						stdio: 'inherit',
						cwd: ProjectConfig.novel_root,
					});
					*/

					_update = `[toc:contents] 導航目錄.md`;

					console.info(`[toc:contents] 完成`);

					await fs.ensureFile(_cache_init);
				}
				else
				{
					console.warn(`[toc:contents] 完成 本次無更新任何檔案`);
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
		console.warn(`[toc:contents] 本次沒有任何待更新列表 (2)`);
	}
})())
	.tap(async function ()
	{
		return null;

		const file = path.join(ProjectConfig.novel_root, 'README.md');

		const old = await fs.readFile(file)
			.catch(function ()
			{
				return '';
			})
			.then(function (ls)
			{
				return ls.toString();
			})
		;

		await createTocRoot(ProjectConfig.novel_root, null, {
			cbForEachSubNovel(text, item)
			{
				let { pathMain, novelID } = item;

				let stat = novelStatCache.novel(pathMain, novelID);

				let text_plus: string = '';

				if (stat.epub_date)
				{
					text_plus += `build: ${createMoment(stat.epub_date).format('YYYY-MM-DD')}  `;
				}

				/*
				if (item.meta)
				{
					novelStatCache.mdconf_set(pathMain, novelID, item.meta);
				}

				if (!stat.chapter || !item.meta)
				{
					let meta = getMdconfMeta(pathMain, novelID);

					if (meta)
					{
						item.meta = meta;
						novelStatCache.mdconf_set(pathMain, novelID, item.meta);
					}
				}
				*/

				if (!stat.chapter)
				{
					/**
					 * 補充沒有被記錄的資訊
					 */
					let txts = novelGlobby.globbySync([
						'**/*.txt',
					], {
						cwd: path.join(ProjectConfig.novel_root, pathMain, novelID),
						throwEmpty: false,
					});

					if (txts && txts.length)
					{
						stat.chapter_old = stat.chapter | 0;
						stat.chapter = txts.length;
					}
				}

				if (stat.chapter)
				{
					text_plus += `chapter: ${stat.chapter}  `;

					let n = stat.chapter - (stat.chapter_old | 0);
					n = n || 0;

					if (n != stat.chapter)
					{
						text_plus += `add: ${n}  `;
					}
				}

				if (text_plus)
				{
					text += '\n  <br/>' + text_plus;
				}

				return text;
			}
		})
			.tap(async function (md)
			{
				if (md && md !== old)
				{
					await fs.writeFile(file, md);

					await crossSpawnAsync('git', [
						'add',
						'--verbose',
						file,
					], {
						stdio: 'inherit',
						cwd: ProjectConfig.novel_root,
					});

					/*
					await crossSpawnAsync('git', [
						'commit',
						'-a',
						'-m',
						`[TOC] toc root`,
					], {
						stdio: 'inherit',
						cwd: ProjectConfig.novel_root,
					});
					*/

					if (!_update || typeof _update != 'string')
					{
						_update = `[TOC] toc root`;
					}

					console.success(`[toc:root] 完成 已更新`);

					//_update = true;
				}
				else
				{
					console.warn(`[toc:root] 完成 但本次無更動內容`);
				}
			})
		;
	})
	.tap(async function ()
	{
		return null;

		return processToc(ProjectConfig.novel_root)
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

				if (!_update || typeof _update != 'string')
				{
					_update = `[TOC] auto update toc`;
				}
			})
			.catch(e => console.error(e))
	})
	.tap(async function ()
	{
		if (_update)
		{
			await crossSpawnAsync('git', [
				'commit',
				'-a',
				'-m',
				typeof _update == 'string' ? _update : `[TOC] updated`,
			], {
				stdio: 'inherit',
				cwd: ProjectConfig.novel_root,
			});

			_update = true;
		}
	})
	.tap(async function ()
	{
		if (_update)
		{
			console.info(`[toc] 完成 並且試圖 push 與 建立 PR`);

			let cp = await pushGit(ProjectConfig.novel_root, getPushUrlGitee(GIT_SETTING_DIST_NOVEL.url), true);

			await createPullRequests();

			updateCacheConfigHashHEAD();
		}

		novelStatCache.save();
	})
;

