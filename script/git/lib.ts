import { crossSpawnSync } from '../..';
import console from '../../lib/log';
import { currentBranchName } from '../git';
import { crossSpawnSyncGit } from './cross-spawn';
import { NO_PUSH, NOT_DONE, PROJECT_ROOT } from '../init';
import { filterArgv } from '../../lib/util';

export function gitSetRemote(REPO_PATH: string, remoteUrl: string, remoteName: string)
{
	remoteName = remoteName || 'origin';

	console.debug(`嘗試覆寫遠端設定於 ${REPO_PATH}`);

	console.debug(`移除舊的遠端 ${remoteName}`);

	crossSpawnSync('git', [
		'remote',
		'rm',
		remoteName,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});

	console.debug(`設定遠端 ${remoteName}`);

	return crossSpawnSyncGit('git', [
		'remote',
		'add',
		'--no-tags',
		remoteName,
		remoteUrl,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});
}

export function pushGit(REPO_PATH: string, repo: string, force?: boolean)
{
	let argv = [
		'push',
		'--progress',
		force ? '--force' : undefined,
		repo,
	];

	argv = filterArgv(argv);

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

export function gitSetUpstream(REPO_PATH: string, remoteAndBranch: string, localBranch: string)
{
	let old_name = currentBranchName(REPO_PATH);

	crossSpawnSync('git', [
		'branch',
		'-u',
		remoteAndBranch,
		localBranch,
	], {
		stdio: 'inherit',
		cwd: REPO_PATH,
	});

	let new_name = currentBranchName(REPO_PATH);

	if (old_name && old_name != new_name)
	{
		crossSpawnSync('git', [
			'checkout',
			old_name,
		], {
			stdio: 'inherit',
			cwd: REPO_PATH,
		});
	}
}
