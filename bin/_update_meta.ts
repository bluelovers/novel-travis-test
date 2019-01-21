import { get_ids } from '@node-novel/toc';
import { getNovelStatCache } from '../lib/cache/novel-stat';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import ProjectConfig from '../project.config';
import * as FastGlob from 'fast-glob';
import path = require('path');
import { getMdconfMeta, getMdconfMetaByPath, filterIDs } from '../lib/util/meta';
import Promise = require('bluebird');
import console from '../lib/log';
import { _trim, createSortCallback, defaultSortCallback, EnumToLowerCase, naturalCompare } from '@node-novel/sort';

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT,
]) && (async () =>
{

	const novelStatCache = getNovelStatCache();

	let ls: { pathMain: string, novelID: string }[];

	ls = filterIDs(ProjectConfig.novel_root);

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
