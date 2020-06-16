"use strict";
/**
 * Created by user on 2018/12/11/011.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../../project.config");
const path = require("upath2");
const log_1 = require("../../lib/log");
let epub_json = path.join(project_config_1.default.cache_root, 'epub.json');
fs.pathExists(epub_json)
    .then(async function (bool) {
    log_1.default.debug('[exists]', bool, epub_json);
    if (bool) {
        await fs.remove(epub_json);
        log_1.default.debug('[delete]', epub_json);
    }
});
//# sourceMappingURL=reset-epub-init-cahche.js.map