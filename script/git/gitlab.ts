/**
 * Created by user on 2019/1/26/026.
 */

import { ProjectId } from 'gitlab/types/types';
import { currentBranchName } from '../git';
import ProjectConfig, { novel_root } from '../../project.config';
import { config as dotenvConfig } from 'dotenv';
import path = require('upath2');
import console from '../../lib/log';
import Bluebird = require('bluebird');

import { Gitlab, ProjectsBundle } from 'gitlab';
import * as APIServices from 'gitlab/dist/services';
import { expect } from 'chai';

export function createPullRequestsGitlab(): Bluebird<IGitlabMergeRequestsCreateReturn>
{
	// @ts-ignore
	return Bluebird.resolve()
		.then(async function ()
		{
			console.info(`嘗試建立 PR`);

			let br_name = currentBranchName(novel_root);

			if (!br_name.match(/^auto\//))
			{
				console.error(`目前分支為 ${br_name} 忽略建立 PR`);

				return;
			}
			else
			{
				console.info(`目前分支為 ${br_name}`);
			}

			const api = apiGitlab();

			let projectId = decodeProjectId('novel-group/txt-source');

			let sourceBranch: string = `demonovel/txt-source:${br_name}`;
			let targetBranch: string = 'master';

			let title: string = `auto pr (${br_name})`;

			// @ts-ignore
			return Bluebird.resolve()
				.then(function ()
				{
					return (api.MergeRequests as APIServices.MergeRequests).create(
						projectId,
						sourceBranch,
						targetBranch,
						title,
						{
							remove_source_branch: true,
							allow_collaboration: true,
							allow_maintainer_to_push: true,
							/*
							labels: [

							].join(','),
							*/
						},
					)
				})
				.tap(function (ret: IGitlabMergeRequestsCreateReturn)
				{
					let data = filterGitlabMergeRequestsCreateReturn(ret);

					console.success(`成功建立 PR #${data.id} ${data.title}`);
					console.dir(data);
				})
				.catch(function (err: IGitlabMergeRequestsCreateError)
				{
					let _know_error = false;

					if (err.body)
					{
						if (err.body.message && String(err.body.message).match(/Another open merge request already exists for this source branch/))
						{
							_know_error = true;

							console.info(`本次使用的分支已經建立過 PR，無須在意此錯誤訊息`);
						}
					}

					if (_know_error)
					{
						console.info(err.toString());
						console.dir(err.body);
					}
					else
					{
						console.error(`建立 PR 失敗`);
						console.error(err.toString());
						console.red.dir(err.body);
					}

					return err
				})
				.catch(e => e)
				;
		})
	;
}

export default createPullRequestsGitlab;

type HTTPError = Error

export type IGitlabMergeRequestsCreateError = HTTPError & {
	body: {
		message: string,
	},
}

export interface IGitlabMergeRequestsCreateReturn
{
	id: number,
	title: string,
	description: string,

	created_at: string,
	updated_at: string,

	target_branch: string,
	source_branch: string,

	labels: string[],

	work_in_progress: boolean,

	merge_status: string,
	merge_error: any,

	should_remove_source_branch: boolean,

	web_url: string,

	diff_refs: {
		base_sha: string,
		head_sha: string,
		start_sha: string,
	},

}

export function filterGitlabMergeRequestsCreateReturn(ret: IGitlabMergeRequestsCreateReturn)
{
	let {
		id,
		title,
		description,

		created_at,
		updated_at,

		target_branch,
		source_branch,

		labels,
		work_in_progress,

		merge_status,
		merge_error,

		should_remove_source_branch,

		web_url,

		diff_refs,

	} = ret;

	return {
		id,
		title,
		description,

		created_at,
		updated_at,

		target_branch,
		source_branch,

		labels,
		work_in_progress,

		merge_status,
		merge_error,

		should_remove_source_branch,

		web_url,

		diff_refs,
	}
}

export function apiGitlab()
{
	console.info(`連接 api`);

	let _env = _getEnvGitlab();

	try
	{
		const api = new ProjectsBundle({
			token: _env.ACCESS_TOKEN,
		});

		return api;
	}
	catch (e)
	{
		console.error(`連接 api 失敗`);
		console.error(e.message);
	}
}

/**
 * because gitlab will auto do `const pId = encodeURIComponent(projectId);`
 */
export function decodeProjectId(projectId: ProjectId): ProjectId
{
	if (typeof projectId === 'string')
	{
		if (/^\d+$/.test(projectId))
		{
			return projectId;
		}

		let arr = projectId.split(/%2F|\//);

		expect(arr).have.lengthOf(2);

		return arr.join('/');
	}

	expect(projectId).a('number');

	return projectId;
}

export function _getEnvGitlab()
{
	let ACCESS_TOKEN: string = process.env.GITLAB_ACCESS_TOKEN || '';
	let TOKEN: string = process.env.GITLAB_TOKEN || '';

	if (!ACCESS_TOKEN || !TOKEN)
	{
		let env = dotenvConfig({ path: path.join(ProjectConfig.project_root, '.env') });

		if (env.parsed)
		{
			ACCESS_TOKEN = ACCESS_TOKEN || env.parsed.GITLAB_ACCESS_TOKEN;

			TOKEN = TOKEN || env.parsed.GITLAB_TOKEN;
		}
	}

	return {
		/**
		 * for api. Can be created in your profile.
		 * https://gitlab.com/profile/personal_access_tokens
		 */
		ACCESS_TOKEN,
		/**
		 * username:password@
		 */
		TOKEN,
	}
}
