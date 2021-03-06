/**
 * Created by user on 2018/5/16/016.
 */

import path = require("upath2");
import { crossSpawnSync } from '../index';
import { freeGC } from '../lib/util';
import ProjectConfig, { MAX_SCRIPT_TIMEOUT } from '../project.config';
import fs = require('fs-iconv');
import { useDefault, getDefaultModList } from 'novel-segment/lib';
import Segment from 'novel-segment/lib/Segment';
import TableDict from 'novel-segment/lib/table/dict';
import FastGlob = require('@bluelovers/fast-glob');
import Promise = require('bluebird');
import { crlf } from 'crlf-normalize';
import console from '../lib/log';
import Bluebird = require('bluebird');
// @ts-ignore
import BluebirdCancellation from 'bluebird-cancellation';
import { CancellationError, TimeoutError } from 'bluebird';
import { tw2cn_min, cn2tw_min, tableCn2TwDebug, tableTw2CnDebug } from 'cjk-conv/lib/zh/convert/min';
import { do_cn2tw_min } from '../lib/conv';
import { array_unique_overwrite } from 'array-hyper-unique';

export let DIST_NOVEL = ProjectConfig.novel_root;

export let CACHE_TIMEOUT = 3600;

export let _segmentObject: Segment;

export const ERROR_MSG_001 = `沒有搜尋到任何檔案 請檢查搜尋條件`;

export const CACHE_FILE = path.join(ProjectConfig.cache_root, 'cache.db');

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

	console.info('[do]', options.pathMain, options.novelID);

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

				return Promise.reject(ERROR_MSG_001);
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

//				console.log('[start]', label);

				let fillpath = path.join(CWD_IN, file);
				let fillpath_out = path.join(CWD_OUT, file);

//				console.log(fillpath);
//				console.log(fillpath_out);

				if (!fs.pathExistsSync(fillpath))
				{
					done_list.push(file);

					if (options.callback)
					{
						await options.callback(done_list, file, index, length);
					}

					return {
						file,
						changed: false,
						exists: false,
					};
				}
				else if (!file.match(/\.txt$/i))
				{
					done_list.push(file);

					return {
						file,
						changed: false,
						exists: true,
					};
				}

				let text = await fs.loadFile(fillpath, {
					autoDecode: true,
					})
					.then(v => crlf(v.toString()))
				;

				if (!text.replace(/\s+/g, ''))
				{
					//console.warn('[skip]', label);

					done_list.push(file);

					if (options.callback)
					{
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

				let text_new = await segment.stringify(ks);

				let changed = text_new != text;

				if (changed)
				{
//					console.warn('[changed]', label);

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

				done_list.push(file);

				if (options.callback)
				{
					await options.callback(done_list, file, index, length);
				}

				ks = null;

				text = undefined;
				text_new = undefined;

				return {
					file,
					changed,
					exists: true,
				};
			});

			console.timeEnd(label);

			console[count_changed ? 'ok' : 'debug'](`file changed: ${count_changed}`);

			return {
				ls,
				done_list,
				count: {
					file: ls.length,
					changed: count_changed,
					done: done_list.length,
				},
			}
		})
		;
}

