/**
 * Created by user on 2018/9/5/005.
 */
import console from './log';
import pretty = require('prettyuse');

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
