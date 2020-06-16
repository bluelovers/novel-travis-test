"use strict";
/**
 * Created by user on 2019/6/18.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const FastGlob = require("@bluelovers/fast-glob");
const project_config_1 = require("../../project.config");
const fs = require("fs-extra");
const path = require("path");
const log_1 = require("../../lib/log");
const config_1 = require("@node-novel/task/lib/config");
FastGlob([
    '**/*',
], {
    cwd: project_config_1.default.cache_root,
})
    .then(async (ls) => {
    log_1.console.dir(ls);
    log_1.console.dir(project_config_1.default.project_root);
    log_1.console.info(`loadCacheConfig`);
    log_1.console.dir(config_1.loadCacheConfig(project_config_1.default.project_root));
    log_1.console.info(`.cache.json`);
    await fs.readJSON(path.join(project_config_1.default.cache_root, '.cache.json')).then(data => log_1.console.dir(data)).catch(e => null);
    log_1.console.info(`epub.json`);
    await fs.readJSON(path.join(project_config_1.default.cache_root, 'epub.json')).then(data => log_1.console.dir(data)).catch(e => null);
});
//# sourceMappingURL=print.js.map