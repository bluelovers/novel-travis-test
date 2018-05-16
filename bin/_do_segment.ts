/**
 * Created by user on 2018/5/16/016.
 */

import * as yargs from 'yargs';
import { doSegmentGlob } from '../script/segment';

let { pathMain, novelID, file, novel_root } = yargs.argv;

if (pathMain && novelID)
{
	(async () =>
	{
		if (file)
		{
			return doSegmentGlob({
				pathMain,
				novelID,
				novel_root,
				globPattern: Array.isArray(file) ? file : [file],
			});
		}
		else
		{
			return doSegmentGlob({
				pathMain,
				novelID,
				novel_root,
			});
		}
	})()
		.then(function (r)
		{
			process.exit(r.count.changed)
		})
	;
}

