/**
 * Created by user on 2018/9/3/003.
 */

if (process && process.env)
{
	process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';
}

import { Console } from 'debug-color2';
export const console = new Console(null, {
	enabled: true,
	inspectOptions: {
		colors: true,
	},
	chalkOptions: {
		enabled: true,
	},
});

console.enabledColor = true;

export default console
