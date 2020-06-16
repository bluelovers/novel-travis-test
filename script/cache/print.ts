/**
 * Created by user on 2019/6/18.
 */

import FastGlob = require('@bluelovers/fast-glob');
import ProjectConfig from '../../project.config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { console } from '../../lib/log';
import { loadCacheConfig } from '@node-novel/task/lib/config';

FastGlob([
	'**/*',
], {
		cwd: ProjectConfig.cache_root,
	})
	.then(async (ls) => {

		console.dir(ls);

		console.dir(ProjectConfig.project_root);

		console.info(`loadCacheConfig`);
		console.dir(loadCacheConfig(ProjectConfig.project_root));

		console.info(`.cache.json`);
		await fs.readJSON(path.join(ProjectConfig.cache_root, '.cache.json')).then(data => console.dir(data)).catch(e => null);

		console.info(`epub.json`);
		await fs.readJSON(path.join(ProjectConfig.cache_root, 'epub.json')).then(data => console.dir(data)).catch(e => null);
	})
;
