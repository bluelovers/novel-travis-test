/**
 * Created by user on 2017/8/13/013.
 */

import * as path from 'path';

export const project_root = path.join(__dirname);

export const cache_root = path.join(project_root, '.cache');
export const novel_root = path.join(project_root, 'dist_novel');
export const epub_root = path.join(project_root, 'dist_epub');

import * as ProjectConfig from './project.config';
export { ProjectConfig }
export default ProjectConfig;
