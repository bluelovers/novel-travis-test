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

			let _p = [
				{
					id: 10539227,
					br: `${br_name}`,
				},
				{
					id: 10538240,
					br: `master`,
				},
			];

			let _i = 0;
			let _ij = Math.abs(_i - 1);

			const api = apiGitlab();

			let projectId = decodeProjectId(_p[_i].id);

			let sourceBranch: string = _p[_i].br;
			let targetBranch: string = _p[_ij].br;

//			sourceBranch = encodeProjectId(sourceBranch);

			let target_project_id: number = _p[_ij].id;

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

							target_project_id,

							//squash: true,
						},
					)
				})
				.tap(function (ret: IGitlabMergeRequestsCreateReturn)
				{
					let data = filterGitlabMergeRequestsCreateReturn(ret);

					if (!data.merge_status || String(data.merge_status) == 'cannot_be_merged')
					{
						console.error(`建立 PR 失敗 #${data.id} ${data.title}`);
						console.red.dir(data);
					}
					else
					{
						console.success(`成功建立 PR #${data.id} ${data.title}`);
						console.dir(data);
					}
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

					//console.dir(err);

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

	statusCode: number,
	statusMessage: number,

	body: {
		message: string[],
	},
}

export interface IGitlabMergeRequestsCreateReturn
{
	id: number,
	iid: number,
	project_id: number,

	state: string,

	title: string,
	description: string,

	created_at: string,
	updated_at: string,

	target_branch: string,
	source_branch: string,

	source_project_id: number,
	target_project_id: number,

	labels: string[],

	work_in_progress: boolean,

	merge_status: string,
	merge_error: any,

	squash: boolean,
	changes_count: number,

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
		iid,
		project_id,

		title,
		description,

		state,

		created_at,
		updated_at,

		target_branch,
		source_branch,

		target_project_id,
		source_project_id,

		labels,
		work_in_progress,

		merge_status,
		merge_error,

		squash,
		changes_count,

		should_remove_source_branch,

		web_url,

		diff_refs,

	} = ret;

	/*
	console.dir(ret, {
		depth: 5,
		colors: true,
	});
	*/

	return {
		id,
		iid,
		project_id,

		title,
		description,

		state,

		created_at,
		updated_at,

		target_branch,
		source_branch,

		target_project_id,
		source_project_id,

		labels,
		work_in_progress,

		merge_status,
		merge_error,

		squash,
		changes_count,

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
		/*
		const api = new ProjectsBundle({
			token: _env.ACCESS_TOKEN,
		});
		*/
		const api = new Gitlab({
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

export function encodeProjectId(projectId: number): number
export function encodeProjectId(projectId: string): string
export function encodeProjectId(projectId: ProjectId): ProjectId
export function encodeProjectId(projectId: ProjectId): ProjectId
{
	if (typeof projectId === 'string')
	{
		if (/^\d+$/.test(projectId))
		{
			return projectId;
		}

		let arr = projectId.split(/%2F|\//);

		return arr.join('%2F');
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
