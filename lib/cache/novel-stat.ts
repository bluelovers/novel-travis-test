/**
 * Created by user on 2018/12/17/017.
 */

import ProjectConfig from '../../project.config';
import path = require('upath2');

import { NovelStatCache, createMoment } from '@node-novel/cache-loader';

export { createMoment }

export function getNovelStatCache()
{
	return NovelStatCache.create({
		file: path.join(ProjectConfig.cache_root, 'novel-stat.json'),
		file_git: path.join(ProjectConfig.novel_root, 'novel-stat.json'),
	});
}
