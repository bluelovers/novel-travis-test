/**
 * Created by user on 2017/8/13/013.
 */

import 'source-map-support/register';

import path = require('path');

export const project_root = path.join(__dirname);

export const cache_root = path.join(project_root, '.cache');
export const novel_root = path.join(project_root, 'dist_novel');
export const epub_root = path.join(project_root, 'dist_epub');

//export const sourceUrl = 'https://gitee.com/bluelovers/novel/tree/master';
export const sourceUrl = 'https://gitlab.com/novel-group/txt-source/blob/master';
export const outputUrl = 'https://gitlab.com/demonovel/epub-txt/blob/master';

export const MAX_SCRIPT_TIMEOUT = 10 * 60 * 1000;

export const EPUB_CONTEXT_DATE = new Date('2000-12-24 23:00:00Z');

export const ProjectConfig = exports as typeof import('./project.config');
export default ProjectConfig;
