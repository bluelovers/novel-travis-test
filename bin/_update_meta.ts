import { get_ids } from '@node-novel/toc';
import { getNovelStatCache } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import ProjectConfig from '../project.config';
import * as FastGlob from 'fast-glob';
import path = require('path');
import { getMdconfMeta, getMdconfMetaByPath } from '../lib/util/meta';
import Promise = require('bluebird');
import console from '../lib/log';

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && (async () => {

	const novelStatCache = getNovelStatCache();

	let ls: { pathMain: string, novelID: string }[];

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

	if (ls && ls.length)
	{
		console.info(`更新 meta`);

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
