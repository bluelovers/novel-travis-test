/**
 * Created by user on 2018/5/28/028.
 */

import getToken from 'gitee-api-token';
import ClientRequest from 'client-oauth2-request';
import { currentBranchName } from './git';
import ProjectConfig, { novel_root } from '../project.config';
import { config as dotenvConfig } from 'dotenv';
import path = require('upath2');

export async function createPullRequests()
{
	console.log(`嘗試建立 PR`);

	let GITEE_ACCESS_TOKEN = process.env.GITEE_ACCESS_TOKEN || '';
	let GITEE_CLIENT_ID = process.env.GITEE_CLIENT_ID || '';
	let GITEE_CLIENT_SECRET = process.env.GITEE_CLIENT_SECRET || '';
	let GITEE_TOKEN1 = process.env.GITEE_TOKEN1 || '';
	let GITEE_TOKEN2 = process.env.GITEE_TOKEN2 || '';

	if (!GITEE_ACCESS_TOKEN || !GITEE_CLIENT_ID || !GITEE_CLIENT_SECRET)
	{
		let env = dotenvConfig({ path: path.join(ProjectConfig.project_root, '.env') });

		if (env.parsed)
		{
			GITEE_ACCESS_TOKEN = GITEE_ACCESS_TOKEN || env.parsed.GITEE_ACCESS_TOKEN;
			GITEE_CLIENT_ID = GITEE_CLIENT_ID || env.parsed.GITEE_CLIENT_ID;
			GITEE_CLIENT_SECRET = GITEE_CLIENT_SECRET || env.parsed.GITEE_CLIENT_SECRET;

			GITEE_TOKEN1 = GITEE_TOKEN1 || env.parsed.GITEE_TOKEN1;
			GITEE_TOKEN2 = GITEE_TOKEN2 || env.parsed.GITEE_TOKEN2;
		}
	}

	let token = await getToken({

		//access_token: GITEE_ACCESS_TOKEN,

		username: GITEE_TOKEN1,
		password: GITEE_TOKEN2,

		clientId: GITEE_CLIENT_ID,
		clientSecret: GITEE_CLIENT_SECRET,

		scopes: 'pull_requests',

	}).catch(function (err)
	{
		console.error(err);
	});

	if (!token)
	{
		console.error(`無法取得 token`);

		return;
	}

	let rq = new ClientRequest(token, {
		apiRoot: 'https://gitee.com/api/'
	});

	let br_name = currentBranchName(novel_root);

	if (!br_name.match(/^auto\//))
	{
		console.error(`目前分支為 ${br_name} 忽略建立 PR`);

		return;
	}

	await rq
		.fetchSign('/v5/repos/bluelovers/novel/pulls', {
			method: 'POST',
			body: {
				title: br_name,
				head: `demogitee:${br_name}`,
				base: 'master',
				body: 'auto pr',
			},
		})
		.tap(function (ret: {
			number: number,
			title: string,
		})
		{
			console.log(`成功建立 PR #${ret.number} ${ret.title}`);
			//console.dir(ret);
		})
		.catch(function (err)
		{
			console.error(err.toString());
			console.error(err.code, err.status, err.body);
		})
	;
}

export default createPullRequests;
