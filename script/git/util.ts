import { DATE_FORMAT } from '../git';
import { GIT_TOKEN } from './token';
import moment = require('moment');

export function branchNameToDate(br_name: string)
{
	return moment(br_name.replace(/^.*auto\//, ''), DATE_FORMAT)
}

export function getPushUrl(url: string, login_token?: string)
{
	if (login_token && !/@$/.test(login_token))
	{
		login_token += '@';
	}

	return `https://${login_token ? login_token : ''}${url}`;
}

export function getPushUrlGitee(url: string, login_token: string = GIT_TOKEN)
{
	return getPushUrl(url, login_token);
}
