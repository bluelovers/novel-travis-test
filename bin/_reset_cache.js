"use strict";
/**
 * Created by user on 2018/9/3/003.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const FastGlob = require("fast-glob");
const fs = require("fs-extra");
const yargs = require("yargs");
const path = require("upath2");
const Promise = require("bluebird");
const project_config_1 = require("../project.config");
const log_1 = require("../lib/log");
let argv = yargs.argv;
var MODE;
(function (MODE) {
    MODE["LAST_NOT_DONE"] = "LAST_NOT_DONE";
})(MODE || (MODE = {}));
(async () => {
    log_1.default.debug('argv=', argv);
    if (argv.mode == MODE.LAST_NOT_DONE) {
        log_1.default.info(`檢查並刪除 .cache/files 底下的 */*.json`);
        let ls = await FastGlob([
            '*/*.json',
        ], {
            cwd: path.join(project_config_1.default.cache_root, 'files'),
            absolute: true,
        });
        Promise.each(ls, async function (file) {
            log_1.default.log(`try delete ${file}`);
            return fs.remove(file);
        });
    }
    else {
        log_1.default.error(`參數錯誤 沒有執行任何 腳本`);
    }
})();
//# sourceMappingURL=_reset_cache.js.map