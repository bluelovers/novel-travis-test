/**
 * Created by user on 2018/12/24/024.
 */
import { getNovelStatCache } from '../../lib/cache/novel-stat';

const novelStatCache = getNovelStatCache();

Object.entries(novelStatCache.data.novels)
	.forEach(function ([pathMain, ls])
	{
		Object.entries(ls)
			.forEach(function ([novelID, novel])
			{
				console.log(pathMain, novelID);

				delete novel.update_count;
				delete novel.update_date;
			});
	})
;

novelStatCache.save();
