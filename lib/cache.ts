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

	let ls: { pathMain: string, novelID: string }[] = [];

	if (0 && fs.existsSync(jsonfile))
	{
		ls = await fs.readJSON(jsonfile);
	}

	Object.keys(data.list)
		.forEach(function (pathMain)
		{
			Object.keys(data.list[pathMain]).forEach(function (novelID)
			{
				console.log('[CACHE (2)]', pathMain, novelID, data.list[pathMain][novelID].length);
				ls.push({ pathMain, novelID })

				//console.log(data.list[pathMain][novelID]);
			})
		})
	;

	ls = arrayUniq(ls.filter(v => v));

	fs.outputJSONSync(jsonfile, ls, {
		spaces: '\t',
	});

	return ls;
}

export async function cacheFileList(data: IListNovelRow)
{
	if (data.pathMain.match(/_out$/))
	{
		console.log('[CACHE (1)]', 'SKIP: ', data.pathMain);
		return;
	}

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

	console.log('[CACHE (1)]', path.join(data.pathMain, data.novelID + '.json'), ls.length);

	await fs.outputJSON(file, ls, {
		spaces: '\t',
	});

	return ls;
}