export function _path(pathMain, novelID, novel_root = ProjectConfig.novel_root): string
{
	let p: string;

	try
	{
		p = path.resolve(novel_root, pathMain, novelID)
	}
	catch (e)
	{
		console.dir({
			novel_root,
			pathMain,
			novelID,
		});

		throw e;
	}

	return p;
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

export function resetSegmentCache()
{
	let cache_file = CACHE_FILE;

	if (fs.existsSync(cache_file))
	{
		console.red(`[Segment] reset cache`);
		fs.removeSync(cache_file);
	}
}

export function createSegment(useCache: boolean = true)
{
	const segment = new Segment({
		autoCjk: true,

		optionsDoSegment: {

			convertSynonym: true,

		},
	});

	let cache_file = CACHE_FILE;

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
			data = undefined;
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

	freeGC();

	return segment;
}

export function getDictMain(segment: Segment)
{
	return segment.getDictDatabase('TABLE');
}

export function runSegment()
{
	let _cache_file_segment = path.join(ProjectConfig.cache_root, '.segment');

	let _cache_segment: {

		s_ver?: string,
		d_ver?: string,

		last_s_ver?: string,
		last_d_ver?: string,

		list: {
			[k: string]: {
				[k: string]: {
					s_ver?: string,
					d_ver?: string,

					last_s_ver?: string,
					last_d_ver?: string,
				},
			}
		},
	};

	let _s_ver: string = String(require("novel-segment").version || '1');
	let _d_ver: string = String(require("segment-dict").version || '1');

	if (fs.existsSync(_cache_file_segment))
	{
		try
		{
			_cache_segment = fs.readJSONSync(_cache_file_segment);
		}
		catch (e)
		{

		}
	}

	// @ts-ignore
	_cache_segment = _cache_segment || {};
	_cache_segment.list = _cache_segment.list || {};

	{
		let { last_s_ver, last_d_ver, s_ver, d_ver } = _cache_segment;
		console.debug({
			_s_ver,
			_d_ver,

			s_ver,
			d_ver,
		});

		if (s_ver != _s_ver || d_ver != _d_ver)
		{
			resetSegmentCache();
		}
	}

	const startTime = Date.now();
	const MAX_SCRIPT_TIMEOUT = 20 * 60 * 1000;

	let cancellablePromise = Bluebird
		.mapSeries(FastGlob([
			'*/*.json',
		], {
			cwd: path.join(ProjectConfig.cache_root, 'files'),
		}), async function (id: string)
		{
			let [pathMain, novelID] = id.split(/[\\\/]/);
			novelID = path.basename(novelID, '.json');

			if ((Date.now() - startTime) > MAX_SCRIPT_TIMEOUT)
			{
				return Bluebird.reject(new CancellationError(`任務已取消 本次將不會執行 ${pathMain}, ${novelID}`))
			}

			let np = _path(pathMain, novelID);

			if (!fs.existsSync(np))
			{
				console.error(pathMain, novelID);

				await fs.remove(path.join(ProjectConfig.cache_root, 'files', id));

				return -1;
			}

			let bin = path.join(ProjectConfig.project_root, 'bin/_do_segment.js');

			let _run_all: boolean = false;

			_cache_segment.list[novelID] = _cache_segment.list[novelID] || {};

			let _current_data = _cache_segment.list[novelID][novelID] = _cache_segment.list[novelID][novelID] || {};

			let _handle_list: string[] = [];

			{
				let dir = path.join(ProjectConfig.cache_root, 'files', pathMain);
				let jsonfile = path.join(dir, novelID + '.json');

				await fs.readJSON(jsonfile)
					.then(function (ls)
					{
						_handle_list.push(...ls);
					})
					.catch(e => null)
				;
			}

			if (_current_data.d_ver != _d_ver || _current_data.s_ver != _s_ver)
			{
				console.debug({
					pathMain,
					novelID,
					s_ver: _current_data.s_ver,
					d_ver: _current_data.d_ver,
				});

				_run_all = true;
			}

			let cp = crossSpawnSync('node', [
				'--max-old-space-size=2048',
				//'--expose-gc',
				bin,
				'--pathMain',
				pathMain,
				'--novelID',
				novelID,
				'--runAll',
				String(_run_all),
			], {
				stdio: 'inherit',
				cwd: DIST_NOVEL,
			});

			if (cp.status > 0)
			{
				crossSpawnSync('git', [
					'commit',
					'-a',
					'-m',
					`[Segment] ${pathMain} ${novelID}`,
				], {
					stdio: 'inherit',
					cwd: DIST_NOVEL,
				});

				await fs.outputJSON(_cache_file_segment, _cache_segment, {
					spaces: "\t",
				});
			}

			{
				let dir = path.join(ProjectConfig.cache_root, 'files', pathMain);
				let jsonfile = path.join(dir, novelID + '.json');
				let jsonfile_done = jsonfile + '.done';

				await fs.readJSON(jsonfile_done)
					.then(async function (ls: string[])
					{
						let CWD_IN = _path(pathMain, novelID);
						let cjk_changed: boolean = false;

						if (!fs.pathExistsSync(CWD_IN))
						{
							return;
						}

						ls = (ls || [])
							.concat(_handle_list)
						;

						ls = array_unique_overwrite(ls);

						if (!ls.length || !ls)
						{
							return;
						}

						return Bluebird
							.mapSeries(ls, async function (file)
							{
								if (path.extname(file) == '.txt')
								{
									let fullpath = path.join(CWD_IN, file);

									return fs.loadFile(fullpath, {
										autoDecode: true,
										})
										.then(function (buf)
										{
											if (buf && buf.length)
											{
												let txt_old = String(buf);
												let txt_new = do_cn2tw_min(txt_old)
													.replace(/^\s*\n/, '')
													.replace(/(?<=\n)\s*\n\s*$/, '')
												;

												if (txt_old != txt_new && txt_new)
												{
													cjk_changed = true;

													return fs.writeFile(fullpath, txt_new)
														.then(function ()
														{
															console.success(`[cjk-conv]`, file);

															return fullpath;
														})
												}

												return null;
											}

											return Promise.reject(buf);
										})
										.catch(e => {
											console.error(e.message);
											return null;
										})
										;
								}
							})
							.mapSeries(function (fullpath)
							{
								fullpath && crossSpawnSync('git', [
									'add',
									fullpath,
								], {
									stdio: 'inherit',
									cwd: CWD_IN,
								});

								return fullpath
							})
							.tap(function ()
							{
								if (cjk_changed)
								{
									crossSpawnSync('git', [
										'commit',
										'-m',
										`[cjk-conv] ${pathMain} ${novelID}`,
									], {
										stdio: 'inherit',
										cwd: CWD_IN,
									});
								}
							})
					})
					.catch(e => {
						console.error(e.message);
					})
				;
			}

			_current_data.last_s_ver = _current_data.s_ver;
			_current_data.last_d_ver = _current_data.d_ver;

			_current_data.s_ver = _s_ver;
			_current_data.d_ver = _d_ver;

			return cp.status;
		})
		.then(() => true)
		.catch(CancellationError, (e: CancellationError) => {

			console.error(e.message);

			return false;
		})
		.tap(async function ()
		{
			_cache_segment.last_s_ver = _cache_segment.s_ver;
			_cache_segment.last_d_ver = _cache_segment.d_ver;

			_cache_segment.s_ver = _s_ver;
			_cache_segment.d_ver = _d_ver;

			await fs.outputJSON(_cache_file_segment, _cache_segment, {
				spaces: "\t",
			});
		})
	;

	return cancellablePromise
		.catch(CancellationError, (e) => {

			return console.error(e.message);

		});
}
