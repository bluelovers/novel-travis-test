#!/usr/bin/env node

import { processToc } from '@node-novel/toc';
import {
	GIT_SETTING_DIST_NOVEL,
	GIT_SETTING_EPUB,
} from '../data/git';

import * as fs from 'fs-extra';
import { checkShareStatesNotExists, EnumShareStates } from '../lib/share';
import ProjectConfig from '../project.config';

import { getPushUrl, pushGit } from '../script/git';
import path = require('upath2');
import { crossSpawnOutput, isGitRoot } from '../index';
import console from '../lib/log';

let waitpush = path.join(ProjectConfig.cache_root, 'epub.waitpush');

checkShareStatesNotExists([
	EnumShareStates.WAIT_CREATE_GIT
]) && (async () =>
{
	if (!isGitRoot(GIT_SETTING_EPUB.targetPath))
	{
		console.warn(`dist_novel not a git: ${GIT_SETTING_EPUB.targetPath}`);

		throw new Error(`something wrong when create git`);
	}

	if (!fs.existsSync(waitpush))
	{
		return;
	}

	//await pushGit(GIT_SETTING_EPUB.targetPath, getPushUrl(GIT_SETTING_EPUB.url), true);
	await pushGit(GIT_SETTING_EPUB.targetPath, 'origin', true);

	await fs.remove(waitpush);
})();
