/**
 * Created by user on 2018/9/3/003.
 */

if (process && process.env)
{
	process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';
}

import console from 'debug-color2';

console.enabled = true
console.chalkOptions = {
	...console.chalkOptions,
	enabled: true,
}
console.inspectOptions = {
	...console.inspectOptions,
	colors: true,
}

console.enabledColor = true;

export { console }

export default console
