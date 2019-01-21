import { get_ids } from '@node-novel/toc';
import { getNovelStatCache } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import ProjectConfig from '../project.config';
import * as FastGlob from 'fast-glob';
import path = require('path');
import { getMdconfMeta, getMdconfMetaByPath } from '../lib/util/meta';
import Promise = require('bluebird');
import console from '../lib/log';
import { _trim, createSortCallback, defaultSortCallback, EnumToLowerCase, naturalCompare } from '@node-novel/sort';

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT,
]) && (async () =>
{

	const novelStatCache = getNovelStatCache();

	let ls: { pathMain: string, novelID: string }[];

	ls = await get_ids(ProjectConfig.novel_root)
		.then(function (ls)
		{
			ls
				.sort(function (a, b)
				{
					if (a.replace(/_out$/, '') === b.replace(/_out$/, ''))
					{
						if (/_out$/.test(a))
						{
							return 1;
						}
						else
						{
							return -1;
						}
					}

					return naturalCompare(a, b);
				})
			;

			return ls;
		})
		.reduce(async function (memo, pathMain: string)
		{
			let _m = pathMain.match(/^(.+?)(_out)?$/);

			let is_out = !!_m[2];
			let pathMain_base = _m[1];

			memo[pathMain_base] = memo[pathMain] || {};

			await Promise
				.mapSeries(FastGlob<string>([
					'*/README.md',
				], {
					cwd: path.join(ProjectConfig.novel_root, pathMain),
				}), function (p)
				{
					let novelID = path.basename(path.dirname(p));

					memo[pathMain_base][novelID] = {
						pathMain,
						novelID,
					};
				})
			;

			return memo;
		}, {} as {
			[pathMain_base: string]: {
				[novelID: string]: {
					pathMain: string,
					novelID: string,
				}
			}
		})
		.then(function (memo)
		{
			let list: { pathMain: string, novelID: string }[] = [];

			Object.values(memo)
				.forEach(function (ls)
				{
					Object.values(ls)
						.forEach(function ({
							pathMain,
							novelID,
						})
						{
							list.push({
								pathMain,
								novelID,
							})
						})
					;
				})
			;

			return list
		})
	;

	if (ls && ls.length)
	{
		console.info(`更新 meta`);

		// 精簡 mdconf
		novelStatCache.data.mdconf = {};

		await Promise
			.mapSeries(ls, async function (data)
			{
				const { pathMain, novelID } = data;

				let meta = getMdconfMeta(pathMain, novelID);

				if (meta)
				{
					novelStatCache.mdconf_set(pathMain, novelID, meta);
					console.success(pathMain, novelID);
				}
			})
		;

		console.info(`done`);

		novelStatCache.save();
	}

})();
