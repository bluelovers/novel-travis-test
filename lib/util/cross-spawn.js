"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossSpawnOutput = exports.getCrossSpawnError = exports.crossSpawnSync = exports.crossSpawnAsync = exports.stripAnsi = void 0;
const crlf_normalize_1 = require("crlf-normalize");
const cross_spawn_extra_1 = require("cross-spawn-extra");
Object.defineProperty(exports, "crossSpawnAsync", { enumerable: true, get: function () { return cross_spawn_extra_1.async; } });
const core_1 = require("cross-spawn-extra/core");
exports.stripAnsi = core_1.CrossSpawnExtra.stripAnsi;
function crossSpawnSync(...argv) {
    let cp = cross_spawn_extra_1.sync(...argv);
    delete cp.then;
    // @ts-ignore
    delete cp.catch;
    return cp;
}
exports.crossSpawnSync = crossSpawnSync;
function getCrossSpawnError(cp) {
    return cp.error
        // @ts-ignore
        || cp.errorCrossSpawn;
}
exports.getCrossSpawnError = getCrossSpawnError;
function crossSpawnOutput(buf, options = {
    clearEol: true,
}) {
    let output = '';
    if (Array.isArray(buf)) {
        output = buf
            .filter(function (b) {
            return !(!b || !b.length);
        })
            .map(function (b) {
            return b.toString();
        })
            .join("\n");
    }
    else {
        output = (buf || '').toString();
    }
    output = crlf_normalize_1.crlf(output);
    if (options.clearEol) {
        output = output.replace(/\n+$/g, '');
    }
    return output;
}
exports.crossSpawnOutput = crossSpawnOutput;
//# sourceMappingURL=cross-spawn.js.map