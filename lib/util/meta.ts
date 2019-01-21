import * as fs from 'fs-extra';
import { chkInfo, IMdconfMeta, mdconf_parse } from 'node-novel-info';
import console from '../log';
import path = require('path');
import ProjectConfig from '../../project.config';

const metaMap = new Map<string, IMdconfMeta>();

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
