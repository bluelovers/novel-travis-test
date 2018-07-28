/**
 * Created by user on 2018/7/28/028.
 */

import ProjectConfig from '../project.config';
// @ts-ignore
import { processToc } from '@node-novel/toc';

processToc(ProjectConfig.novel_root)
	.then(function (ls)
	{

	})
;
