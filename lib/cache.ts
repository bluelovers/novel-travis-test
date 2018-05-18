import * as fs from 'fs-extra';
import novelDiffFromLog from '@node-novel/task';
import { IListNovelRow } from '@node-novel/task';
import ProjectConfig from '../project.config';
import path = require('upath2');
import { filterNotDelete } from '@node-novel/task/lib/index';
import * as arrayUniq from 'arr-unique';
import { _path } from '../script/segment';
import * as PromiseBluebird from 'bluebird';
import * as FastGlob from 'fast-glob';

export async function cacheDiffNovelList(data: ReturnType<typeof novelDiffFromLog>)
{
	let jsonfile = path.join(ProjectConfig.cache_root, 'diff-novel.json');

	let ls: { pathMain: string, novelID: string }[];

	if (fs.existsSync(jsonfile))
	{
		ls = await fs.readJSON(jsonfile);
	}

	Object.keys(data)
		.forEach(function (pathMain)
		{
			Object.keys(data[pathMain]).forEach(function (novelID)
			{
				ls.push({ pathMain, novelID })
			})
		})
	;

	ls = arrayUniq(ls.filter(v => v));

	fs.outputJSONSync(path.join(ProjectConfig.cache_root, 'diff-novel.json'), ls, {
		spaces: '\t',
	});

	return ls;
}

export async function cacheFileList(data: IListNovelRow)
{
	let dir = path.join(ProjectConfig.cache_root, 'files', data.pathMain);
	let file = path.join(dir, data.novelID + '.json');

	await fs.ensureDir(dir);

	let ls = [] as string[];

	if (fs.existsSync(file))
	{
		ls = await fs.readJSON(file);
	}

	ls = ls.concat(filterNotDelete(data).map(function (b)
	{
		return b.subpath;
	}));

	ls = arrayUniq(ls);

	console.log('[CACHE]', path.join(data.pathMain, data.novelID + '.json'), ls.length);

	await fs.outputJSON(file, ls, {
		spaces: '\t',
	});

	return ls;
}

