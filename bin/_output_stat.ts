/**
 * Created by user on 2018/12/18/018.
 */

import defaultSortCallback from '@node-novel/sort';
import { md_href } from '@node-novel/toc';
import { md_link_escape } from '@node-novel/toc/toc_contents';
import crlf from 'crlf-normalize';
import { GIT_SETTING_DIST_NOVEL } from '../data/git';
import { crossSpawnAsync, crossSpawnSync } from '../index';
import { getNovelStatCache } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import { ProjectConfig } from '../project.config';
import { getPushUrlGitee, pushGit } from '../script/git';
import moment = require('moment');
import path = require('upath2');
import fs = require('fs-extra');
import console from '../lib/log';

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {

	const novelStatCache = getNovelStatCache();

	let _md: string[] = [];

	let _ok: boolean;

	Object.entries(novelStatCache.data.history)
		.reduceRight(function (a, b)
		{
			let [timestamp, stat] = b;

			if (stat.epub && stat.epub.length)
			{
				let date = moment.unix(parseInt(timestamp)).format('YYYY-MM-DD');

				console.log(date);

				_md.push(`## ${date}\n`);

				stat.epub.sort(function (a, b)
				{
					return defaultSortCallback(a[0], b[0])
						|| defaultSortCallback(a[1], b[1])
				}).forEach(function ([pathMain, novelID])
				{
					let novel = novelStatCache.novel(pathMain, novelID);

					let title = md_link_escape(novelID);
					let href = md_href([
						pathMain, novelID,
					].join('/'));

					let text = `- [${title}](${href}) - ${pathMain}`;

					console.log(pathMain, novelID);

					_md.push(text);
				});

				_md.push(``);

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

		if (!_do)
		{
			console.gray(`檔案無變化`);
		}
		else
		{
			fs.outputFileSync(file, out);

			await crossSpawnAsync('git', [
				'add',
				'--verbose',
				file,
			], {
				stdio: 'inherit',
				cwd: ProjectConfig.novel_root,
			});

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

			console.success(`成功建立統計資料`);
		}
	}

})();
