"use strict";
/**
 * Created by user on 2018/12/11/011.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../../project.config");
const path = require("upath2");
const log_1 = require("../../lib/log");
const yargs = require("yargs");
var EnumCacheName;
(function (EnumCacheName) {
    EnumCacheName["toc_contents"] = ".toc_contents.cache";
    EnumCacheName["cache_json"] = ".cache.json";
    EnumCacheName["epub_json"] = "epub.json";
})(EnumCacheName || (EnumCacheName = {}));
let { target } = yargs
    .option('target', {
    alias: ['t'],
    type: 'string',
    demandOption: true,
})
    .usage('npm run reset-init-cahche -- -t toc_contents')
    .showHelpOnFail(true)
    .strict()
    .argv;
let file_name = EnumCacheName[target];
if (!target || !file_name) {
    yargs.showHelp();
    throw new TypeError(`target (${target}) not exists`);
}
let cache_file = path.join(project_config_1.default.cache_root, file_name);
fs.pathExists(cache_file)
    .then(async function (bool) {
    log_1.default.debug('[exists]', bool, cache_file);
    if (bool) {
        await fs.remove(cache_file);
        log_1.default.debug('[delete]', cache_file);
    }
});
//# sourceMappingURL=reset-init-cahche.js.map