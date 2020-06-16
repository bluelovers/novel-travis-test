"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCacheConfigHashHEAD = void 0;
const fs = require("fs-extra");
const log_1 = require("../../lib/log");
const git_1 = require("../git");
const init_1 = require("../init");
function updateCacheConfigHashHEAD() {
    if (init_1.CacheConfig) {
        let currentHEADNew = git_1.getHashHEAD(init_1.DIST_NOVEL);
        let config = fs.readJSONSync(init_1.CacheConfig.filepath);
        config.last = currentHEADNew;
        config.last_push_head = currentHEADNew;
        fs.writeJSONSync(init_1.CacheConfig.filepath, config, {
            spaces: 2,
        });
        log_1.default.dir(config);
    }
}
exports.updateCacheConfigHashHEAD = updateCacheConfigHashHEAD;
//# sourceMappingURL=cache-json.js.map