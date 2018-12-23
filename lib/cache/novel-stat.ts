/**
 * Created by user on 2018/12/17/017.
 */

import { tocSortCallback } from '@node-novel/toc/lib/util';
import ProjectConfig from '../../project.config';
import path = require('upath2');
import fs = require('fs-extra');
import moment = require('moment');
import { array_unique } from 'array-hyper-unique';
import { defaultSortCallback } from '@node-novel/sort';
import sortObject = require('sort-object-keys2');
import { EnumNovelStatus } from 'node-novel-info/lib/const';
import { IMdconfMeta } from 'node-novel-info';

let opened: NovelStatCache;
const todayMoment = createMoment().startOf('day');

/**
 * 所有 timestamp 為 Unix timestamp in milliseconds 為 utc +8
 * pathMain 為 主資夾名稱
 * novelID 為 小說資料夾名稱
 */
export interface INovelStatCache
{
	/**
	 * 小說緩存狀態
	 */
	novels: {
		[pathMain: string]: {
			[novelID: string]: INovelStatCacheNovel,
		},
	},

	/**
	 * 歷史紀錄
	 */
	history: {
		[timestamp: string]: INovelStatCacheHistory,
		[timestamp: number]: INovelStatCacheHistory,
	},

	/**
	 * 透過 node-novel-conf 解析過的 META 資料 (README.md)
	 */
	mdconf: {
		[pathMain: string]: {
			[novelID: string]: IMdconfMeta,
		},
	},
}

export interface INovelStatCacheNovel
{
	/**
	 * segment 更新時間
	 */
	segment_date?: number,
	/**
	 * epub 更新時間
	 */
	epub_date?: number,

	/**
	 * 初始化時間
	 */
	init_date?: number,

	/**
	 * 總章/卷數量
	 */
	volume?: number,
	/**
	 * 總話數
	 */
	chapter?: number,

	/**
	 * 上次的總章/卷數量
	 */
	volume_old?: number,
	/**
	 * 上次的總話數
	 */
	chapter_old?: number,

	/**
	 * segment 變動數量
	 */
	segment?: number,
	/**
	 * 上次的 segment 變動數量
	 */
	segment_old?: number,

	/**
	 * 小說狀態 flag 根據 readme.md 內設定
	 */
	novel_status?: EnumNovelStatus,

	/**
	 * 最後變動時間
	 */
	update_date?: number;
	/**
	 * 紀錄變動次數
	 */
	update_count?: number;

	/**
	 * epub filename
	 */
	epub_basename?: string,
	txt_basename?: string,
}

export interface INovelStatCacheHistory
{
	/**
	 * 本次記錄內的 epub 總數
	 */
	epub_count?: number,
	/**
	 * 本次記錄內的 epub
	 */
	epub?: Array<[string, string, INovelStatCacheNovel?]>,
	segment_count?: number,
	segment?: Array<[string, string, INovelStatCacheNovel?]>,
}

export interface INovelStatCacheOptions
{

}

export class NovelStatCache
{
	file: string = path.join(ProjectConfig.cache_root, 'novel-stat.json');
	file_git: string = path.join(ProjectConfig.novel_root, 'novel-stat.json');
	data: INovelStatCache = null;
	options: INovelStatCacheOptions;

	inited: boolean = false;

	/**
	 * @deprecated
	 */
	constructor(options?: INovelStatCacheOptions)
	{
		this.options = options || {};

		this.open();
	}

	protected open()
	{
		if (!this.inited)
		{
			this.inited = true;

			if (fs.pathExistsSync(this.file))
			{
				this.data = fs.readJSONSync(this.file);
			}
			else if (fs.pathExistsSync(this.file_git))
			{
				this.data = fs.readJSONSync(this.file_git);
			}

			// @ts-ignore
			this.data = this.data || {};

			this.data.history = this.data.history || {};
			this.data.novels = this.data.novels || {};
			this.data.mdconf = this.data.mdconf || {};
		}

		return this;
	}

	pathMain(pathMain: string)
	{
		return this.data.novels[pathMain] = this.data.novels[pathMain] || {};
	}

	novel(pathMain: string, novelID: string)
	{
		this.pathMain(pathMain);

		this.data.novels[pathMain][novelID] = this.data.novels[pathMain][novelID] || {};

		return this.data.novels[pathMain][novelID];
	}

	mdconf_get(pathMain: string, novelID: string)
	{
		this.data.mdconf[pathMain] = this.data.mdconf[pathMain] || {};

		return this.data.mdconf[pathMain][novelID];
	}

	mdconf_set(pathMain: string, novelID: string, meta: IMdconfMeta)
	{
		this.data.mdconf[pathMain] = this.data.mdconf[pathMain] || {};

		this.data.mdconf[pathMain][novelID] = meta;

		return this;
	}

