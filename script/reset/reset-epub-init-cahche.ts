/**
 * Created by user on 2018/12/11/011.
 */


import * as fs from 'fs-extra';
import ProjectConfig from '../../project.config';
import path = require('upath2');
import console from '../../lib/log';
let epub_json = path.join(ProjectConfig.cache_root, 'epub.json');

fs.pathExists(epub_json)
.then(async function (bool)
{
	console.debug('[exists]', bool, epub_json);

	if (bool)
	{
		await fs.remove(epub_json);

		console.debug('[delete]', epub_json);
	}
})
;
