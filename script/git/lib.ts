import { crossSpawnSync } from '../..';
import console from '../../lib/log';
import { crossSpawnSyncGit } from './cross-spawn';

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