	/**
	 * @deprecated
	 */
	_beforeSave()
	{
		let timestamp = this.timestamp;

		Object.entries(this.data.novels)
			.forEach(([pathMain, data], i) =>
			{
				Object.entries(this.data.novels[pathMain])
					.forEach(([novelID, data]) =>
					{
						let _a = [
							data.init_date,
							data.epub_date,
							data.segment_date,
							data.update_date,
						]
							.filter(v => v && v > 0)
						;

						if (!_a.length)
						{
							data.init_date = timestamp
						}
						else
						{
							data.init_date = _a
								.reduce((a, b) =>
								{
									return Math.min(a, b);
								})
								|| timestamp
							;
						}
					})
				;
			})
		;

		if (timestamp in this.data.history)
		{
			let _list = new Set<INovelStatCacheNovel>();

			let today = this.data.history[timestamp];

			if (today.epub)
			{
				array_unique(today.epub, {
					overwrite: true,
				});

				today.epub.sort(function (a, b)
				{
					return tocSortCallback(a[0], b[0])
						|| tocSortCallback(a[1], b[1])
				});

				today.epub_count = today.epub.length | 0;

				if (!today.epub_count)
				{
					delete today.epub;
					delete today.epub_count;
				}
				else
				{
					today.epub.forEach((v, i) =>
					{
						let novel = this.novel(v[0], v[1]);

						_list.add(novel);

						today.epub[i][2] = novel;
					})
				}
			}

			if (today.segment)
			{
				array_unique(today.segment, {
					overwrite: true,
				});

				today.segment.sort(function (a, b)
				{
					return tocSortCallback(a[0], b[0])
						|| tocSortCallback(a[1], b[1])
				});

				today.segment_count = today.segment.length | 0;

				if (!today.segment_count)
				{
					delete today.segment;
					delete today.segment_count;
				}
				else
				{
					today.segment.forEach((v, i) =>
					{
						let novel = this.novel(v[0], v[1]);

						_list.add(novel);

						today.segment[i][2] = novel;
					})
				}
			}

			if (!Object.keys(today).length)
			{
				delete this.data.history[timestamp];
			}
			else
			{
				_list.forEach(function (data)
				{

					let _a = [
							data.init_date,
							data.epub_date,
							data.segment_date,
							data.update_date,
						]
						.filter(v => v && v > 0)
					;

					let old = data.update_date;

					if (!_a.length)
					{
						data.update_date = timestamp
					}
					else
					{
						data.update_date = _a
							.reduce((a, b) =>
							{
								return Math.max(a, b);
							})
							|| timestamp
						;
					}

					if (old !== data.update_date)
					{
						data.update_count = (data.update_count | 0) + 1;
					}
				})
			}
		}

		let ks = Object.keys(this.data.history);

		if (ks.length)
		{
			let h = this.data.history;

			ks.forEach(function (k)
			{
				if (!Object.keys(h[k]).length)
				{
					delete h[k];
				}
			});

			if (ks.length > 7)
			{
				ks.sort().slice(0, -7).forEach(k => delete this.data.history[k])
			}
		}

		sortObject(this.data, {
			useSource: true,
			keys: [
				'history',
				'novels',
				'mdconf',
			],
		});

		return this;
	}

	public save()
	{
		fs.outputJSONSync(this.file, this.toJSON(true), {
			spaces: 2,
		});

		return this;
	}

	get timestamp()
	{
		return todayMoment.valueOf();
	}

	historyPrev()
	{
		let timestamp = this.timestamp;

		let ks: string[];

		if (timestamp in this.data.history)
		{
			ks = Object.keys(this.data.history);
			ks.pop();
		}
		else
		{
			ks = Object.keys(this.data.history);
		}

		let k = ks.pop();

		if (k in this.data.history)
		{
			return this.data.history[k];
		}

		return null;
	}

	historyToday()
	{
		let timestamp = this.timestamp;

		let data = this.data.history[timestamp] = this.data.history[timestamp] || {};

		data.epub_count = data.epub_count | 0;
		data.epub = data.epub || [];

		data.segment_count = data.segment_count | 0;
		data.segment = data.segment || [];

		return this.data.history[timestamp];
	}

	static create(options?: INovelStatCacheOptions)
	{
		if (opened)
		{
			return opened;
		}

		return opened = new this(options);
	}

	toJSON(bool?: boolean)
	{
		if (bool)
		{
			this._beforeSave()
		}
		return this.data;
	}

}

export function getNovelStatCache()
{
	return NovelStatCache.create();
}

export function createMoment(...argv)
{
	return moment(...argv).utcOffset(8);
}

/*
let c = NovelStatCache.create();

console.dir(c.data, {
	depth: null,
});

let t = c.historyToday();

let n = c.novel('1', '2');

n.chapter = 10;

t.epub.push(['k', 'b']);
t.epub.push(['a', 'b']);

c._beforeSave();

console.dir(c, {
	depth: null,
});

c.save();
*/
