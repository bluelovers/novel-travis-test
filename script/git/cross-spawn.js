"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossSpawnSyncGit = void 0;
const __1 = require("../..");
const log_1 = require("../../lib/log");
const cross_spawn_1 = require("../../lib/util/cross-spawn");
/**
 * use for some git cmd
 */
function crossSpawnSyncGit(bin, args, options) {
    let print;
    if (options) {
        if (options.stdio == 'inherit') {
            print = true;
            delete options.stdio;
        }
    }
    let cp = __1.crossSpawnSync(bin, args, options);
    print && log_1.default.log(__1.crossSpawnOutput(cp.output));
    if (cp.stderr && cp.stderr.length) {
        let s1 = String(cp.stderr);
        let s2 = cross_spawn_1.stripAnsi(s1);
        if (/^fatal\:/m.test(s2)) {
            let e = new Error(s1);
            cp.error = cp.error || e;
            // @ts-ignore
            cp.errorCrossSpawn = e;
            throw e;
        }
        log_1.default.info(`cp.stderr`);
        log_1.default.warn(s1);
    }
    return cp;
}
exports.crossSpawnSyncGit = crossSpawnSyncGit;
//# sourceMappingURL=cross-spawn.js.map