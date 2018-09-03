/**
 * Created by user on 2018/9/3/003.
 */

import { Console } from 'debug-color2';
export const console = new Console();

console.enabledColor = true;

console.setOptions({
	inspectOptions: {
		colors: true,
	}
});

export default console
