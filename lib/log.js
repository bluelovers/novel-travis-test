"use strict";
/**
 * Created by user on 2018/9/3/003.
 */
Object.defineProperty(exports, "__esModule", { value: true });
if (process && process.env) {
    process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';
}
const debug_color2_1 = require("debug-color2");
exports.console = new debug_color2_1.Console();
exports.console.setOptions({
    enabled: true,
    inspectOptions: {
        colors: true,
    },
    chalkOptions: {
        enabled: true,
    },
});
exports.console.enabledColor = true;
exports.default = exports.console;
