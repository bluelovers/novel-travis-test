/**
 * Created by user on 2018/12/6/006.
 */

import ProjectConfig from '../project.config';
import path = require('upath2');
import * as fs from 'fs-extra';
import console from '../lib/log';

export enum EnumShareStates
{
	WAIT_CREATE_GIT = '.wait_create_git',
}

export function shareStates(name: EnumShareStates)
{
	const file = path.resolve(ProjectConfig.cache_root, name);

	const data = {
		name,
		file,

		exists()
		{
			return fs.pathExistsSync(file)
		},
		ensure()
		{
			return fs.ensureFileSync(file)
		},
		remove()
		{
			return fs.removeSync(file);
		},
	};

	return data;
}

export function checkShareStatesNotExists(list: EnumShareStates[])
{
	let bool = list.some(name => {
		let bool = shareStates(name).exists();

		console.error(name, `should not exists`);

		return bool;
	});

	if (bool)
	{
		process.exit()
	}

	return !bool;
}
