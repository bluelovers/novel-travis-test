"use strict";
/**
 * Created by user on 2018/9/3/003.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.console = void 0;
if (process && process.env) {
    process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';
}
const debug_color2_1 = require("debug-color2");
exports.console = debug_color2_1.default;
debug_color2_1.default.enabled = true;
debug_color2_1.default.chalkOptions = {
    ...debug_color2_1.default.chalkOptions,
    enabled: true,
};
debug_color2_1.default.inspectOptions = {
    ...debug_color2_1.default.inspectOptions,
    colors: true,
};
debug_color2_1.default.enabledColor = true;
exports.default = debug_color2_1.default;
//# sourceMappingURL=log.js.map