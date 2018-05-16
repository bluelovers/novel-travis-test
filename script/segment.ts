/**
 * Created by user on 2018/5/16/016.
 */

import * as path from "upath2";
import ProjectConfig from '../project.config';
import * as fs from 'fs-extra';
import { useDefault, getDefaultModList } from 'novel-segment/lib';
import Segment from 'novel-segment/lib/Segment';
import TableDict from 'novel-segment/lib/table/dict';
import * as FastGlob from 'fast-glob';
import * as Promise from 'bluebird';
import { crlf } from 'crlf-normalize';

export let CACHE_TIMEOUT = 3600;

export let _segmentObject: Segment;

export type IOptions = {
	pathMain: string,
	pathMain_out?: string,
	novelID: string,

	segment?: Segment,

	novel_root?: string,

	globPattern?: string[],

	files?: string[],

	hideLog?: boolean,

	callback?(done_list: string[], file: string, index: number, length: number),
};

export function doSegmentGlob(options: IOptions)
{
	const novel_root = options.novel_root || ProjectConfig.novel_root;

	const segment = options.segment = getSegment(options.segment);

	options.pathMain_out = options.pathMain_out || options.pathMain;

	let CWD_IN = _path(options.pathMain, options.novelID, novel_root);
	let CWD_OUT = _path(options.pathMain_out, options.novelID, novel_root);

	let globPattern = options.globPattern || [
		'**/*.txt',
	];

	return Promise.resolve(options.files || FastGlob(globPattern, {
		cwd: CWD_IN,
		//absolute: true,
	}) as any as Promise<string[]>)
		.then(function (ls)
		{
			return _doSegmentGlob(ls, options);
		})
	;
}

export function _doSegmentGlob(ls: string[], options: IOptions)
{
	const novel_root = options.novel_root || ProjectConfig.novel_root;

	const segment = options.segment = getSegment(options.segment);

	options.pathMain_out = options.pathMain_out || options.pathMain;

	let CWD_IN = _path(options.pathMain, options.novelID, novel_root);
	let CWD_OUT = _path(options.pathMain_out, options.novelID, novel_root);

	return Promise
		.resolve(ls)
		.tap(function (ls)
		{
			if (ls.length == 0)
			{
				//console.log(CWD_IN);

				return Promise.reject(`沒有搜尋到任何檔案 請檢查搜尋條件`);
			}
		})
		.then(async function (ls)
		{
			let label = `all file ${ls.length}`;
			console.time(label);

			console.log(`all file ${ls.length}`);

			let count_changed = 0;

			let done_list = [] as string[];

			let rs = await Promise.mapSeries(ls, async function (file, index, length)
			{
				let label = file;

				//console.time(label);

				console.log('[start]', label);

				let fillpath = path.join(CWD_IN, file);
				let fillpath_out = path.join(CWD_OUT, file);

//				console.log(fillpath);
//				console.log(fillpath_out);

				if (!fs.pathExistsSync(fillpath))
				{
					if (options.callback)
					{
						done_list.push(file);
						await options.callback(done_list, file, index, length);
					}

					return {
						file,
						changed: false,
						exists: false,
					};
				}

				let text = await fs.readFile(fillpath) as any as string;

				text = crlf(text.toString());

				if (!text.replace(/\s+/g, ''))
				{
					//console.warn('[skip]', label);

					if (options.callback)
					{
						done_list.push(file);
						await options.callback(done_list, file, index, length);
					}

					return {
						file,
						changed: false,
						exists: true,
					};
				}

				let _now = Date.now();

				let ks = await segment.doSegment(text);

				let timeuse = Date.now() - _now;

				let text_new = segment.stringify(ks);

				let changed = text_new != text;

				if (changed)
				{
					console.warn('[changed]', label);

					await fs.outputFile(fillpath_out, text_new);

					count_changed++;
				}

				if (changed)
				{

				}
				else
				{
					//console.log('[done]', label);
				}

				if (options.callback)
				{
					done_list.push(file);
					await options.callback(done_list, file, index, length);
				}

				ks = null;

				return {
					file,
					changed,
					exists: true,
				};
			});

			console.timeEnd(label);

			console.log(`file changed: ${count_changed}`);

			return {
				ls,
				count: {
					file: ls.length,
					changed: count_changed,
				},
			}
		})
		;
}

export function _path(pathMain, novelID, novel_root = ProjectConfig.novel_root)
{
	return path.resolve(novel_root, pathMain, novelID);
}

export function getSegment(segment?: Segment)
{
	if (!segment)
	{
		if (!_segmentObject)
		{
			segment = _segmentObject = createSegment();

			let db_dict = getDictMain(segment);
		}

		segment = _segmentObject;
	}

	return segment;
}

export function createSegment(useCache: boolean = true)
{
	const segment = new Segment({
		autoCjk: true,

		optionsDoSegment: {

			convertSynonym: true,

		},
	});

	let cache_file = path.join(ProjectConfig.cache_root, 'cache.db');

	let options = {
		/**
		 * 開啟 all_mod 才會在自動載入時包含 ZhtSynonymOptimizer
		 */
		all_mod: true,
	};

	console.time(`讀取模組與字典`);

	/**
	 * 使用緩存的字典檔範例
	 */
	if (useCache && fs.existsSync(cache_file))
	{
		//console.log(`發現 cache.db`);

		let st = fs.statSync(cache_file);

		let md = (Date.now() - st.mtimeMs) / 1000;

		//console.log(`距離上次緩存已過 ${md}s`);

		if (md < CACHE_TIMEOUT)
		{
			//console.log(st, md);

			//console.log(`開始載入緩存字典`);

			let data = JSON.parse(fs.readFileSync(cache_file).toString());

			useDefault(segment, {
				...options,
				nodict: true,
			});

			segment.DICT = data.DICT;

			segment.inited = true;

			cache_file = null;
		}
	}

	if (!segment.inited)
	{
		//console.log(`重新載入分析字典`);
		segment.autoInit(options);

		// 簡轉繁專用
		//segment.loadSynonymDict('zht.synonym.txt');
	}

	let db_dict = segment.getDictDatabase('TABLE', true);
	db_dict.TABLE = segment.DICT['TABLE'];
	db_dict.TABLE2 = segment.DICT['TABLE2'];

	db_dict.options.autoCjk = true;

	//console.log('主字典總數', db_dict.size());

	console.timeEnd(`讀取模組與字典`);

	if (useCache && cache_file)
	{
		//console.log(`緩存字典於 cache.db`);

		fs.outputFileSync(cache_file, JSON.stringify({
			DICT: segment.DICT,
		}));
	}

	return segment;
}

export function getDictMain(segment: Segment)
{
	return segment.getDictDatabase('TABLE');
}
