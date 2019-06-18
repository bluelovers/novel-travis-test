import { naturalCompare } from '@node-novel/sort';
import * as fs from 'fs-extra';
import { chkInfo, IMdconfMeta, mdconf_parse } from 'node-novel-info';
import console from '../log';
import path = require('path');
import FastGlob = require('fast-glob');
import ProjectConfig from '../../project.config';
import { get_ids } from '@node-novel/toc';
import { tocSortCallback } from '@node-novel/toc/lib/util';
import { cacheSortCallback } from '@node-novel/cache-loader/lib/util'

const metaMap = new Map<string, IMdconfMeta>();

export function get_idsSync(rootPath: string): string[]
{
	return FastGlob.sync([
		'*',
		'!docs',
		'!.*',
		'!*.raw',
		'!raw',
	], {
		deep: 1,
		onlyDirectories: true,
		markDirectories: false,
		cwd: rootPath,
	})
}

export function filterIDs(rootPath: string)
{
	let memo = get_idsSync(rootPath)
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
		.reduce(function (memo, pathMain: string)
		{
			let _m = pathMain.match(/^(.+?)(_out)?$/);

			let is_out = !!_m[2];
			let pathMain_base = _m[1];

			memo[pathMain_base] = memo[pathMain_base] || {};

			FastGlob.sync([
					'*/README.md',
				], {
					cwd: path.join(rootPath, pathMain),
				})
				.sort(cacheSortCallback)
				.forEach(function (p)
				{
					let novelID = path.basename(path.dirname(p));

					memo[pathMain_base][novelID] = {
						pathMain,
						novelID,
					};
				})
			;

			if (!Object.keys(memo[pathMain_base]).length)
			{
				delete memo[pathMain_base];
			}

			return memo;
		}, {} as {
			[pathMain_base: string]: {
				[novelID: string]: {
					pathMain: string,
					novelID: string,
				}
			}
		})
	;

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
}

export function getMdconfMeta(pathMain: string, novelID: string, reload?: boolean)
{
	let basePath = path.join(ProjectConfig.novel_root, pathMain, novelID);

	return getMdconfMetaByPath(basePath, reload);
}

export function getMdconfMetaByPath(basePath: string, reload?: boolean)
{

	if (!reload && metaMap.has(basePath))
	{
		return metaMap.get(basePath)
	}

	let meta: IMdconfMeta;

	try
	{
		let data = fs.readFileSync(path.join(basePath, 'README.md'));

		meta = mdconf_parse(data, {
			throw: false,
		});

		meta = chkInfo(meta);
	}
	catch (e)
	{
		console.error(e);
		meta = null;
	}

	metaMap.set(basePath, meta);

	return meta;
}
