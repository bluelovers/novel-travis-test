import * as fs from 'fs-extra';
import { IListNovelRow } from '../../node-novel-task';
import ProjectConfig from '../project.config';
import path = require('upath2');
import { filterNotDelete } from '@node-novel/task/lib/index';
import * as arrayUniq from 'array-uniq';

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

