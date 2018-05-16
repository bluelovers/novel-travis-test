/**
 * Created by user on 2018/5/15/015.
 */

import { IListFileRow, IListMainRow, IListNovelRow } from '@node-novel/task';
import { doSegmentGlob } from './script/segment';
import path = require('upath2');

let DIST_NOVEL = path.join(__dirname, 'dist_novel');

console.log(`目前設定為 預設值 ${__filename}`);

export default {
	cwd: DIST_NOVEL,

	task: {
		main(data: IListMainRow, name: string)
		{
			console.log('MAIN', name);
			//console.log(data);
		},
		async novel(data: IListNovelRow, name: string)
		{
			console.log('NOVEL', data.pathMain, data.novelID, data.length);

			if (0 || 0 && data.pathMain == 'cm' && data.novelID == '姫騎士がクラスメート！　〜異世界チートで奴隷化ハーレム〜')
			{
				await doSegmentGlob({
					pathMain: data.pathMain,
					novelID: data.novelID,
					novel_root: DIST_NOVEL,
				})
					.catch(function (err)
					{
						console.error(err.toString());
					})
				;
			}
		},
		file(data: IListFileRow, file: string)
		{
			//console.log('FILE', data.subpath);
			//console.log(data);
		},
	},
}
