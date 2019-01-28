/**
 * Created by user on 2018/9/5/005.
 */
import console from './log';
import emailNormalize = require('email-normalize');
import pretty = require('prettyuse');
import UString = require('uni-string');

export function memoryUsage(): string
{
	return pretty();
}

export function showMemoryUsage(con = console)
{
	con.log(memoryUsage());
}

export function freeGC(showmem?: boolean)
{
	if (showmem)
	{
		showMemoryUsage();
	}

	if (global && typeof global.gc === 'function')
	{
		try
		{
			global.gc();
		}
		catch (e)
		{
			console.error(e);
		}
	}
}

export function qrcode_link(url: string, size?: number)
{
	size = size || 150;

	return `https://chart.apis.google.com/chart?cht=qr&chs=${size}x${size}&chl=${url}`
}

export function git_fake_author(name?: string, email?: string)
{
	email = emailNormalize(email || 'testbot@test.test')
		.replace(/^[\s　@]+|[\s　@]+$/g, '')
	;

	if (email.split('@').length !== 2)
	{
		email = null;
	}

	name = (name || '')
		.replace(/[\-\+\<\>\[\]\?\*@\s"\'`~\{\}]+/ig, ' ')
		;

	try
	{
		name = name
			.replace(/[\p{Punctuation}]/uig, function (s)
			{
				if (/^[\.]$/.test(s))
				{
					return s;
				}

				return ' ';
			})
			.replace(/^[\s　\p{Punctuation}]+|[\s　\p{Punctuation}]+$/ug, '')
		;
	}
	catch (e)
	{

	}

	name = name
		.replace(/^[\s　]+|[\s　\.]+$/g, '')
		.replace(/\s+/g, ' ')
	;

	if (/[^\w \.]/.test(name) && UString.size(name) > 15)
	{
		name = UString.slice(name, 0, 20);
	}

	return `${name || 'testbot'} <${email || 'testbot@test.test'}>`;
}

export function filterArgv(argv: string[])
{
	return argv
		.filter(v => v != null)
		.map(v => v.trim())
		;
}
