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

let opened: NovelStatCache;
const todayMoment = moment().utcOffset(8).startOf('day');

export interface INovelStatCache
{
	novels: {
		[pathMain: string]: {
			[novelID: string]: INovelStatCacheNovel,
		},
	},

	history: {
		[date: string]: INovelStatCacheHistory,
		[date: number]: INovelStatCacheHistory,
	},
}

export interface INovelStatCacheNovel
{
	segment_date?: number,
	epub_date?: number,
	init_date?: number,

	volume?: number,
	chapter?: number,

	volume_old?: number,
	chapter_old?: number,

	segment?: number,
	segment_old?: number,
}

export interface INovelStatCacheHistory
{
	epub_count?: number,
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
			else
			{
				// @ts-ignore
				this.data = {};
			}

			this.data.novels = this.data.novels || {};
			this.data.history = this.data.history || {};
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

	/**
	 * @deprecated
	 */
	_beforeSave()
	{
		let timestamp = this.timestamp;

		if (timestamp in this.data.history)
		{

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
						today.epub[i] = [v[0], v[1], this.novel(v[0], v[1])]
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
						today.segment[i] = [v[0], v[1], this.novel(v[0], v[1])]
					})
				}
			}

			if (!Object.keys(today).length)
			{
				delete this.data.history[timestamp];
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

		Object.entries(this.data.novels)
			.forEach(([pathMain, data], i) =>
			{
				Object.entries(this.data.novels[pathMain])
					.forEach(([novelID, data]) =>
					{
						data.init_date = [
								data.init_date,
								data.epub_date,
								data.segment_date,
							]
								.filter(v => v && v > 0)
								.reduce((a, b) =>
								{
									return Math.min(a, b);
								})
							|| timestamp
						;
					})
				;
			})
		;

		sortObject(this.data, {
			useSource: true,
			keys: [
				'history',
				'novels',
			],
		});

		return this;
	}

	public save()
	{
		fs.outputJSONSync(this.file, this.toJSON(true));

		return this;
	}

	get timestamp()
	{
		return todayMoment.unix();
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
