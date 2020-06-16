"use strict";
/**
 * Created by user on 2018/5/19/019.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yargs = require("yargs");
const project_config_1 = require("../project.config");
const path = require("upath2");
const log_1 = require("../lib/log");
if (yargs.argv.last) {
    let cache_json = path.join(project_config_1.default.cache_root, '.cache.json');
    if (fs.existsSync(cache_json)) {
        let data = fs.readJSONSync(cache_json);
        data.last = yargs.argv.last;
        fs.outputJSONSync(cache_json, data, {
            spaces: '\t',
        });
        log_1.default.debug(`update .cache.json { last: ${yargs.argv.last} }`);
    }
}
//# sourceMappingURL=_set_cache.js.map