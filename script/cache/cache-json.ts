import * as fs from 'fs-extra';
import console from '../../lib/log';
import { getHashHEAD } from '../git';
import { CacheConfig, DIST_NOVEL } from '../init';

export function updateCacheConfigHashHEAD()
{
	if (CacheConfig)
	{
		let currentHEADNew = getHashHEAD(DIST_NOVEL);

		let config = fs.readJSONSync(CacheConfig.filepath);

		config.last = currentHEADNew;
		config.last_push_head = currentHEADNew;

		fs.writeJSONSync(CacheConfig.filepath, config, {
			spaces: 2,
		});

		console.dir(config);
	}
}
