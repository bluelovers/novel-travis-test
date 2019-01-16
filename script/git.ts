import moment = require('moment');
import path = require('upath2');
import { LF } from 'crlf-normalize';
import * as fs from 'fs-extra';
import gitlog from 'gitlog2';
import { crossSpawnSync, SpawnSyncReturns } from '..';
import { crossSpawnOutput, isGitRoot, getCrossSpawnError } from '../index';
import console from '../lib/log';
import { EnumShareStates, shareStates } from '../lib/share';
import ProjectConfig from '../project.config';

import { GITEE_TOKEN, NO_PUSH, NOT_DONE, PROJECT_ROOT } from './init';

export const DATE_FORMAT = 'YYYY-MM-DD-HH-mm-ss';

/**
 * Created by user on 2018/5/17/017.
 */

export function pushGit(REPO_PATH: string, repo: string, force?: boolean)
{
	let argv = [
		'push',
		'--progress',
		force ? '--force' : undefined,
		repo,
	];

	argv = argv.filter(v => v);

	if (NO_PUSH)
	{
		return null;
	}

	console.debug(`嘗試推送 ${repo}`);

	let cp = crossSpawnSync('git', argv, {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});

	return cp;
}

export function pullGit(REPO_PATH: string)
{
	return crossSpawnSync('git', [
		'pull',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function fetchGit(REPO_PATH: string)
{
	return crossSpawnSync('git', [
		'fetch',
		'--force',
		'origin',
		'master',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function fetchGitAll(REPO_PATH: string)
{
	let cp = crossSpawnSync('git', [
		'fetch',
		'--all',
		'--prune',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});

	console.debug(`cp.stdout`);
	console.dir(cp.stdout);
	console.debug(`cp.stderr`);
	console.dir(cp.stderr);
	console.debug(`cp.error`);
	console.dir(cp.error);

	return cp;
}

export function newBranch(REPO_PATH: string, BR_NAME: string)
{
	console.debug(`嘗試建立新分支 ${BR_NAME}`);

	return crossSpawnSync('git', [
		'checkout',
		'-B',
		BR_NAME,
		'origin/master',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function currentBranchName(REPO_PATH: string)
{
	let cp = crossSpawnSync('git', [
		'rev-parse',
		'--abbrev-ref',
		'HEAD',
	], {
		cwd: REPO_PATH,
	});

	let name = crossSpawnOutput(cp.stdout);

	return name;
}

export function deleteBranch(REPO_PATH: string, name: string, force?: boolean)
{
	if (name == 'master' || !name)
	{
		throw new Error();
	}

	console.debug(`嘗試刪除本地分支 ${name}`);

	return crossSpawnSync('git', [
		'branch',
		force ? '-D' : '-d',
		name,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

/**
 * @FIXME 不知道為什麼沒有刪除 所以多做一次另外一種刪除步驟
 */
export function deleteBranchRemote(REPO_PATH: string, remote: string, name: string, force?: boolean)
{
	if (name == 'master' || !name || !remote)
	{
		throw new Error();
	}

	console.debug(`嘗試刪除遠端分支 ${name}`);

	crossSpawnSync('git', [
		'push',
		remote,
		'--delete',
		name,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});

	/**
	 * 不知道為什麼沒有刪除 所以多做一次另外一種刪除步驟
	 * https://zlargon.gitbooks.io/git-tutorial/content/remote/delete_branch.html
	 */
	crossSpawnSync('git', [
		'push',
		remote,
		':' + name,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function oldBranch(REPO_PATH: string)
{
	let name = currentBranchName(REPO_PATH);

	if (name.indexOf('auto/') == 0)
	{
		return name;
	}

	return null;
}

export function diffOrigin(REPO_PATH: string)
{
	let log = gitlog({
		repo: REPO_PATH,
		branch: [currentBranchName(REPO_PATH), 'origin/master'].join('..'),
		number: 3,
		nameStatus: false,
	});

	console.log(log, log.length);

	return log.length;
}

export function getHashHEAD(REPO_PATH: string, branch: string = 'HEAD')
{
	return gitlog({ repo: REPO_PATH, number: 1, branch })[0].abbrevHash;
}

export type IOptionsCreateGit = {
	url: string,
	targetPath: string,

	newBranchName: string,

	urlClone?: string,
	urlPush?: string,

	NOT_DONE,

	CLONE_DEPTH?: number,

	LOGIN_TOKEN?: string,

	on?: {
		create_before?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]),
		create?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]),
		create_after?(data: ReturnType<typeof createGit>["data"], temp?: ReturnType<typeof createGit>["temp"]),
	},
};

export function getPushUrl(url: string, login_token?: string)
{
	if (login_token && !/@$/.test(login_token))
	{
		login_token += '@';
	}

	return `https://${login_token ? login_token : ''}${url}`;
}

export function getPushUrlGitee(url: string, login_token: string = GITEE_TOKEN)
{
	return getPushUrl(url, login_token);
}

export function createGit(options: IOptionsCreateGit)
{
	const wait_create_git = shareStates(EnumShareStates.WAIT_CREATE_GIT);

	wait_create_git.ensure();

	let targetName = path.basename(options.targetPath);
	let targetPath = path.normalize(options.targetPath);

	let REPO_PATH = targetPath;

	let exists = fs.pathExistsSync(REPO_PATH) && isGitRoot(REPO_PATH);

	let data = {
		targetName,
		targetPath,

		newBranchName: options.newBranchName,

		exists,
		existsBranchName: exists && oldBranch(REPO_PATH) || null,

		NOT_DONE,

		url: options.url,
		urlClone: options.urlClone,

		LOGIN_TOKEN: options.LOGIN_TOKEN,

		pushUrl: options.urlPush || getPushUrl(options.url, options.LOGIN_TOKEN),
	};

	let temp: {
		cp: SpawnSyncReturns,

		[k: string]: any,
	} = {
		cp: null,
	};

	let label: string;

	console.info(`create git: ${targetName}`);

	if (options.on && options.on.create_before)
	{
		label = `--- CREATE_BEFORE ---`;
		console.info(label);
		console.time(label);
		options.on.create_before(data, temp);
		console.timeEnd(label);
	}

	label = `--- CREATE ---`;
	console.info(label);
	console.time(label);

	temp.cp = null;

	let _deleted: boolean;

	if (data.NOT_DONE && data.exists)
	{
		console.warn(`${targetName} already exists`);

		temp.cp = fetchGit(data.targetPath);
	}
	else if (data.exists)
	{
		console.warn(`${targetName} already exists`);

		console.info(`取得所有遠端分支`);
		fetchGitAll(data.targetPath);

		_deleted = gitRemoveBranchOutdate(data.targetPath);

		temp.cp = fetchGit(data.targetPath);
	}
	else
	{
		let CLONE_DEPTH: number = (options.CLONE_DEPTH || process && process.env && process.env.CLONE_DEPTH || 50) as number;

		if (isNaN(CLONE_DEPTH) || !CLONE_DEPTH || CLONE_DEPTH <= 0)
		{
			CLONE_DEPTH = 50;
		}

		let urlClone = data.urlClone;

		if (!urlClone)
		{
			console.red(`urlClone 不存在 嘗試自動生成`);

			if (data.LOGIN_TOKEN)
			{
				console.debug(`使用 LOGIN_TOKEN 自動生成 urlClone`);
				urlClone = getPushUrl(data.url, data.LOGIN_TOKEN);
			}
			else
			{
				console.debug(`使用 url 自動生成 urlClone`);
				urlClone = getPushUrl(data.url);
			}
		}

		temp.cp = crossSpawnSync('git', [
			'clone',
			`--depth=${CLONE_DEPTH}`,
			//'--verbose',
			//'--progress ',
			urlClone,
			data.targetPath,
		], {
			stdio: 'inherit',
			cwd: PROJECT_ROOT,
		});
	}

	let _cp_error = getCrossSpawnError(temp.cp);

	if (_cp_error)
	{
		throw _cp_error
	}

	if (options.on && options.on.create)
	{
		options.on.create(data, temp);
	}

	console.timeEnd(label);

	if (options.on && options.on.create_after)
	{
		label = `--- CREATE_AFTER ---`;
		console.info(label);
		console.time(label);
		options.on.create_after(data, temp);
		console.timeEnd(label);
	}

	label = `--- BEFORE_DONE ---`;
	console.info(label);
	console.time(label);

	if (_deleted)
	{
		gitGcAggressive(data.targetPath);
	}
	else
	{
		gitGc(data.targetPath);
	}

	console.timeEnd(label);

	label = `--- REMOVE_WAIT ---`;
	console.info(label);
	console.time(label);

	wait_create_git.remove();

	console.timeEnd(label);

	return { data, temp }
}

export function gitGc(REPO_PATH: string, argv?: string[])
{
	argv = filterArgv([
		'gc',
	].concat((argv && argv.length) ? argv : []));

	if (argv.length == 1)
	{
		argv.push('--prune="3 days"');
	}

	console.info(`優化 GIT 資料`, argv);

	return crossSpawnSync('git', argv, {
		cwd: REPO_PATH,
		stdio: 'inherit',
	});
}

export function gitGcAggressive(REPO_PATH: string, argv?: string[])
{
	argv = filterArgv([
		'gc',
		'--aggressive',
	].concat((argv && argv.length) ? argv : []));

	if (argv.length == 2)
	{
		argv.push('--prune="3 days"');
	}

	console.info(`優化 GIT 資料`, argv);

	return crossSpawnSync('git', argv, {
		cwd: REPO_PATH,
		stdio: 'inherit',
	});
}

export function branchNameToDate(br_name: string)
{
	return moment(br_name.replace(/^.*auto\//, ''), DATE_FORMAT)
}

export function gitRemoveBranchOutdate(REPO_PATH: string)
{
	console.info(`開始分析 GIT 分支`);

	let data_ret: boolean = false;

	let br_name = currentBranchName(REPO_PATH).toString().toLowerCase();

	let date_br = branchNameToDate(br_name);
	let date_now = moment();

	//console.log({br_name, date_br, date_now});

	let brs: ReturnType<typeof parseBranchGroup>;

	brs = parseBranchGroup(gitBranchMergedList(REPO_PATH));

	if (brs)
	{
		console.log(`檢查並刪除已合併分支`);
		console.dir(brs, { colors: true, });

		let pre_name: string;

		pre_name = 'refs/heads/';

		brs.heads
			.forEach(function (value: string, index, array)
			{
				fn(value, pre_name + value);
			})
		;

		pre_name = 'refs/remotes/';

		Object.keys(brs.remotes)
			.forEach(function (remote_name)
			{
				let prefix = pre_name + remote_name + '/';

				let brs_list = brs.remotes[remote_name];

				if (brs_list.length > 5)
				{
					brs_list = brs_list
						.filter(function (value)
						{
							let bool = /auto\//i.test(value);

							return bool;
						})
						.slice(0, -2)
					;

					brs_list
						.forEach(function (value: string, index, array)
						{
							let bool = !/auto\//i.test(value);
							let del_name = prefix + value;

							fn(value, del_name, bool, true, remote_name);
						})
					;
				}
			})
		;
	}

	brs = parseBranchGroup(gitBranchMergedList(REPO_PATH, true));

	if (brs)
	{
		console.log(`檢查並刪除未合併過期分支`);
		console.dir(brs, { colors: true, });

		let pre_name: string;

		pre_name = 'refs/heads/';

		brs.heads
			.forEach(function (value: string, index, array)
			{
				fn(value, pre_name + value);
			})
		;

		pre_name = 'refs/remotes/';

		Object.keys(brs.remotes)
			.forEach(function (remote_name)
			{
				if (remote_name == 'origin')
				{
					return;
				}

				let prefix = pre_name + remote_name + '/';

				let brs_list = brs.remotes[remote_name];

				if (brs_list.length > 5)
				{
					let max_date_unix = 0;

					brs_list = brs_list
						.filter(function (value)
						{
							let bool = /auto\//i.test(value);

							if (bool)
							{
								let d = branchNameToDate(value);

								//console.log(d, d.unix());

								max_date_unix = Math.max(max_date_unix, d.unix());
							}

							return bool;
						})
						.slice(0, -3)
					;

					let max_date = moment.unix(max_date_unix);

					brs_list
						.forEach(function (value: string, index, array)
						{
							let bool = !/^auto\//i.test(value);
							let del_name = prefix + value;

							fn(value, del_name, bool, true, remote_name);
						})
					;
				}
			})
		;
	}

	function fn(value: string, del_name: string, skip?: boolean, is_remote?: boolean, remote_name?: string)
	{
		let value_lc = value.toLowerCase();

		if (skip)
		{
			console.log(`skip (1) ${del_name}`);
			return;
		}
		else if (!value || value_lc == br_name || value_lc == 'master' || value_lc == 'head')
		{
			console.log(`skip (2) ${del_name}`);
			return;
		}
		else if (is_remote)
		{
			if (!/auto\//i.test(value) || !remote_name)
			{
				console.log(`skip (3) ${del_name}`);
				return;
			}

			let d = moment(value.replace(/^.*auto\//, ''), DATE_FORMAT);

			//console.log(d);
		}

		console.info(`try delete ${del_name}`);

		if (is_remote)
		{
			deleteBranchRemote(REPO_PATH, remote_name, value);
		}
		else
		{
			deleteBranch(REPO_PATH, value);
		}

		data_ret = true;
	}

	return data_ret;
}

export function gitBranchMergedList(REPO_PATH: string, noMerged?: boolean, BR_NAME?: string)
{
	let cp = crossSpawnSync('git', filterArgv([
		'branch',
		'--format',
		'%(refname)',
		'-a',
		noMerged ? '--no-merged' : '--merged',
		BR_NAME,
	]), {
		cwd: REPO_PATH,
	});

	if (cp.stderr && cp.stderr.length)
	{
		console.error(cp.stderr.toString());

		return null
	}

	let name = crossSpawnOutput(cp.stdout);

	return name
		.split(LF)
		;
}

export function filterArgv(argv: string[])
{
	return argv
		.filter(v => typeof v !== 'undefined')
		.map(v => v.trim())
		;
}

export function parseBranchGroup(r: string[]): {
	heads: string[];
	remotes: {
		origin: string[];
		[k: string]: string[];
	};
}
{
	if (!r || !r.length)
	{
		return null;
	}

	return r.sort().reduce(function (a, b)
	{
		if (/^refs\/remotes\/([^\/]+)\/(.+)$/.exec(b))
		{
			let { $1, $2 } = RegExp;
			a.remotes[$1] = a.remotes[$1] || [];
			a.remotes[$1].push($2);
		}
		else if (/^refs\/heads\/(.+)$/.exec(b))
		{
			let { $1, $2 } = RegExp;
			a.heads.push($1);
		}

		return a;
	}, {
		heads: [],
		remotes: {
			origin: [],
		},
	})
}

export function gitCleanAll(REPO_PATH: string)
{
	console.info(`[git:clean] Remove untracked files from the working tree`);
	return crossSpawnSync('git', [
		'clean',
		'-d',
		'-fx',
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}
