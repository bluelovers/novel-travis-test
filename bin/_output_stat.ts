/**
 * Created by user on 2018/12/18/018.
 */

import defaultSortCallback from '@node-novel/sort';
import { md_href } from '@node-novel/toc';
import { tocSortCallback } from '@node-novel/toc/lib/util';
import { md_link_escape } from '@node-novel/toc/toc_contents';
import crlf from 'crlf-normalize';
import { GIT_SETTING_DIST_NOVEL } from '../data/git';
import { crossSpawnAsync, crossSpawnSync } from '../index';
import { getNovelStatCache, createMoment } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import { ProjectConfig } from '../project.config';
import { updateCacheConfigHashHEAD } from '../script/cache/cache-json';
import { getPushUrlGitee, pushGit } from '../script/git';
import moment = require('moment');
import path = require('upath2');
import fs = require('fs-extra');
import console from '../lib/log';
import { createPullRequests } from '../script/git-api-pr';

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {

	const novelStatCache = getNovelStatCache();

	console.debug(createMoment(novelStatCache.timestamp).format());

	let _md: string[] = [];

	let _ok: boolean;

	Object.entries(novelStatCache.data.history)
		.reduceRight(function (a, b)
		{
			let [timestamp, stat] = b;

			let date = createMoment(parseInt(timestamp)).format('YYYY-MM-DD');

			let _md2: string[] = [];

			let _do: boolean;

			if (stat.epub && stat.epub.length)
			{
				_md2.push(`### Epub\n`);
				//console.log(`Epub`);

				stat.epub.sort(function (a, b)
				{
					return tocSortCallback(a[0], b[0])
						|| tocSortCallback(a[1], b[1])
				}).forEach(function ([pathMain, novelID, novelData])
				{
					let novel = novelData || novelStatCache.novel(pathMain, novelID);

					let title = md_link_escape(novelID);
					let href = md_href([
						pathMain, novelID,
					].join('/'));

					let n = novel.chapter - (novel.chapter_old | 0);

					let text = `- [${title}](${href}) - ${pathMain}`;

					text += `\n  <br/>( v: ${novel.volume} , c: ${novel.chapter}, add: ${n} )`;

					//console.log(pathMain, novelID);

					_md2.push(text);
				});

				_md2.push(``);

				_do = true;
			}

			if (stat.segment && stat.segment.length)
			{
				_md2.push(`### Segment\n`);
				//console.log(`Segment`);

				stat.segment.sort(function (a, b)
				{
					return tocSortCallback(a[0], b[0])
						|| tocSortCallback(a[1], b[1])
				}).forEach(function ([pathMain, novelID, novelData])
				{
					let novel = novelData || novelStatCache.novel(pathMain, novelID);

					let title = md_link_escape(novelID);
					let href = md_href([
						pathMain, novelID,
					].join('/'));

					let text = `- [${title}](${href}) - ${pathMain}`;

					text += `\n  <br/>( s: ${novel.segment} )`;

					//console.log(pathMain, novelID);

					_md2.push(text);
				});

				_md2.push(``);

				_do = true;
			}

			if (_do)
			{
				_md.push(`## ${date}\n`);
				_md.push(..._md2);

				_ok = true;
			}

			return a;
		}, [])
	;

	if (!_ok)
	{
		console.error(`無法生成統計資料`);
	}
	else
	{
		_md.push('\n\n');

		let out = [
			`# HISTORY\n`,
		].concat(_md).join('\n');

		let file = path.join(ProjectConfig.novel_root, 'HISTORY.md');

		let _do: boolean;

		if (fs.pathExistsSync(file))
		{
			let ret = crlf(fs.readFileSync(file).toString());

			if (ret !== out)
			{
				_do = true;
			}
		}
		else
		{
			_do = true;
		}

		let _create_pr: boolean;

		let api_file = novelStatCache.file_git;

		if (!_do)
		{
			console.gray(`檔案無變化`);

			try
			{
				let f1: Buffer = await fs.readFile(api_file);
				let f2: Buffer = await fs.readFile(novelStatCache.file);

				if (!f1.equals(f2))
				{
					console.info(`複製 ${novelStatCache.file} => ${api_file}`);

					fs.copySync(novelStatCache.file, api_file, {
						overwrite: true,
						preserveTimestamps: true,
					});

					await crossSpawnAsync('git', [
						'add',
						'--verbose',
						api_file,
					], {
						stdio: 'inherit',
						cwd: ProjectConfig.novel_root,
					});

					_create_pr = true;
				}
			}
			catch (e)
			{

			}
		}
		else
		{
			/**
			 * 防止安裝到舊版
			 */
			if (novelStatCache.data.meta)
			{
				// @ts-ignore
				novelStatCache.data.meta.sourceUrl = ProjectConfig.sourceUrl || novelStatCache.data.meta.sourceUrl;
				// @ts-ignore
				novelStatCache.data.meta.outputUrl = ProjectConfig.outputUrl || novelStatCache.data.meta.outputUrl;
			}

			novelStatCache.save(2);

			fs.outputFileSync(file, out);

			await crossSpawnAsync('git', [
				'add',
				'--verbose',
				file,
			], {
				stdio: 'inherit',
				cwd: ProjectConfig.novel_root,
			});

			fs.copySync(novelStatCache.file, api_file, {
				overwrite: true,
				preserveTimestamps: true,
			});

			await crossSpawnAsync('git', [
				'add',
				'--verbose',
				api_file,
			], {
				stdio: 'inherit',
				cwd: ProjectConfig.novel_root,
			});

			_create_pr = true;

			console.success(`成功建立統計資料`);
		}

		if (_create_pr)
		{
			await crossSpawnAsync('git', [
				'commit',
				'-a',
				'-m',
				`[stat] HISTORY`,
			], {
				stdio: 'inherit',
				cwd: ProjectConfig.novel_root,
			});

			await pushGit(ProjectConfig.novel_root, getPushUrlGitee(GIT_SETTING_DIST_NOVEL.url));

			await createPullRequests();

			updateCacheConfigHashHEAD();
		}
	}

	let { history, novels } = novelStatCache.data;

	0 && console.dir({ history, novels }, {
		depth: null,
		colors: true,
	});

})();
